import React from "react";
import { ChattyEmbedView, ChattyEmbedViewProps } from "./ChattyEmbedView";

/** Standalone LiveKit voice-agent UI backed by the official Chatty embed. */
export function ChattyVoiceView(props: Omit<ChattyEmbedViewProps, "voiceOnly">) {
  return <ChattyEmbedView {...props} voiceOnly />;
}
