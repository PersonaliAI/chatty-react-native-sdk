import React from "react";
import { ChattyChatViewProps } from "./ChattyChatView";
export interface ChattyLauncherProps extends ChattyChatViewProps {
    /** "left" | "right", defaults to "right". */
    position?: "left" | "right";
}
/**
 * Floating launcher button + full-screen modal chat panel — the native-SDK
 * equivalent of widget.js's launcher button + iframe panel. 60x60 (widget.js's
 * actual size), color/shadow follow the selected design's own LAUNCHER_STYLES
 * entry — NOT always the same as the user-bubble color (e.g. dark-sleek's
 * launcher is dark, not its teal accent; neubrutalism's is black, not pink).
 */
export declare function ChattyLauncher(props: ChattyLauncherProps): React.JSX.Element;
