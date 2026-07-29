import type { ReactNode } from "react";

import {
  tokeniseSafeInlineMarkdown,
  type SafeInlineMarkdownToken,
} from "../core/inline-markdown.js";
import { inlineLinkStyle } from "./styles.js";

/** Renders one restricted inline Markdown token without raw HTML. */
function renderToken(token: SafeInlineMarkdownToken, key: number): ReactNode {
  if (token.kind === "strong") {
    return <strong key={key}>{token.text}</strong>;
  }
  if (token.kind === "emphasis") {
    return <em key={key}>{token.text}</em>;
  }
  if (token.kind === "text") {
    return token.text;
  }
  return (
    <a
      data-punch-text-role="inline-link"
      href={token.href}
      key={key}
      style={inlineLinkStyle}
    >
      {token.text}
    </a>
  );
}

/** Converts the supported inline Markdown subset to safely escaped React nodes. */
export function renderSafeInlineMarkdown(value: string): ReactNode[] {
  return tokeniseSafeInlineMarkdown(value).map(renderToken);
}
