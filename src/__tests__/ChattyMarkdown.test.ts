import {
  extractMath,
  formatLatexForDisplay,
  parseInlineTokens,
  MATH_PLACEHOLDER_PREFIX,
} from "../ChattyMarkdown";

describe("ChattyMarkdown - LaTeX Math Extraction", () => {
  it("extracts inline math equations correctly", () => {
    const raw = "The equation is $E = mc^2$ in physics.";
    const { text, spans } = extractMath(raw);

    expect(spans).toHaveLength(1);
    expect(spans[0].latex).toBe("E = mc^2");
    expect(spans[0].isBlock).toBe(false);
    expect(text).toBe(`The equation is ${MATH_PLACEHOLDER_PREFIX}0Z in physics.`);
  });

  it("extracts block math equations correctly", () => {
    const raw = "Quadratic formula:\n$$\nx = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}\n$$";
    const { text, spans } = extractMath(raw);

    expect(spans).toHaveLength(1);
    expect(spans[0].latex).toBe("x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}");
    expect(spans[0].isBlock).toBe(true);
    expect(text).toContain(`${MATH_PLACEHOLDER_PREFIX}0Z`);
  });

  it("extracts multiple mixed inline and block equations in order", () => {
    const raw = "Inline $a^2 + b^2 = c^2$ and block:\n$$\\sum_{i=1}^n i = \\frac{n(n+1)}{2}$$\nand another $x_i \\ge 0$.";
    const { text, spans } = extractMath(raw);

    expect(spans).toHaveLength(3);
    // Block regex runs first to avoid inner collisions
    expect(spans[0].isBlock).toBe(true);
    expect(spans[0].latex).toContain("\\sum_{i=1}^n");
    expect(spans[1].isBlock).toBe(false);
    expect(spans[1].latex).toBe("a^2 + b^2 = c^2");
    expect(spans[2].isBlock).toBe(false);
    expect(spans[2].latex).toBe("x_i \\ge 0");

    expect(text).toContain(`${MATH_PLACEHOLDER_PREFIX}0Z`);
    expect(text).toContain(`${MATH_PLACEHOLDER_PREFIX}1Z`);
    expect(text).toContain(`${MATH_PLACEHOLDER_PREFIX}2Z`);
  });

  it("preserves LaTeX characters without breaking markdown syntax", () => {
    const raw = "Subscripts $a_1, a_2$ and asterisks $A * B$ and carets $x^2$.";
    const { text, spans } = extractMath(raw);

    expect(spans).toHaveLength(3);
    // The placeholder text should have no underscores or asterisks that would trick a markdown parser
    expect(text).not.toContain("a_1");
    expect(text).not.toContain("A * B");
    expect(text).not.toContain("x^2");
  });
});

describe("ChattyMarkdown - LaTeX Display Formatter", () => {
  it("formats fractions and square roots into readable unicode", () => {
    expect(formatLatexForDisplay("\\frac{1}{2}")).toBe("(1 / 2)");
    expect(formatLatexForDisplay("\\sqrt{x}")).toBe("√(x)");
  });

  it("converts greek and mathematical symbols", () => {
    const formatted = formatLatexForDisplay("\\alpha + \\beta = \\gamma \\le \\pi \\times \\infty");
    expect(formatted).toContain("α");
    expect(formatted).toContain("β");
    expect(formatted).toContain("γ");
    expect(formatted).toContain("≤");
    expect(formatted).toContain("π");
    expect(formatted).toContain("×");
    expect(formatted).toContain("∞");
  });

  it("converts superscripts and subscripts", () => {
    const formatted = formatLatexForDisplay("x^2 + y_1 = z_0");
    expect(formatted).toContain("x²");
    expect(formatted).toContain("y₁");
    expect(formatted).toContain("z₀");
  });
});

describe("ChattyMarkdown - Inline Tokenizer", () => {
  it("parses bold, italic, code, strikethrough, and links", () => {
    const raw = "This is **bold**, *italic*, ~~deleted~~, `code`, and [Chatty](https://chatty.personaliai.com).";
    const tokens = parseInlineTokens(raw, []);

    const types = tokens.map((t) => t.type);
    expect(types).toContain("bold");
    expect(types).toContain("italic");
    expect(types).toContain("strikethrough");
    expect(types).toContain("code");
    expect(types).toContain("link");

    const link = tokens.find((t) => t.type === "link");
    expect(link?.text).toBe("Chatty");
    expect(link?.url).toBe("https://chatty.personaliai.com");

    const bold = tokens.find((t) => t.type === "bold");
    expect(bold?.text).toBe("bold");

    const code = tokens.find((t) => t.type === "code");
    expect(code?.text).toBe("code");
  });

  it("identifies math placeholders and attaches math span metadata", () => {
    const raw = `Solve ${MATH_PLACEHOLDER_PREFIX}0Z for x.`;
    const mathSpans = [{ latex: "x^2 - 4 = 0", isBlock: false }];
    const tokens = parseInlineTokens(raw, mathSpans);

    const mathToken = tokens.find((t) => t.type === "math");
    expect(mathToken).toBeDefined();
    expect(mathToken?.text).toBe("x^2 - 4 = 0");
    expect(mathToken?.mathSpan?.latex).toBe("x^2 - 4 = 0");
  });
});
