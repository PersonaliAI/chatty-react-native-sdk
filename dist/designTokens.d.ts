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
/** The 2nd colon-segment of `widget_style`, e.g. `"minimal:#fff:bubble"` -> `"#fff"` —
 * overrides the header/bubble avatar circle's background when a real logo/avatar image
 * isn't shown. */
export declare function chattyLogoBgColor(raw: string | null | undefined): string | undefined;
/** The 3rd colon-segment of `widget_style` controls the launcher button's corner shape:
 * `square` -> 0 corners, `rounded` -> 12 corners, `bubble` -> an asymmetric "speech tail"
 * corner, anything else (including absent) -> a full circle (radius = size/2), matching
 * widget.js. Spread the result onto the launcher button's style. */
export declare function chattyLauncherRadii(raw: string | null | undefined, size: number, position: "left" | "right"): {
    borderRadius: number;
    borderTopLeftRadius?: undefined;
    borderTopRightRadius?: undefined;
    borderBottomRightRadius?: undefined;
    borderBottomLeftRadius?: undefined;
} | {
    borderTopLeftRadius: number;
    borderTopRightRadius: number;
    borderBottomRightRadius: number;
    borderBottomLeftRadius: number;
    borderRadius?: undefined;
};
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
