export interface ChattyDesignTokens {
    containerBg: string;
    headerBg: string;
    headerText: string;
    botBubbleBg: string;
    botBubbleText: string;
    botBubbleRadius: number;
    userBubbleBg: string;
    userBubbleText: string;
    userBubbleRadius: number;
    gradientColors?: [string, string];
}
export declare const CHATTY_DESIGN_TOKENS: Record<string, ChattyDesignTokens>;
/** `widget_style` from the theme API is `"{styleId}:{logoBgColor}:{launcherShape}"`. */
export declare function chattyNormalizeWidgetStyle(raw: string | null | undefined): string;
