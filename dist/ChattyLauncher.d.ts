import React from "react";
import { ChattyChatViewProps } from "./ChattyChatView";
export interface ChattyLauncherProps extends ChattyChatViewProps {
    /** "left" | "right", defaults to "right". */
    position?: "left" | "right";
}
/**
 * Floating launcher button + full-screen modal chat panel — the native-SDK
 * equivalent of widget.js's launcher button + iframe panel. The button color
 * follows the selected design's own accent (same as web's LAUNCHER_STYLES),
 * not primary_color — every design's launcher matches its own palette by
 * default regardless of what primary_color happens to be set to.
 */
export declare function ChattyLauncher(props: ChattyLauncherProps): React.JSX.Element;
