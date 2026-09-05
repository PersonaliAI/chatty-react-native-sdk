import React from "react";
import { ChattyMessage, UseChattyChatOptions } from "./useChattyChat";
import { ChattyMarkdown } from "./ChattyMarkdown";
export interface ChattyChatViewProps extends UseChattyChatOptions {
    /** Called once theme/config has loaded and the chat is ready to use. */
    onReady?: () => void;
    /** Called after every new assistant/agent message arrives (mirrors `chatty:message`). */
    onMessage?: (message: ChattyMessage) => void;
    /** Called when the attachment button is pressed and no onCameraPress/onPhotoLibraryPress
     * are given — kept for backward compatibility with earlier SDK versions. */
    onAttachPress?: () => void;
    /** Called when "Camera" is tapped in the attach menu. This SDK doesn't bundle a camera
     * dependency itself — wire this up with expo-image-picker / react-native-image-picker
     * (or your own) and call `sendImage` with the result. */
    onCameraPress?: () => void;
    /** Called when "Photo Library" is tapped in the attach menu — same pattern as onCameraPress. */
    onPhotoLibraryPress?: () => void;
    /** Called when "Documents" is tapped in the attach menu — same pattern as onCameraPress. This
     * SDK doesn't bundle a document-picker dependency itself; wire this up with
     * expo-document-picker / react-native-document-picker (or your own) and call `sendImage`
     * (from `useChattyChat`) with the result. */
    onDocumentPress?: () => void;
    /** Called when "Location" is tapped in the attach menu — same pattern as onCameraPress. This
     * SDK never requests location permission itself; wire this up with expo-location /
     * @react-native-community/geolocation (or your own) and, once you have a fix, set the input
     * text yourself (e.g. via the headless `useChattyChat` hook), matching the web widget's
     * behavior of dropping a Google Maps link into the composer rather than sending a special
     * message type. */
    onShareLocationPress?: () => void;
    /** Called when the mic button is tapped. This SDK doesn't bundle an audio-recording
     * dependency itself — wire this up with expo-av (or your own recorder), then call
     * `ChattyClient.transcribe()` with the recorded file and fill the input with the result. */
    onMicPress?: () => void;
    /** Called when the header's voice-call button is tapped (only shown when the bot's
     * dashboard has voice enabled). This SDK doesn't bundle a voice-call implementation
     * (that's a separate LiveKit integration) — wire this up if your app has one. */
    onVoiceCallPress?: () => void;
    /** Called when the header's notification-bell button is tapped. This SDK never calls
     * PermissionsAndroid.request (or any permission prompt) itself — it only reflects
     * POST_NOTIFICATIONS' already-granted state (via PermissionsAndroid.check on Android 13+,
     * re-checked on app foreground) to decide whether to show the bell at all. Request the
     * permission yourself (e.g. via expo-notifications, your own native module, or
     * PermissionsAndroid.request) wherever your app's onboarding flow calls for it — the bell
     * then appears once granted. Native apps still need their own push infrastructure
     * (FCM/APNs) to actually *deliver* a notification while backgrounded. */
    onNotificationBellPress?: () => void;
    /** Renders a close (✕) button in the header when provided — pass this instead of drawing
     * your own close bar above ChattyChatView (e.g. in a modal wrapper), so there's one header,
     * not two stacked ones. ChattyLauncher already does this for you. */
    onClose?: () => void;
    /** Set `false` to force-hide the header's notification-bell button regardless of permission
     * state. Left at the default `true`, the bell only shows once POST_NOTIFICATIONS is already
     * granted (checked read-only, never requested by this SDK — see onNotificationBellPress).
     * Camera/photo/mic aren't listed here because this SDK never requests those permissions
     * itself either — see onCameraPress/onPhotoLibraryPress/onMicPress above. */
    enableNotificationBell?: boolean;
}
/** Mirrors standalone.tsx's LAUNCHER_ICONS map + its MessageCircle fallback:
 * logo(no logoUrl)/custom(no avatarUrl)/anything unmatched falls back to a
 * chat-bubble glyph, NOT a robot — web only shows the robot for avatar_icon
 * === "bot" specifically. */
export declare function avatarGlyph(avatarIcon: string | null | undefined): string;
export declare function ChattyChatView(props: ChattyChatViewProps): React.JSX.Element;
/** Backward compatibility alias for ChattyMarkdown. */
export declare const SimpleMarkdown: typeof ChattyMarkdown;
