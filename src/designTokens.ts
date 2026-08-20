// The 10 widget designs' key visual tokens, ported 1:1 from the web widget's
// globals.css (`.style-*` rules) so the native chat view matches whatever
// design the bot owner picked in the dashboard instead of always rendering a
// single generic orange-on-white look. Font pairing (each design uses a
// distinct Google Font on web) is intentionally out of scope here — bundling
// 6 font families into this SDK is a separate, larger piece of work; colors,
// radii, and header/bubble treatment are the part that carries most of a
// design's visual identity. Gradients (gradient-glow's header, glassmorphism's
// container) need `react-native-linear-gradient`/`expo-linear-gradient`, which
// this SDK doesn't currently depend on — `gradientColors` is exposed so a
// consuming app can render one if it already has that dependency; otherwise
// `headerBg`/`containerBg` are used as solid fallbacks.

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

export const CHATTY_DESIGN_TOKENS: Record<string, ChattyDesignTokens> = {
  minimal: {
    containerBg: "#f3f2ee", headerBg: "#ffffff", headerText: "#1c1a15",
    botBubbleBg: "#f3f2ee", botBubbleText: "#1c1a15", botBubbleRadius: 14,
    userBubbleBg: "#1c1a15", userBubbleText: "#ffffff", userBubbleRadius: 14,
  },
  playful: {
    containerBg: "#fffaf5", headerBg: "#ff8a5c", headerText: "#ffffff",
    botBubbleBg: "#ffe6d9", botBubbleText: "#7a3f24", botBubbleRadius: 20,
    userBubbleBg: "#ff8a5c", userBubbleText: "#ffffff", userBubbleRadius: 20,
  },
  corporate: {
    containerBg: "#eef1f6", headerBg: "#1c2e4a", headerText: "#ffffff",
    botBubbleBg: "#eef1f6", botBubbleText: "#1c2e4a", botBubbleRadius: 8,
    userBubbleBg: "#1c2e4a", userBubbleText: "#ffffff", userBubbleRadius: 8,
  },
  "dark-sleek": {
    containerBg: "#111114", headerBg: "#14141a", headerText: "#e4e4e8",
    botBubbleBg: "#1c1c22", botBubbleText: "#e4e4e8", botBubbleRadius: 12,
    userBubbleBg: "#00e5c7", userBubbleText: "#05201c", userBubbleRadius: 12,
  },
  "gradient-glow": {
    containerBg: "#ffffff", headerBg: "#a855f7", headerText: "#ffffff",
    botBubbleBg: "#f6effc", botBubbleText: "#4a2467", botBubbleRadius: 16,
    userBubbleBg: "#a855f7", userBubbleText: "#ffffff", userBubbleRadius: 16,
    gradientColors: ["#a855f7", "#ec4899"],
  },
  glassmorphism: {
    containerBg: "#8f6ff0", headerBg: "rgba(255,255,255,0.08)", headerText: "#ffffff",
    botBubbleBg: "rgba(255,255,255,0.18)", botBubbleText: "#ffffff", botBubbleRadius: 14,
    userBubbleBg: "rgba(255,255,255,0.9)", userBubbleText: "#39396b", userBubbleRadius: 14,
    gradientColors: ["#5b8def", "#e05ac9"],
  },
  ecommerce: {
    containerBg: "#fdf9f2", headerBg: "#0f9d8c", headerText: "#ffffff",
    botBubbleBg: "#f3efe6", botBubbleText: "#3a3226", botBubbleRadius: 14,
    userBubbleBg: "#0f9d8c", userBubbleText: "#ffffff", userBubbleRadius: 14,
  },
  "healthcare-calm": {
    containerBg: "#fbfcf9", headerBg: "#eaf1e9", headerText: "#2f4235",
    botBubbleBg: "#eaf1e9", botBubbleText: "#2f4235", botBubbleRadius: 14,
    userBubbleBg: "#6f9c7d", userBubbleText: "#ffffff", userBubbleRadius: 14,
  },
  neubrutalism: {
    containerBg: "#ffffff", headerBg: "#ffde59", headerText: "#111111",
    botBubbleBg: "#f2f2f2", botBubbleText: "#111111", botBubbleRadius: 4,
    userBubbleBg: "#ff3d67", userBubbleText: "#ffffff", userBubbleRadius: 4,
  },
  "luxury-editorial": {
    containerBg: "#fbf9f5", headerBg: "#161412", headerText: "#f5efe3",
    botBubbleBg: "#f1ebdf", botBubbleText: "#2a251d", botBubbleRadius: 2,
    userBubbleBg: "#161412", userBubbleText: "#f5efe3", userBubbleRadius: 2,
  },
};

// Mirrors widget-style.ts's LEGACY_STYLE_MAP — every historical widget_style
// ID across all 3 preset generations this project has shipped, mapped onto
// one of the 10 current design keys above.
const LEGACY_STYLE_MAP: Record<string, string> = {
  liquid: "glassmorphism", neumorphism: "corporate", claymorphism: "playful",
  bento: "minimal", brutalism: "neubrutalism", retro: "dark-sleek", aurora: "gradient-glow",
  minimalist: "minimal", elevated: "corporate", frosted: "glassmorphism",
  bold: "gradient-glow", contrast: "dark-sleek",
};

/** `widget_style` from the theme API is `"{styleId}:{logoBgColor}:{launcherShape}"`. */
export function chattyNormalizeWidgetStyle(raw: string | null | undefined): string {
  if (!raw) return "minimal";
  const id = raw.split(":")[0];
  if (CHATTY_DESIGN_TOKENS[id]) return id;
  return LEGACY_STYLE_MAP[id] || "minimal";
}
