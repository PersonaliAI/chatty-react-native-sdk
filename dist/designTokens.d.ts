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
    launcherBg: string;
    launcherShadow: string;
}
export declare const CHATTY_DESIGN_TOKENS: Record<string, ChattyDesignTokens>;
/** `widget_style` from the theme API is `"{styleId}:{logoBgColor}:{launcherShape}"`. */
export declare function chattyNormalizeWidgetStyle(raw: string | null | undefined): string;
/**
 * Bubble border radii with the corner nearest the avatar squared off,
 * matching web's `.rounded-tl-none` (bot) / `.rounded-tr-none` (user) — the
 * "speech tail" corner treatment used by every design. Spread directly onto
 * a View's style as borderTopLeftRadius/etc.
 */
export declare function chattyBubbleRadii(radius: number, isUser: boolean): {
    borderTopLeftRadius: number;
    borderTopRightRadius: number;
    borderBottomRightRadius: number;
    borderBottomLeftRadius: number;
};
