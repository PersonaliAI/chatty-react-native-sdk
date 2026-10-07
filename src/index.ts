export { ChattyClient, DEFAULT_BASE_URL, ChattyRateLimitError, ChattyDomainNotAllowedError } from "./api";
export type {
  ChattyTheme,
  ChattyColorScheme,
  ChattyChatResponse,
  ChattyMediaResponse,
  ChattyPollMessage,
  ChattyPollResponse,
  ChattyClientOptions,
} from "./api";
export { useChattyChat } from "./useChattyChat";
export type { ChattyMessage, ChattyRole, UseChattyChatOptions, UseChattyChatResult } from "./useChattyChat";
export { ChattyChatView } from "./ChattyChatView";
export type { ChattyChatViewProps } from "./ChattyChatView";
export { ChattyLauncher } from "./ChattyLauncher";
export type { ChattyLauncherProps } from "./ChattyLauncher";
// Primary integration path — loads the actual web widget page in a WebView,
// guaranteeing exact parity with it. See ChattyChatView above for the
// native-components alternative (more native feel, manually kept in parity).
export { ChattyEmbedView, chattyDefaultEmbedBaseUrl } from "./ChattyEmbedView";
export type { ChattyEmbedViewProps } from "./ChattyEmbedView";
export { getOrCreateSessionId, newSession } from "./session";
export { CHATTY_DESIGN_TOKENS, chattyNormalizeWidgetStyle, chattyLogoBgColor, chattyLauncherRadii, chattyBubbleRadii } from "./designTokens";
export type { ChattyDesignTokens } from "./designTokens";
export { ChattyMarkdown, extractMath, formatLatexForDisplay, parseInlineTokens } from "./ChattyMarkdown";
export type { ChattyMarkdownProps, ChattyMathSpan } from "./ChattyMarkdown";

