import React, { useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Linking,
  Platform,
  Clipboard,
} from "react-native";

export interface ChattyMathSpan {
  latex: string;
  isBlock: boolean;
}

export const MATH_PLACEHOLDER_PREFIX = "ChattyMathSpanZ";
const BLOCK_MATH_REGEX = /\$\$([\s\S]+?)\$\$/g;
const INLINE_MATH_REGEX = /(?<!\$)\$(?!\$)([^$\n]+?)(?<!\$)\$(?!\$)/g;
const MATH_PLACEHOLDER_REGEX = new RegExp(`${MATH_PLACEHOLDER_PREFIX}(\\d+)Z`);

/**
 * Extracts LaTeX math expressions ($inline$ and $$block$$) and replaces them
 * with alphanumeric placeholders to protect them from markdown parsing collisions
 * (e.g. subscripts `_`, superscripts `^`, backslashes, or asterisks).
 */
export function extractMath(raw: string): { text: string; spans: ChattyMathSpan[] } {
  const spans: ChattyMathSpan[] = [];

  let text = raw.replace(BLOCK_MATH_REGEX, (_, latex) => {
    const idx = spans.length;
    spans.push({ latex: latex.trim(), isBlock: true });
    return `${MATH_PLACEHOLDER_PREFIX}${idx}Z`;
  });

  text = text.replace(INLINE_MATH_REGEX, (_, latex) => {
    const idx = spans.length;
    spans.push({ latex: latex.trim(), isBlock: false });
    return `${MATH_PLACEHOLDER_PREFIX}${idx}Z`;
  });

  return { text, spans };
}

/**
 * Converts common LaTeX math symbols and patterns into clean Unicode equivalents
 * for readable native rendering across iOS and Android without native binary deps.
 */
export function formatLatexForDisplay(latex: string): string {
  let s = latex;

  // Fractions: \frac{num}{den} -> (num / den)
  s = s.replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, "($1 / $2)");

  // Square roots: \sqrt{x} -> √(x)
  s = s.replace(/\\sqrt\{([^}]+)\}/g, "√($1)");

  // Common math symbols
  const symbolMap: Record<string, string> = {
    "\\alpha": "α",
    "\\beta": "β",
    "\\gamma": "γ",
    "\\delta": "δ",
    "\\epsilon": "ε",
    "\\theta": "θ",
    "\\lambda": "λ",
    "\\mu": "μ",
    "\\pi": "π",
    "\\sigma": "σ",
    "\\omega": "ω",
    "\\Delta": "Δ",
    "\\Sigma": "Σ",
    "\\Omega": "Ω",
    "\\infty": "∞",
    "\\times": "×",
    "\\div": "÷",
    "\\pm": "±",
    "\\mp": "∓",
    "\\le": "≤",
    "\\leq": "≤",
    "\\ge": "≥",
    "\\geq": "≥",
    "\\neq": "≠",
    "\\approx": "≈",
    "\\equiv": "≡",
    "\\in": "∈",
    "\\notin": "∉",
    "\\subset": "⊂",
    "\\subseteq": "⊆",
    "\\cup": "∪",
    "\\cap": "∩",
    "\\forall": "∀",
    "\\exists": "∃",
    "\\to": "→",
    "\\rightarrow": "→",
    "\\leftarrow": "←",
    "\\Rightarrow": "⇒",
    "\\Leftarrow": "⇐",
    "\\sum": "∑",
    "\\prod": "∏",
    "\\int": "∫",
    "\\cdot": "·",
    "\\quad": "  ",
    "\\qquad": "    ",
    "\\,": " ",
  };

  for (const [cmd, sym] of Object.entries(symbolMap)) {
    s = s.split(cmd).join(sym);
  }

  // Superscripts with braces: x^{2} -> x²
  const superMap: Record<string, string> = {
    "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴",
    "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹",
    "+": "⁺", "-": "⁻", "=": "⁼", "n": "ⁿ", "i": "ⁱ",
  };
  s = s.replace(/\^\{([0-9+\-=ni]+)\}/g, (_, exp) =>
    exp.split("").map((c: string) => superMap[c] || c).join("")
  );
  s = s.replace(/\^([0-9ni])/g, (_, c) => superMap[c] || `^${c}`);

  // Subscripts with braces: x_{1} -> x₁
  const subMap: Record<string, string> = {
    "0": "₀", "1": "₁", "2": "₂", "3": "₃", "4": "₄",
    "5": "₅", "6": "₆", "7": "₇", "8": "⁸", "9": "₉",
    "+": "₊", "-": "₋", "=": "₌", "a": "ₐ", "e": "ₑ",
    "o": "ₒ", "x": "ₓ", "i": "ᵢ", "j": "ⱼ",
  };
  s = s.replace(/_\{([0-9+\-=aeoxij]+)\}/g, (_, sub) =>
    sub.split("").map((c: string) => subMap[c] || c).join("")
  );
  s = s.replace(/_([0-9ij])/g, (_, c) => subMap[c] || `_${c}`);

  // Remove redundant LaTeX group braces
  s = s.replace(/\{([^{}]+)\}/g, "$1");

  return s;
}

export function ChattyLatexView({
  latex,
  isBlock,
  color,
  fontSize,
}: {
  latex: string;
  isBlock: boolean;
  color: string;
  fontSize: number;
}) {
  const formatted = useMemo(() => formatLatexForDisplay(latex), [latex]);

  if (isBlock) {
    return (
      <View style={styles.blockMathContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <Text
            style={[
              styles.blockMathText,
              { color, fontSize: fontSize * 1.05 },
              Platform.OS === "ios" ? { fontFamily: "Georgia" } : { fontFamily: "serif" },
            ]}
          >
            {formatted}
          </Text>
        </ScrollView>
      </View>
    );
  }

  return (
    <Text
      style={[
        styles.inlineMathText,
        { color, fontSize },
        Platform.OS === "ios" ? { fontFamily: "Georgia" } : { fontFamily: "serif" },
      ]}
    >
      {formatted}
    </Text>
  );
}

interface InlineToken {
  type: "text" | "bold" | "italic" | "code" | "strikethrough" | "link" | "math";
  text: string;
  url?: string;
  mathSpan?: ChattyMathSpan;
}

export function parseInlineTokens(raw: string, mathSpans: ChattyMathSpan[]): InlineToken[] {
  const tokens: InlineToken[] = [];
  // Tokenizer regex matching math placeholders, links, bold, italic, code, strikethrough
  const pattern = new RegExp(
    `(${MATH_PLACEHOLDER_PREFIX}\\d+Z|\\[[^\\]]+?\\]\\([^)]+?\\)|\\*\\*[^*]+?\\*\\*|__[^_]+?__|~~[^~]+?~~|\`[^\`]+?\`|\\*[^*]+?\\*|_[^_]+?_)`,
    "g"
  );

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(raw)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({ type: "text", text: raw.slice(lastIndex, match.index) });
    }

    const matched = match[0];
    const mathMatch = MATH_PLACEHOLDER_REGEX.exec(matched);

    if (mathMatch) {
      const idx = parseInt(mathMatch[1], 10);
      const span = mathSpans[idx];
      if (span) {
        tokens.push({ type: "math", text: span.latex, mathSpan: span });
      } else {
        tokens.push({ type: "text", text: matched });
      }
    } else if (matched.startsWith("[") && matched.includes("](")) {
      const linkParts = matched.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (linkParts) {
        tokens.push({ type: "link", text: linkParts[1], url: linkParts[2] });
      } else {
        tokens.push({ type: "text", text: matched });
      }
    } else if (
      (matched.startsWith("**") && matched.endsWith("**")) ||
      (matched.startsWith("__") && matched.endsWith("__"))
    ) {
      tokens.push({ type: "bold", text: matched.slice(2, -2) });
    } else if (matched.startsWith("~~") && matched.endsWith("~~")) {
      tokens.push({ type: "strikethrough", text: matched.slice(2, -2) });
    } else if (matched.startsWith("`") && matched.endsWith("`")) {
      tokens.push({ type: "code", text: matched.slice(1, -1) });
    } else if (
      (matched.startsWith("*") && matched.endsWith("*")) ||
      (matched.startsWith("_") && matched.endsWith("_"))
    ) {
      tokens.push({ type: "italic", text: matched.slice(1, -1) });
    } else {
      tokens.push({ type: "text", text: matched });
    }

    lastIndex = match.index + matched.length;
  }

  if (lastIndex < raw.length) {
    tokens.push({ type: "text", text: raw.slice(lastIndex) });
  }

  return tokens;
}

function InlineMarkdownRow({
  text,
  mathSpans,
  color,
  fontSize,
  baseStyle,
}: {
  text: string;
  mathSpans: ChattyMathSpan[];
  color: string;
  fontSize: number;
  baseStyle?: any;
}) {
  const tokens = useMemo(() => parseInlineTokens(text, mathSpans), [text, mathSpans]);

  return (
    <Text style={[{ color, fontSize, lineHeight: fontSize * 1.45 }, baseStyle]}>
      {tokens.map((token, i) => {
        switch (token.type) {
          case "bold":
            return (
              <Text key={i} style={{ fontWeight: "bold" }}>
                {token.text}
              </Text>
            );
          case "italic":
            return (
              <Text key={i} style={{ fontStyle: "italic" }}>
                {token.text}
              </Text>
            );
          case "strikethrough":
            return (
              <Text key={i} style={{ textDecorationLine: "line-through" }}>
                {token.text}
              </Text>
            );
          case "code":
            return (
              <Text
                key={i}
                style={{
                  fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
                  backgroundColor: "rgba(0,0,0,0.06)",
                  fontSize: fontSize * 0.9,
                }}
              >
                {` ${token.text} `}
              </Text>
            );
          case "link":
            return (
              <Text
                key={i}
                style={{ color: "#2563EB", textDecorationLine: "underline" }}
                onPress={() => {
                  if (token.url) Linking.openURL(token.url).catch(() => {});
                }}
              >
                {token.text}
              </Text>
            );
          case "math":
            return token.mathSpan ? (
              <ChattyLatexView
                key={i}
                latex={token.mathSpan.latex}
                isBlock={token.mathSpan.isBlock}
                color={color}
                fontSize={fontSize}
              />
            ) : (
              <Text key={i}>{token.text}</Text>
            );
          default:
            return <Text key={i}>{token.text}</Text>;
        }
      })}
    </Text>
  );
}

export interface ChattyMarkdownProps {
  text: string;
  color?: string;
  fontSize?: number;
  style?: any;
}

export function ChattyMarkdown({
  text,
  color = "#111827",
  fontSize = 13,
  style,
}: ChattyMarkdownProps) {
  const { text: processedText, spans: mathSpans } = useMemo(() => extractMath(text), [text]);

  const blocks = useMemo(() => {
    const rawLines = processedText.split(/\r?\n/);
    const result: Array<
      | { type: "heading"; level: number; text: string }
      | { type: "code"; lang: string; code: string }
      | { type: "table"; headers: string[]; rows: string[][] }
      | { type: "blockquote"; lines: string[] }
      | { type: "list"; ordered: boolean; start: number; items: string[] }
      | { type: "hr" }
      | { type: "blockMath"; latex: string }
      | { type: "paragraph"; text: string }
    > = [];

    let i = 0;
    while (i < rawLines.length) {
      const line = rawLines[i];
      const trimmed = line.trim();

      // Check lone block math placeholder
      const loneMathMatch = trimmed.match(new RegExp(`^${MATH_PLACEHOLDER_PREFIX}(\\d+)Z$`));
      if (loneMathMatch) {
        const idx = parseInt(loneMathMatch[1], 10);
        const span = mathSpans[idx];
        if (span && span.isBlock) {
          result.push({ type: "blockMath", latex: span.latex });
          i++;
          continue;
        }
      }

      // Fenced code block
      if (trimmed.startsWith("```")) {
        const lang = trimmed.slice(3).trim();
        const codeLines: string[] = [];
        i++;
        while (i < rawLines.length && !rawLines[i].trim().startsWith("```")) {
          codeLines.push(rawLines[i]);
          i++;
        }
        if (i < rawLines.length) i++; // skip closing ```
        result.push({ type: "code", lang, code: codeLines.join("\n") });
        continue;
      }

      // Horizontal rule
      if (/^(\-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
        result.push({ type: "hr" });
        i++;
        continue;
      }

      // Headings
      const headingMatch = line.match(/^(#{1,6})\s+(.*)$/);
      if (headingMatch) {
        result.push({
          type: "heading",
          level: headingMatch[1].length,
          text: headingMatch[2],
        });
        i++;
        continue;
      }

      // Blockquotes
      if (trimmed.startsWith(">")) {
        const bqLines: string[] = [];
        while (i < rawLines.length && rawLines[i].trim().startsWith(">")) {
          bqLines.push(rawLines[i].replace(/^\s*>\s?/, ""));
          i++;
        }
        result.push({ type: "blockquote", lines: bqLines });
        continue;
      }

      // GFM Tables: lines starting and ending with |
      if (trimmed.startsWith("|") && trimmed.endsWith("|") && i + 1 < rawLines.length) {
        const nextTrimmed = rawLines[i + 1].trim();
        // Check if next line is table separator: | --- | --- |
        if (nextTrimmed.startsWith("|") && nextTrimmed.includes("---")) {
          const splitRow = (row: string) =>
            row
              .slice(1, -1)
              .split("|")
              .map((c) => c.trim());
          const headers = splitRow(trimmed);
          i += 2; // skip header and separator
          const rows: string[][] = [];
          while (i < rawLines.length && rawLines[i].trim().startsWith("|") && rawLines[i].trim().endsWith("|")) {
            rows.push(splitRow(rawLines[i].trim()));
            i++;
          }
          result.push({ type: "table", headers, rows });
          continue;
        }
      }

      // Unordered lists (- or *)
      if (/^[-*]\s+/.test(trimmed)) {
        const items: string[] = [];
        while (i < rawLines.length && /^[-*]\s+/.test(rawLines[i].trim())) {
          items.push(rawLines[i].trim().replace(/^[-*]\s+/, ""));
          i++;
        }
        result.push({ type: "list", ordered: false, start: 1, items });
        continue;
      }

      // Ordered lists (1. 2. etc)
      const olMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
      if (olMatch) {
        const start = parseInt(olMatch[1], 10);
        const items: string[] = [];
        while (i < rawLines.length && /^\d+\.\s+/.test(rawLines[i].trim())) {
          items.push(rawLines[i].trim().replace(/^\d+\.\s+/, ""));
          i++;
        }
        result.push({ type: "list", ordered: true, start, items });
        continue;
      }

      // Paragraph
      if (trimmed.length > 0) {
        result.push({ type: "paragraph", text: line });
      }
      i++;
    }

    return result;
  }, [processedText, mathSpans]);

  return (
    <View style={[styles.container, style]}>
      {blocks.map((block, idx) => {
        switch (block.type) {
          case "blockMath":
            return (
              <ChattyLatexView
                key={idx}
                latex={block.latex}
                isBlock
                color={color}
                fontSize={fontSize}
              />
            );
          case "heading": {
            const scale =
              block.level === 1
                ? 1.4
                : block.level === 2
                ? 1.3
                : block.level === 3
                ? 1.15
                : 1.05;
            return (
              <View key={idx} style={styles.blockSpacing}>
                <InlineMarkdownRow
                  text={block.text}
                  mathSpans={mathSpans}
                  color={color}
                  fontSize={fontSize * scale}
                  baseStyle={{ fontWeight: "bold" }}
                />
              </View>
            );
          }
          case "code":
            return (
              <View key={idx} style={styles.codeBlock}>
                <View style={styles.codeHeader}>
                  <Text style={styles.codeLang}>{block.lang || "code"}</Text>
                  <TouchableOpacity
                    onPress={() => Clipboard.setString(block.code)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Text style={styles.copyText}>Copy</Text>
                  </TouchableOpacity>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.codeBody}>
                  <Text
                    style={[
                      styles.codeContent,
                      { fontSize: fontSize * 0.9 },
                      Platform.OS === "ios" ? { fontFamily: "Menlo" } : { fontFamily: "monospace" },
                    ]}
                  >
                    {block.code}
                  </Text>
                </ScrollView>
              </View>
            );
          case "table":
            return (
              <View key={idx} style={styles.tableContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View>
                    <View style={[styles.tableRow, styles.tableHeaderRow]}>
                      {block.headers.map((h, hIdx) => (
                        <View key={hIdx} style={styles.tableCell}>
                          <InlineMarkdownRow
                            text={h}
                            mathSpans={mathSpans}
                            color={color}
                            fontSize={fontSize * 0.95}
                            baseStyle={{ fontWeight: "bold" }}
                          />
                        </View>
                      ))}
                    </View>
                    {block.rows.map((row, rIdx) => (
                      <View key={rIdx} style={styles.tableRow}>
                        {row.map((cell, cIdx) => (
                          <View key={cIdx} style={styles.tableCell}>
                            <InlineMarkdownRow
                              text={cell}
                              mathSpans={mathSpans}
                              color={color}
                              fontSize={fontSize * 0.95}
                            />
                          </View>
                        ))}
                      </View>
                    ))}
                  </View>
                </ScrollView>
              </View>
            );
          case "blockquote":
            return (
              <View key={idx} style={[styles.blockquote, { borderLeftColor: color }]}>
                {block.lines.map((l, lIdx) => (
                  <InlineMarkdownRow
                    key={lIdx}
                    text={l}
                    mathSpans={mathSpans}
                    color={color}
                    fontSize={fontSize}
                    baseStyle={{ opacity: 0.85 }}
                  />
                ))}
              </View>
            );
          case "list":
            return (
              <View key={idx} style={styles.blockSpacing}>
                {block.items.map((item, itemIdx) => {
                  const marker = block.ordered ? `${block.start + itemIdx}.` : "•";
                  return (
                    <View key={itemIdx} style={styles.listItemRow}>
                      <Text style={[styles.listMarker, { color, fontSize }]}>{marker}</Text>
                      <View style={styles.listItemContent}>
                        <InlineMarkdownRow
                          text={item}
                          mathSpans={mathSpans}
                          color={color}
                          fontSize={fontSize}
                        />
                      </View>
                    </View>
                  );
                })}
              </View>
            );
          case "hr":
            return <View key={idx} style={[styles.hr, { backgroundColor: "rgba(0,0,0,0.12)" }]} />;
          case "paragraph":
            return (
              <View key={idx} style={styles.blockSpacing}>
                <InlineMarkdownRow
                  text={block.text}
                  mathSpans={mathSpans}
                  color={color}
                  fontSize={fontSize}
                />
              </View>
            );
          default:
            return null;
        }
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  blockSpacing: {
    marginVertical: 2,
  },
  inlineMathText: {
    fontStyle: "italic",
    fontWeight: "500",
  },
  blockMathContainer: {
    marginVertical: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "rgba(0,0,0,0.03)",
    borderRadius: 8,
    alignItems: "center",
  },
  blockMathText: {
    fontStyle: "italic",
    textAlign: "center",
    letterSpacing: 0.5,
  },
  codeBlock: {
    marginVertical: 6,
    borderRadius: 8,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
    backgroundColor: "#f9fafb",
  },
  codeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.05)",
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  codeLang: {
    fontSize: 11,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    color: "#6b7280",
    textTransform: "lowercase",
  },
  copyText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#2563EB",
  },
  codeBody: {
    padding: 10,
  },
  codeContent: {
    color: "#111827",
  },
  tableContainer: {
    marginVertical: 6,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
    borderRadius: 6,
    overflow: "hidden",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.08)",
  },
  tableHeaderRow: {
    backgroundColor: "rgba(0,0,0,0.04)",
  },
  tableCell: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    minWidth: 80,
  },
  blockquote: {
    borderLeftWidth: 3,
    paddingLeft: 10,
    marginVertical: 4,
  },
  listItemRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 2,
  },
  listMarker: {
    width: 20,
    fontWeight: "600",
  },
  listItemContent: {
    flex: 1,
  },
  hr: {
    height: 1,
    marginVertical: 6,
  },
});
