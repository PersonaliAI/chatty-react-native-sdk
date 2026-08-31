import React from "react";
import { ChattyMessage, UseChattyChatOptions } from "./useChattyChat";
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
    /** Called when the header's notification-bell button is tapped, after the OS notification
     * permission has been requested on Android (PermissionsAndroid, built into RN core — no
     * extra dependency). There's no cross-platform JS API for this on iOS; request it yourself
     * (e.g. via expo-notifications or your own native module) before/inside this callback.
     * Native apps still need their own push infrastructure (FCM/APNs) to actually *deliver* a
     * notification while backgrounded — this SDK only handles the permission ask. */
    onNotificationBellPress?: () => void;
    /** Renders a close (✕) button in the header when provided — pass this instead of drawing
     * your own close bar above ChattyChatView (e.g. in a modal wrapper), so there's one header,
     * not two stacked ones. ChattyLauncher already does this for you. */
    onClose?: () => void;
    /** Shows the header's notification-bell button and, on Android, requests
     * POST_NOTIFICATIONS (a runtime permission on API 33+) when tapped. Set `false` to hide the
     * button entirely — the SDK then never calls PermissionsAndroid.request at all, so your app
     * fully controls if/when/how notification permission is ever requested. Default `true`.
     * Camera/photo/mic aren't listed here because this SDK never requests those permissions
     * itself — see onCameraPress/onPhotoLibraryPress/onMicPress above. */
    enableNotificationBell?: boolean;
}
export declare function ChattyChatView(props: ChattyChatViewProps): React.JSX.Element;
