import {
  CHATTY_DESIGN_TOKENS,
  chattyNormalizeWidgetStyle,
  chattyLogoBgColor,
  chattyLauncherRadii,
  chattyBubbleRadii,
} from "../designTokens";

describe("chattyNormalizeWidgetStyle", () => {
  it("defaults to minimal for null/undefined/empty input", () => {
    expect(chattyNormalizeWidgetStyle(null)).toBe("minimal");
    expect(chattyNormalizeWidgetStyle(undefined)).toBe("minimal");
    expect(chattyNormalizeWidgetStyle("")).toBe("minimal");
  });

  it("passes through a known design id", () => {
    expect(chattyNormalizeWidgetStyle("corporate")).toBe("corporate");
  });

  it("extracts the style id from a colon-segmented string", () => {
    expect(chattyNormalizeWidgetStyle("ecommerce:#fff:bubble")).toBe("ecommerce");
  });

  it("maps every legacy style id onto a current design key", () => {
    const legacyIds = ["liquid", "neumorphism", "claymorphism", "bento", "brutalism", "retro", "aurora", "minimalist", "elevated", "frosted", "bold", "contrast"];
    for (const id of legacyIds) {
      const mapped = chattyNormalizeWidgetStyle(id);
      expect(CHATTY_DESIGN_TOKENS[mapped]).toBeDefined();
    }
  });

  it("falls back to minimal for a totally unknown id", () => {
    expect(chattyNormalizeWidgetStyle("some-future-design-nobody-shipped-yet")).toBe("minimal");
  });

  it("every design key in the catalog is self-normalizing", () => {
    for (const key of Object.keys(CHATTY_DESIGN_TOKENS)) {
      expect(chattyNormalizeWidgetStyle(key)).toBe(key);
    }
  });
});

describe("chattyLogoBgColor", () => {
  it("returns undefined for null/undefined/empty input", () => {
    expect(chattyLogoBgColor(null)).toBeUndefined();
    expect(chattyLogoBgColor(undefined)).toBeUndefined();
  });

  it("extracts the second colon-segment", () => {
    expect(chattyLogoBgColor("minimal:#fff:bubble")).toBe("#fff");
  });

  it("returns undefined when the second segment is missing", () => {
    expect(chattyLogoBgColor("minimal")).toBeUndefined();
  });
});

describe("chattyLauncherRadii", () => {
  it("returns a full circle by default (no shape segment)", () => {
    expect(chattyLauncherRadii("minimal", 60, "right")).toEqual({ borderRadius: 30 });
  });

  it("returns zero radius for square", () => {
    expect(chattyLauncherRadii("minimal:#fff:square", 60, "right")).toEqual({ borderRadius: 0 });
  });

  it("returns 12 for rounded", () => {
    expect(chattyLauncherRadii("minimal:#fff:rounded", 60, "right")).toEqual({ borderRadius: 12 });
  });

  it("returns an asymmetric speech-tail shape for bubble, mirrored by position", () => {
    const right = chattyLauncherRadii("minimal:#fff:bubble", 60, "right");
    const left = chattyLauncherRadii("minimal:#fff:bubble", 60, "left");
    expect(right.borderBottomLeftRadius).toBe(4);
    expect(right.borderBottomRightRadius).toBe(30);
    expect(left.borderBottomLeftRadius).toBe(30);
    expect(left.borderBottomRightRadius).toBe(4);
  });

  it("handles a null/undefined raw string without throwing", () => {
    expect(chattyLauncherRadii(null, 60, "right")).toEqual({ borderRadius: 30 });
    expect(chattyLauncherRadii(undefined, 60, "left")).toEqual({ borderRadius: 30 });
  });
});

describe("chattyBubbleRadii", () => {
  it("squares off the top-right corner for a user bubble", () => {
    expect(chattyBubbleRadii(14, true)).toEqual({
      borderTopLeftRadius: 14,
      borderTopRightRadius: 0,
      borderBottomRightRadius: 14,
      borderBottomLeftRadius: 14,
    });
  });

  it("squares off the top-left corner for a bot bubble", () => {
    expect(chattyBubbleRadii(14, false)).toEqual({
      borderTopLeftRadius: 0,
      borderTopRightRadius: 14,
      borderBottomRightRadius: 14,
      borderBottomLeftRadius: 14,
    });
  });
});

describe("CHATTY_DESIGN_TOKENS catalog", () => {
  it("has exactly 10 designs, each with every required color field", () => {
    const keys = Object.keys(CHATTY_DESIGN_TOKENS);
    expect(keys).toHaveLength(10);
    for (const key of keys) {
      const t = CHATTY_DESIGN_TOKENS[key];
      expect(t.containerBg).toBeTruthy();
      expect(t.headerBg).toBeTruthy();
      expect(t.headerText).toBeTruthy();
      expect(t.botBubbleBg).toBeTruthy();
      expect(t.botBubbleText).toBeTruthy();
      expect(t.userBubbleBg).toBeTruthy();
      expect(t.userBubbleText).toBeTruthy();
      expect(t.launcherBg).toBeTruthy();
      expect(t.launcherShadow).toBeTruthy();
      expect(typeof t.botBubbleRadius).toBe("number");
      expect(typeof t.userBubbleRadius).toBe("number");
    }
  });
});
