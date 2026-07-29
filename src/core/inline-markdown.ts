import { HttpUrlSchema } from "./schemas/primitives.js";

const TOKEN_PATTERN =
  /((?<![\\*])\*\*[^*\n]+\*\*(?!\*)|(?<![\\*])\*[^*\n]+\*(?!\*)|(?<![!\\])\[[^\]\n]+\]\([^() \n]+\)(?!\)))/gu;
const LINK_PATTERN = /^\[([^\]]+)\]\(([^)]+)\)$/u;

export type SafeInlineMarkdownToken =
  | Readonly<{ kind: "text"; text: string }>
  | Readonly<{ kind: "strong"; text: string }>
  | Readonly<{ kind: "emphasis"; text: string }>
  | Readonly<{ kind: "link"; text: string; href: string }>;

/** Parses one supported Markdown token or preserves it as plain text. */
function parseMatchedToken(token: string): SafeInlineMarkdownToken {
  if (token.startsWith("**") && token.endsWith("**")) {
    return { kind: "strong", text: token.slice(2, -2) };
  }
  if (token.startsWith("*") && token.endsWith("*")) {
    return { kind: "emphasis", text: token.slice(1, -1) };
  }

  const link = LINK_PATTERN.exec(token);
  if (link === null) {
    return { kind: "text", text: token };
  }
  const [, label, candidateUrl] = link;
  const parsedUrl = HttpUrlSchema.safeParse(candidateUrl);
  return parsedUrl.success && label !== undefined
    ? { kind: "link", text: label, href: parsedUrl.data }
    : { kind: "text", text: token };
}

/** Tokenises the exact restricted inline Markdown subset used by rendering. */
export function tokeniseSafeInlineMarkdown(
  value: string,
): SafeInlineMarkdownToken[] {
  const tokens: SafeInlineMarkdownToken[] = [];
  let cursor = 0;
  for (const match of value.matchAll(TOKEN_PATTERN)) {
    const index = match.index;
    if (index > cursor) {
      tokens.push({ kind: "text", text: value.slice(cursor, index) });
    }
    tokens.push(parseMatchedToken(match[0]));
    cursor = index + match[0].length;
  }
  if (cursor < value.length) {
    tokens.push({ kind: "text", text: value.slice(cursor) });
  }
  return tokens;
}
