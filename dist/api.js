export const DEFAULT_BASE_URL = "https://api.chatty.personaliai.com";
function buildUrl(baseUrl, path, params) {
    const url = new URL(path, baseUrl);
    for (const [k, v] of Object.entries(params)) {
        if (v !== undefined)
            url.searchParams.set(k, v);
    }
    return url.toString();
}
/**
 * Thin HTTP client for the Chatty widget API (`/api/widget/*`). No auth header —
 * bot_id alone identifies the bot. bot_id is not a secret (it's extractable from any
 * client); allowed_domains is enforced via rate-limit tier, not a hard reject — see
 * ChattyRateLimitError.
 */
export class ChattyClient {
    constructor(options) {
        this.baseUrl = options.baseUrl ?? DEFAULT_BASE_URL;
        this.botId = options.botId;
        this.host = options.host;
    }
    async getTheme() {
        const url = buildUrl(this.baseUrl, "/api/widget/theme", {
            bot_id: this.botId,
            t: String(Date.now()),
        });
        const res = await fetch(url);
        if (!res.ok)
            throw new Error(`getTheme failed: ${res.status}`);
        return res.json();
    }
    async sendMessageStream(sessionId, text, onToken, visitorTimezone = "UTC") {
        const res = await fetch(buildUrl(this.baseUrl, "/api/widget/chat/stream", {}), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                bot_id: this.botId,
                session_id: sessionId,
                text,
                visitor_timezone: visitorTimezone,
                host: this.host,
            }),
        });
        if (res.status === 429)
            throw new ChattyRateLimitError();
        if (res.status === 403)
            throw new ChattyDomainNotAllowedError();
        if (!res.ok)
            throw new Error(`sendMessageStream failed: ${res.status}`);
        const reader = res.body?.getReader();
        if (!reader)
            throw new Error("Response body is not readable");
        const decoder = new TextDecoder();
        let buffer = "";
        while (true) {
            const { done, value } = await reader.read();
            if (done)
                break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";
            for (const line of lines) {
                if (line.startsWith("data: ")) {
                    const dataStr = line.slice(6).trim();
                    if (!dataStr)
                        continue;
                    try {
                        const data = JSON.parse(dataStr);
                        if (data.token)
                            onToken(data.token);
                        if (data.done)
                            return;
                    }
                    catch (e) {
                        // ignore
                    }
                }
            }
        }
    }
    async sendMessage(sessionId, text, visitorTimezone = "UTC") {
        const res = await fetch(buildUrl(this.baseUrl, "/api/widget/chat", {}), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                bot_id: this.botId,
                session_id: sessionId,
                text,
                visitor_timezone: visitorTimezone,
                host: this.host,
            }),
        });
        if (res.status === 429)
            throw new ChattyRateLimitError();
        if (res.status === 403)
            throw new ChattyDomainNotAllowedError();
        if (!res.ok)
            throw new Error(`sendMessage failed: ${res.status}`);
        return res.json();
    }
    /**
     * Send an image/file attachment. `file` must be a React Native file-uri descriptor
     * ({ uri, name, type }) as accepted by RN's FormData/Blob polyfill.
     */
    async sendMedia(sessionId, file, text = "", visitorTimezone = "UTC") {
        const form = new FormData();
        form.append("bot_id", this.botId);
        form.append("session_id", sessionId);
        form.append("text", text);
        form.append("visitor_timezone", visitorTimezone);
        if (this.host)
            form.append("host", this.host);
        form.append("file", file);
        const res = await fetch(buildUrl(this.baseUrl, "/api/widget/chat/media", {}), {
            method: "POST",
            body: form,
        });
        if (res.status === 429)
            throw new ChattyRateLimitError();
        if (res.status === 403)
            throw new ChattyDomainNotAllowedError();
        if (!res.ok)
            throw new Error(`sendMedia failed: ${res.status}`);
        return res.json();
    }
    /**
     * Server-side speech-to-text for a recorded voice note (mic button). Accepts
     * wav/mp3/ogg/aac/aiff/flac (not webm) up to 10MB. Returns the transcribed text, or ""
     * if speech wasn't detected. This SDK doesn't record audio itself — bring your own
     * recorder (e.g. expo-av) and pass the resulting file here.
     */
    async transcribe(file) {
        const form = new FormData();
        form.append("bot_id", this.botId);
        form.append("file", file);
        const res = await fetch(buildUrl(this.baseUrl, "/api/widget/transcribe", {}), {
            method: "POST",
            body: form,
        });
        if (res.status === 429)
            throw new ChattyRateLimitError();
        if (res.status === 403)
            throw new ChattyDomainNotAllowedError();
        if (!res.ok)
            throw new Error(`transcribe failed: ${res.status}`);
        const data = await res.json();
        return data.text ?? "";
    }
    /** Poll for new messages (e.g. from a human agent) since the given ISO timestamp. */
    async poll(sessionId, after) {
        const url = buildUrl(this.baseUrl, "/api/widget/poll", {
            bot_id: this.botId,
            session_id: sessionId,
            after,
        });
        const res = await fetch(url);
        if (!res.ok)
            throw new Error(`poll failed: ${res.status}`);
        return res.json();
    }
}
// The backend can't cryptographically verify a native app's identity the way
// it verifies a browser's Referer for the web widget, so a bot with
// allowed_domains configured always rate-limits mobile SDK traffic at the
// stricter "unverified" tier (5 msgs/120s per bot+IP) rather than the normal
// tier (30 msgs/60s) — it does NOT reject on a mismatched `host`. The `host`
// field this client sends is advisory only; the backend doesn't trust it.
export class ChattyRateLimitError extends Error {
    constructor() {
        super("Chatty: rate limit exceeded — 30 msgs/60s normally, or 5 msgs/120s per bot+IP if " +
            "allowed_domains is set (mobile traffic always gets this stricter tier)");
        this.name = "ChattyRateLimitError";
    }
}
// Kept for forward-compatibility — the current backend never returns 403 for
// domain/origin reasons on these endpoints, but this stays wired up in case
// that changes.
export class ChattyDomainNotAllowedError extends Error {
    constructor() {
        super("Chatty: request rejected (403)");
        this.name = "ChattyDomainNotAllowedError";
    }
}
