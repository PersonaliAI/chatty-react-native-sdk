import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  ChattyClient,
  ChattyClientOptions,
  ChattyTheme,
} from "./api";
import { getOrCreateSessionId, newSession } from "./session";

const MSGS_KEY = (botId: string, host: string) => `chatty_msgs_${botId}_${host}`;

export type ChattyRole = "user" | "assistant" | "agent";

export interface ChattyMessage {
  id: string;
  role: ChattyRole;
  text: string;
  createdAt: string;
  fileUrl?: string;
  fileType?: string;
}

export interface UseChattyChatOptions extends ChattyClientOptions {
  /** Distinguishes sessions across multiple native apps embedding the same bot. Defaults to "app". */
  hostKey?: string;
  /** Poll interval (ms) for human-agent messages while the chat is open. Defaults to 4000, matching the web widget. */
  pollIntervalMs?: number;
  visitorTimezone?: string;
}

export interface UseChattyChatResult {
  theme: ChattyTheme | null;
  ready: boolean;
  messages: ChattyMessage[];
  sending: boolean;
  aiPaused: boolean;
  error: string | null;
  sendText: (text: string) => Promise<void>;
  sendImage: (file: { uri: string; name: string; type: string }, caption?: string) => Promise<void>;
  /** Clears the local conversation and starts a fresh session — the native equivalent
   * of web's header "clear chat" button. */
  clearChat: () => Promise<void>;
}

// Real IANA zone (e.g. "Asia/Colombo"), not a literal "UTC" default — the assistant uses
// this to skip asking the visitor for their timezone (see widget_brain.py's scheduling
// prompt), same as the web widget already does via the same Intl call. Guarded because
// some release-mode Hermes builds ship without full Intl.DateTimeFormat support — this ran
// unguarded as a destructuring default (i.e. at render time, outside any try/catch) and a
// throw there is an uncaught render-time exception with no JS error boundary to catch it,
// which crashes the whole app on open with no visible error.
function _detectTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

/**
 * Drives a full Chatty conversation: loads bot theme/config, manages the
 * persistent session id, sends messages, and polls for human-agent replies.
 * This is the native-SDK equivalent of widget.js's embed iframe lifecycle.
 */
export function useChattyChat(options: UseChattyChatOptions): UseChattyChatResult {
  const {
    botId, baseUrl, host, hostKey = "app", pollIntervalMs = 4000,
    visitorTimezone = _detectTimezone(),
  } = options;

  const currentClient = useMemo(() => new ChattyClient({ botId, baseUrl, host }), [botId, baseUrl, host]);
  const clientRef = useRef<ChattyClient>(currentClient);
  clientRef.current = currentClient;

  const [theme, setTheme] = useState<ChattyTheme | null>(null);
  const [ready, setReady] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChattyMessage[]>([]);
  const [sending, setSending] = useState(false);
  const [aiPaused, setAiPaused] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastPollAt = useRef<string>(new Date().toISOString());

  const persistMessages = useCallback(
    async (newMsgs: ChattyMessage[]) => {
      try {
        const toSave = newMsgs.slice(-100);
        await AsyncStorage.setItem(MSGS_KEY(botId, host || "app"), JSON.stringify(toSave));
      } catch (e) {
        // silent
      }
    },
    [botId, host]
  );

  useEffect(() => {
    let cancelled = false;
    setReady(false);
    setTheme(null);
    setMessages([]);

    (async () => {
      let hasCached = false;
      try {
        const cachedStr = await AsyncStorage.getItem(MSGS_KEY(botId, host || "app"));
        if (cachedStr) {
          const parsed = JSON.parse(cachedStr);
          if (parsed && parsed.length > 0) {
            if (!cancelled) setMessages(parsed);
            hasCached = true;
          }
        }
      } catch (e) {}

      try {
        const [t, sid] = await Promise.all([
          clientRef.current!.getTheme(),
          getOrCreateSessionId(botId, hostKey),
        ]);
        if (cancelled) return;
        setTheme(t);
        setSessionId(sid);
        if (t.welcome_message && !hasCached) {
          const welcomeMsg = {
            id: "welcome",
            role: "assistant",
            text: t.welcome_message,
            createdAt: new Date().toISOString(),
          } as ChattyMessage;
          setMessages([welcomeMsg]);
          persistMessages([welcomeMsg]);
        }
        setReady(true);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [botId]);

  // Poll for human-agent messages once a session exists.
  useEffect(() => {
    if (!sessionId || !ready) return;
    const interval = setInterval(async () => {
      try {
        const res = await clientRef.current!.poll(sessionId, lastPollAt.current);
        if (res.messages.length > 0) {
          lastPollAt.current = res.messages[res.messages.length - 1].created_at;
          setMessages((prev) => {
            const newMsgs = [
              ...prev,
              ...res.messages.map((m, i) => ({
                id: `poll-${Date.now()}-${i}`,
                role: (m.sender === "agent" ? "agent" : "assistant") as ChattyRole,
                text: m.content,
                createdAt: m.created_at,
              })),
            ];
            persistMessages(newMsgs);
            return newMsgs;
          });
        }
        setAiPaused(!!res.ai_paused);
      } catch {
        // silent — polling failures shouldn't surface as user-facing errors
      }
    }, pollIntervalMs);
    return () => clearInterval(interval);
  }, [sessionId, ready, pollIntervalMs]);

  const sendTextStream = useCallback(
    async (text: string) => {
      if (!sessionId) return;
      const replyId = `reply-${Date.now()}`;
      setMessages((prev) => {
        const newMsgs = [
          ...prev,
          { id: replyId, role: "assistant", text: "", createdAt: new Date().toISOString() },
        ] as ChattyMessage[];
        persistMessages(newMsgs);
        return newMsgs;
      });

      await clientRef.current!.sendMessageStream(
        sessionId,
        text,
        (token) => {
          setMessages((prev) => {
            const idx = prev.findIndex((m) => m.id === replyId);
            if (idx === -1) return prev;
            const newMsgs = [...prev];
            newMsgs[idx] = { ...newMsgs[idx], text: newMsgs[idx].text + token };
            persistMessages(newMsgs);
            return newMsgs;
          });
        },
        visitorTimezone
      );
    },
    [sessionId, visitorTimezone, persistMessages]
  );

  const sendText = useCallback(
    async (text: string) => {
      if (!sessionId || !text.trim()) return;
      const userMsg: ChattyMessage = {
        id: `local-${Date.now()}`,
        role: "user",
        text,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => {
        const newMsgs = [...prev, userMsg];
        persistMessages(newMsgs);
        return newMsgs;
      });
      setSending(true);
      setError(null);
      try {
        await sendTextStream(text);
      } catch (e) {
        try {
          setMessages((prev) => {
            const newMsgs = prev.filter((m) => !(m.role === "assistant" && m.text === ""));
            persistMessages(newMsgs);
            return newMsgs;
          });
          const res = await clientRef.current!.sendMessage(sessionId, text, visitorTimezone);
          setAiPaused(!!res.ai_paused);
          if (!res.ai_paused && res.reply) {
            setMessages((prev) => {
              const newMsgs = [
                ...prev,
                { id: `reply-${Date.now()}`, role: "assistant", text: res.reply, createdAt: new Date().toISOString() },
              ] as ChattyMessage[];
              persistMessages(newMsgs);
              return newMsgs;
            });
          }
        } catch (err) {
          setError(err instanceof Error ? err.message : String(err));
        }
      } finally {
        setSending(false);
      }
    },
    [sessionId, visitorTimezone, persistMessages, sendTextStream]
  );

  const sendImage = useCallback(
    async (file: { uri: string; name: string; type: string }, caption = "") => {
      if (!sessionId) return;
      setSending(true);
      setError(null);
      setMessages((prev) => {
        const newMsgs = [
          ...prev,
          {
            id: `local-img-${Date.now()}`,
            role: "user",
            text: caption,
            createdAt: new Date().toISOString(),
            fileUrl: file.uri,
            fileType: file.type,
          },
        ] as ChattyMessage[];
        persistMessages(newMsgs);
        return newMsgs;
      });
      try {
        const res = await clientRef.current!.sendMedia(sessionId, file, caption, visitorTimezone);
        setAiPaused(!!res.ai_paused);
        if (!res.ai_paused && res.reply) {
          setMessages((prev) => {
            const newMsgs = [
              ...prev,
              { id: `reply-${Date.now()}`, role: "assistant", text: res.reply, createdAt: new Date().toISOString() },
            ] as ChattyMessage[];
            persistMessages(newMsgs);
            return newMsgs;
          });
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setSending(false);
      }
    },
    [sessionId, visitorTimezone, persistMessages]
  );

  const clearChat = useCallback(async () => {
    const sid = await newSession(botId, hostKey);
    setSessionId(sid);
    lastPollAt.current = new Date().toISOString();
    setAiPaused(false);
    setError(null);
    if (theme?.welcome_message) {
      const welcomeMsg: ChattyMessage = {
        id: "welcome",
        role: "assistant",
        text: theme.welcome_message,
        createdAt: new Date().toISOString(),
      };
      setMessages([welcomeMsg]);
      await persistMessages([welcomeMsg]);
    } else {
      setMessages([]);
      await persistMessages([]);
    }
  }, [botId, hostKey, theme, persistMessages]);

  return { theme, ready, messages, sending, aiPaused, error, sendText, sendImage, clearChat };
}
