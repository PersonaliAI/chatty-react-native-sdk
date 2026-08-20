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
}
export declare function ChattyChatView(props: ChattyChatViewProps): React.JSX.Element;
