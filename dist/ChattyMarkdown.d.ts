import React from "react";
export interface ChattyMathSpan {
    latex: string;
    isBlock: boolean;
}
export declare const MATH_PLACEHOLDER_PREFIX = "ChattyMathSpanZ";
/**
 * Extracts LaTeX math expressions ($inline$ and $$block$$) and replaces them
 * with alphanumeric placeholders to protect them from markdown parsing collisions
 * (e.g. subscripts `_`, superscripts `^`, backslashes, or asterisks).
 */
export declare function extractMath(raw: string): {
    text: string;
    spans: ChattyMathSpan[];
};
/**
 * Converts common LaTeX math symbols and patterns into clean Unicode equivalents
 * for readable native rendering across iOS and Android without native binary deps.
 */
export declare function formatLatexForDisplay(latex: string): string;
export declare function ChattyLatexView({ latex, isBlock, color, fontSize, }: {
    latex: string;
    isBlock: boolean;
    color: string;
    fontSize: number;
}): React.JSX.Element;
interface InlineToken {
    type: "text" | "bold" | "italic" | "code" | "strikethrough" | "link" | "math";
    text: string;
    url?: string;
    mathSpan?: ChattyMathSpan;
}
export declare function parseInlineTokens(raw: string, mathSpans: ChattyMathSpan[]): InlineToken[];
export interface ChattyMarkdownProps {
    text: string;
    color?: string;
    fontSize?: number;
    style?: any;
}
export declare function ChattyMarkdown({ text, color, fontSize, style, }: ChattyMarkdownProps): React.JSX.Element;
export {};
