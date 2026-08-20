/**
 * Mirrors the web widget's session id scheme (`chatty_sid_{botId}_{hostKey}` in
 * localStorage) so the same visitor is recognized whether they arrive via web
 * or the native app, when `hostKey` is shared deliberately.
 */
export declare function getOrCreateSessionId(botId: string, hostKey?: string): Promise<string>;
/** Overwrites the stored session id with a fresh one — used by the "clear chat" action. */
export declare function newSession(botId: string, hostKey?: string): Promise<string>;
