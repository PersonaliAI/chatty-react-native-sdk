import React from "react";
import { ChattyEmbedView } from "./ChattyEmbedView";
/** Standalone LiveKit voice-agent UI backed by the official Chatty embed. */
export function ChattyVoiceView(props) {
    return <ChattyEmbedView {...props} voiceOnly/>;
}
