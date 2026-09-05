import React from "react";
import { ChattyEmbedViewProps } from "./ChattyEmbedView";
export interface ChattyLauncherProps extends ChattyEmbedViewProps {
    /** "left" | "right", defaults to "right". */
    position?: "left" | "right";
}
/**
 * Floating launcher button + full-screen modal chat panel (the actual web
 * widget page, loaded via ChattyEmbedView — see that file for why). 60x60
 * (widget.js's actual size), color/shadow follow the selected design's own
 * LAUNCHER_STYLES entry — NOT always the same as the user-bubble color (e.g.
 * dark-sleek's launcher is dark, not its teal accent; neubrutalism's is
 * black, not pink).
 */
export declare function ChattyLauncher(props: ChattyLauncherProps): React.JSX.Element;
