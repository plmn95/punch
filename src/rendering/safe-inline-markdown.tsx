import type { ReactNode } from "react";

import {
  tokeniseSafeInlineMarkdown,
  type SafeInlineMarkdownToken,
} from "../core/inline-markdown.js";
import { useRenderStyles } from "./render-style-context.js";

/** Renders a safe Markdown link with this document's accessible brand colour. */
function InlineLink({ href, text }: { href: string; text: string }) {
  const { inlineLinkStyle } = useRenderStyles();
  return (
    <a data-punch-text-role="inline-link" href={href} style={inlineLinkStyle}>
      {text}
    </a>
  );
}

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
  return <InlineLink key={key} href={token.href} text={token.text} />;
}

/** Converts the supported inline Markdown subset to safely escaped React nodes. */
export function renderSafeInlineMarkdown(value: string): ReactNode[] {
  return tokeniseSafeInlineMarkdown(value).map(renderToken);
}
