export declare const DEFAULT_BASE_URL = "https://api.chatty.personaliai.com";
export interface ChattyTheme {
    name?: string;
    primary_color?: string;
    /** "style:logoBgColor:launcherShape" */
    widget_style?: string;
    logo_url?: string;
    welcome_message?: string;
    send_button_style?: string;
    conversation_starters?: string[];
    teaser_message?: string;
    avatar_icon?: string;
    avatar_url?: string;
    voice_enabled?: boolean;
}
export interface ChattyChatResponse {
    reply: string;
    session_id: string;
    ai_paused?: boolean;
}
export interface ChattyMediaResponse extends ChattyChatResponse {
    file_url?: string;
    file_type?: string;
}
export interface ChattyPollMessage {
    content: string;
    created_at: string;
    sender: string;
}
export interface ChattyPollResponse {
    messages: ChattyPollMessage[];
    ai_paused?: boolean;
}
export interface ChattyClientOptions {
    botId: string;
    /** Override the backend base URL (defaults to the production Cloud Run service). */
    baseUrl?: string;
    /** Sent as the `host` field, but advisory only — the backend doesn't use it for access
     * control. See ChattyRateLimitError for how allowed_domains is actually enforced. */
    host?: string;
}
/**
 * Thin HTTP client for the Chatty widget API (`/api/widget/*`). No auth header —
 * bot_id alone identifies the bot. bot_id is not a secret (it's extractable from any
 * client); allowed_domains is enforced via rate-limit tier, not a hard reject — see
 * ChattyRateLimitError.
 */
export declare class ChattyClient {
    private baseUrl;
    private botId;
    private host?;
    constructor(options: ChattyClientOptions);
    getTheme(): Promise<ChattyTheme>;
    sendMessageStream(sessionId: string, text: string, onToken: (token: string) => void, visitorTimezone?: string): Promise<void>;
    sendMessage(sessionId: string, text: string, visitorTimezone?: string): Promise<ChattyChatResponse>;
    /**
     * Send an image/file attachment. `file` must be a React Native file-uri descriptor
     * ({ uri, name, type }) as accepted by RN's FormData/Blob polyfill.
     */
    sendMedia(sessionId: string, file: {
        uri: string;
        name: string;
        type: string;
    }, text?: string, visitorTimezone?: string): Promise<ChattyMediaResponse>;
    /**
     * Server-side speech-to-text for a recorded voice note (mic button). Accepts
     * wav/mp3/ogg/aac/aiff/flac (not webm) up to 10MB. Returns the transcribed text, or ""
     * if speech wasn't detected. This SDK doesn't record audio itself — bring your own
     * recorder (e.g. expo-av) and pass the resulting file here.
     */
    transcribe(file: {
        uri: string;
        name: string;
        type: string;
    }): Promise<string>;
    /** Poll for new messages (e.g. from a human agent) since the given ISO timestamp. */
    poll(sessionId: string, after: string): Promise<ChattyPollResponse>;
}
export declare class ChattyRateLimitError extends Error {
    constructor();
}
export declare class ChattyDomainNotAllowedError extends Error {
    constructor();
}
