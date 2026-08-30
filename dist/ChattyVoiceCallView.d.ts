import React from "react";
import { ChattyClient } from "./api";
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
export declare function ChattyVoiceCallView({ client, sessionId, widgetStyle, visitorTimezone, onClose }: ChattyVoiceCallViewProps): React.JSX.Element;
