// NOTE: written without the ability to compile/run React Native, LiveKit's
// SDK, or a device/simulator in this environment — build and test a real
// call end-to-end before bumping this package's version or publishing it.
// `@livekit/react-native`, `livekit-client`, and `@livekit/react-native-webrtc`
// are optional peer dependencies: only an app that actually renders
// ChattyVoiceCallView needs them installed (and `registerGlobals()` called
// once at app startup — see this file's own comment below and the README).
//
// Mirrors the web widget's voice-call-widget.tsx as closely as RN's APIs
// allow: same token-fetch endpoint, same LiveKit Room/RoomEvent primitives
// (re-exported by @livekit/react-native with RN's WebRTC bridge swapped in
// for the browser's native WebRTC), same call states, live transcript, and
// per-design theming via CHATTY_DESIGN_TOKENS.
import React, { useEffect, useRef, useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, StyleSheet, Animated, Platform } from "react-native";
import { Room, RoomEvent, ConnectionState, type TranscriptionSegment, type Participant, type RemoteParticipant, type RemoteTrack } from "livekit-client";
import { setupIOSAudioManagement } from "@livekit/react-native";
import { ChattyClient, ChattyVoiceToken } from "./api";
import { CHATTY_DESIGN_TOKENS, chattyNormalizeWidgetStyle } from "./designTokens";

type CallStatus = "connecting" | "requesting-mic" | "connected" | "listening" | "agent-speaking" | "error" | "ended";

interface TranscriptEntry {
  id: string;
  speaker: "visitor" | "agent";
  text: string;
  final: boolean;
}

export interface ChattyVoiceCallViewProps {
  client: ChattyClient;
  sessionId: string;
  widgetStyle?: string | null;
  visitorTimezone?: string;
  onClose: () => void;
}

/**
 * Full-screen (or modal) voice-call UI — present this when the chat view's
 * phone button is tapped and `theme.voice_enabled` is true, e.g.:
 *
 *   {showCall && (
 *     <ChattyVoiceCallView client={client} sessionId={sessionId}
 *       widgetStyle={theme?.widget_style} onClose={() => setShowCall(false)} />
 *   )}
 *
 * Requires (app-level, once): `import { registerGlobals } from
 * "@livekit/react-native"; registerGlobals();` before any Room is created —
 * typically at the top of index.js. iOS also needs an AudioSession category
 * configured (see @livekit/react-native's AudioSession helper) for the mic
 * to route correctly during a call.
 */
export function ChattyVoiceCallView({ client, sessionId, widgetStyle, visitorTimezone = "UTC", onClose }: ChattyVoiceCallViewProps) {
  const [status, setStatus] = useState<CallStatus>("connecting");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [muted, setMuted] = useState(false);
  const [duration, setDuration] = useState(0);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const roomRef = useRef<Room | null>(null);
  const mountedRef = useRef(true);
  const durationIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  const pulse = useRef(new Animated.Value(1)).current;

  const designId = chattyNormalizeWidgetStyle(widgetStyle);
  const t = CHATTY_DESIGN_TOKENS[designId];

  useEffect(() => {
    // iOS routes audio very differently for a mic+speaker call than for
    // plain playback — without this, calls can come out silent or route to
    // the earpiece instead of the speaker. No Android equivalent needed.
    if (Platform.OS !== "ios") return;
    const cleanup = setupIOSAudioManagement(true);
    return cleanup;
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    let cancelled = false;

    async function start() {
      let room: Room | null = null;
      try {
        const tok: ChattyVoiceToken = await client.getVoiceToken(sessionId, visitorTimezone);

        room = new Room();
        roomRef.current = room;

        room.on(RoomEvent.Disconnected, () => {
          if (!cancelled && mountedRef.current) setStatus((s) => (s === "error" ? s : "ended"));
        });

        room.on(RoomEvent.ConnectionStateChanged, (state: ConnectionState) => {
          if (cancelled || !mountedRef.current) return;
          if (state === ConnectionState.Connected) {
            setStatus((s) => (s === "agent-speaking" ? s : "connected"));
          }
        });

        // The agent's audio track — RN's Room auto-plays subscribed remote
        // audio through the device's call/media output, no manual <audio>
        // element to attach the way the web widget needs.
        room.on(RoomEvent.TrackSubscribed, (_track: RemoteTrack, _pub, _participant: RemoteParticipant) => {
          // no-op: playback is automatic on RN
        });

        room.on(
          RoomEvent.TranscriptionReceived,
          (segments: TranscriptionSegment[], participant?: Participant) => {
            if (cancelled || !mountedRef.current) return;
            const speaker: "visitor" | "agent" =
              !participant || participant.identity === room?.localParticipant?.identity ? "visitor" : "agent";
            setTranscript((prev) => {
              const next = [...prev];
              for (const seg of segments) {
                const idx = next.findIndex((e) => e.id === seg.id);
                const entry: TranscriptEntry = { id: seg.id, speaker, text: seg.text, final: seg.final };
                if (idx >= 0) next[idx] = entry;
                else next.push(entry);
              }
              return next;
            });
          }
        );

        room.on(RoomEvent.ActiveSpeakersChanged, (speakers) => {
          if (cancelled || !mountedRef.current) return;
          const localIdentity = room?.localParticipant?.identity;
          let remoteLevel = 0;
          let localSpeaking = false;
          for (const p of speakers) {
            if (p.identity === localIdentity) localSpeaking = true;
            else remoteLevel = Math.max(remoteLevel, p.audioLevel ?? 0);
          }
          setStatus((prev) => {
            if (prev === "connecting" || prev === "requesting-mic" || prev === "error" || prev === "ended") return prev;
            if (remoteLevel > 0.01) return "agent-speaking";
            if (localSpeaking) return "listening";
            return "connected";
          });
        });

        await room.connect(tok.livekit_url, tok.token);
        if (cancelled) {
          room.disconnect();
          return;
        }
        if (!cancelled && mountedRef.current) setStatus("requesting-mic");
        try {
          await room.localParticipant.setMicrophoneEnabled(true);
        } catch (micErr) {
          if (!cancelled && mountedRef.current) {
            setErrorMessage("Microphone access is required for voice calls. Please allow microphone access and try again.");
            setStatus("error");
          }
          room.disconnect();
          return;
        }
        if (!cancelled && mountedRef.current) setStatus("connected");
      } catch (err) {
        if (!cancelled && mountedRef.current) {
          setErrorMessage(err instanceof Error ? err.message : "Couldn't start the call, please try again.");
          setStatus("error");
        }
        room?.disconnect();
      }
    }

    start();

    return () => {
      cancelled = true;
      mountedRef.current = false;
      const room = roomRef.current;
      roomRef.current = null;
      if (room) {
        room.localParticipant.setMicrophoneEnabled(false).catch(() => {});
        room.disconnect();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (status === "connecting" || status === "requesting-mic" || status === "error") return;
    if (status === "ended") {
      if (durationIntervalRef.current) clearInterval(durationIntervalRef.current);
      return;
    }
    if (!durationIntervalRef.current) {
      durationIntervalRef.current = setInterval(() => setDuration((d) => d + 1), 1000);
    }
    return () => {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = null;
      }
    };
  }, [status]);

  useEffect(() => {
    const isActive = status === "agent-speaking";
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: isActive ? 1.15 : 1.04, duration: isActive ? 320 : 900, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: isActive ? 320 : 900, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [status, pulse]);

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [transcript]);

  const toggleMute = async () => {
    const room = roomRef.current;
    if (!room) return;
    const next = !muted;
    await room.localParticipant.setMicrophoneEnabled(!next);
    setMuted(next);
  };

  const handleHangup = () => {
    const room = roomRef.current;
    roomRef.current = null;
    if (room) {
      room.localParticipant.setMicrophoneEnabled(false).catch(() => {});
      room.disconnect();
    }
    onClose();
  };

  const fmt = (s: number) => `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  const statusLabel = (() => {
    switch (status) {
      case "connecting": return "Connecting…";
      case "requesting-mic": return "Please allow microphone access…";
      case "connected": return fmt(duration);
      case "listening": return "Listening…";
      case "agent-speaking": return "Speaking…";
      case "ended": return "Call ended";
      case "error": return errorMessage || "Something went wrong";
      default: return "";
    }
  })();

  if (status === "error") {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: t.containerBg }]}>
        <View style={[styles.errorIcon, { backgroundColor: "#fee2e2" }]}>
          <Text style={{ fontSize: 22 }}>⚠️</Text>
        </View>
        <Text style={[styles.errorText, { color: t.headerText }]}>{errorMessage}</Text>
        <TouchableOpacity style={[styles.primaryButton, { backgroundColor: t.userBubbleBg }]} onPress={onClose}>
          <Text style={[styles.primaryButtonText, { color: t.userBubbleText }]}>Close</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (status === "ended") {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: t.containerBg }]}>
        <View style={[styles.errorIcon, { backgroundColor: withAlpha(t.userBubbleBg, 0.12) }]}>
          <Text style={{ fontSize: 22 }}>📞</Text>
        </View>
        <Text style={[styles.errorText, { color: t.headerText }]}>Call ended</Text>
        <Text style={[styles.durationText, { color: withAlpha(t.headerText, 0.6) }]}>{fmt(duration)}</Text>
        <TouchableOpacity style={[styles.primaryButton, { backgroundColor: t.userBubbleBg, marginTop: 8 }]} onPress={onClose}>
          <Text style={[styles.primaryButtonText, { color: t.userBubbleText }]}>Back to chat</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: t.containerBg }]}>
      <View style={styles.statusRow}>
        <Animated.View
          style={[
            styles.orb,
            { backgroundColor: t.userBubbleBg, transform: [{ scale: pulse }] },
          ]}
        >
          <View style={styles.orbInner} />
        </Animated.View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.statusText, { color: withAlpha(t.headerText, 0.7) }]}>
            {(status === "connecting" || status === "requesting-mic") && <ActivityIndicator size="small" />} {statusLabel}
          </Text>
        </View>
      </View>

      <ScrollView ref={scrollRef} style={styles.transcript} contentContainerStyle={styles.transcriptContent}>
        {transcript.length === 0 ? (
          <Text style={[styles.emptyHint, { color: withAlpha(t.headerText, 0.4) }]}>
            Say something — your conversation will appear here.
          </Text>
        ) : (
          transcript.map((entry) => (
            <View key={entry.id} style={[styles.bubbleRow, entry.speaker === "visitor" ? styles.bubbleRowUser : styles.bubbleRowAgent]}>
              <View
                style={[
                  styles.bubble,
                  entry.speaker === "visitor"
                    ? { backgroundColor: t.userBubbleBg, borderBottomRightRadius: 4 }
                    : { backgroundColor: t.botBubbleBg, borderBottomLeftRadius: 4 },
                ]}
              >
                <Text style={{ color: entry.speaker === "visitor" ? t.userBubbleText : t.botBubbleText, fontSize: 13, lineHeight: 18 }}>
                  {entry.text || "…"}
                </Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.controlButton, { borderColor: withAlpha(t.headerText, 0.2) }]}
          onPress={toggleMute}
          disabled={status === "connecting" || status === "requesting-mic"}
        >
          <Text style={{ fontSize: 20 }}>{muted ? "🔇" : "🎤"}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.hangupButton]} onPress={handleHangup}>
          <Text style={{ fontSize: 24 }}>📞</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function withAlpha(hex: string, alpha: number): string {
  if (!hex.startsWith("#") || hex.length !== 7) return hex;
  const a = Math.round(alpha * 255).toString(16).padStart(2, "0");
  return `${hex}${a}`;
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  center: { alignItems: "center", justifyContent: "center", gap: 12 },
  statusRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: "rgba(0,0,0,0.06)" },
  orb: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  orbInner: { width: 20, height: 20, borderRadius: 10, backgroundColor: "rgba(255,255,255,0.3)" },
  statusText: { fontSize: 13, fontWeight: "600" },
  transcript: { flex: 1, marginVertical: 12 },
  transcriptContent: { gap: 10, paddingBottom: 8 },
  emptyHint: { fontSize: 12, textAlign: "center", marginTop: 40 },
  bubbleRow: { flexDirection: "row" },
  bubbleRowUser: { justifyContent: "flex-end" },
  bubbleRowAgent: { justifyContent: "flex-start" },
  bubble: { maxWidth: "80%", borderRadius: 16, paddingHorizontal: 12, paddingVertical: 8 },
  controls: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 20, paddingVertical: 12 },
  controlButton: { width: 52, height: 52, borderRadius: 26, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  hangupButton: { width: 60, height: 60, borderRadius: 30, backgroundColor: "#ef4444", alignItems: "center", justifyContent: "center" },
  errorIcon: { width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center" },
  errorText: { fontSize: 14, fontWeight: "600", textAlign: "center", maxWidth: 240 },
  durationText: { fontSize: 12 },
  primaryButton: { paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24 },
  primaryButtonText: { fontSize: 13, fontWeight: "700" },
});
