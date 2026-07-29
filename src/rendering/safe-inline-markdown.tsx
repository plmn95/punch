import type { ReactNode } from "react";

import { HttpUrlSchema } from "../core/schemas/primitives.js";

const TOKEN_PATTERN =
  /((?<![\\*])\*\*[^*\n]+\*\*(?!\*)|(?<![\\*])\*[^*\n]+\*(?!\*)|(?<![!\\])\[[^\]\n]+\]\([^() \n]+\)(?!\)))/gu;
const LINK_PATTERN = /^\[([^\]]+)\]\(([^)]+)\)$/u;

/** Renders one restricted inline Markdown token without raw HTML. */
function renderToken(token: string, key: number): ReactNode {
  if (token.startsWith("**") && token.endsWith("**")) {
    return <strong key={key}>{token.slice(2, -2)}</strong>;
  }

  if (token.startsWith("*") && token.endsWith("*")) {
    return <em key={key}>{token.slice(1, -1)}</em>;
  }

  const link = LINK_PATTERN.exec(token);
  if (link === null) {
    return token;
  }

  const [, label, candidateUrl] = link;
  const parsedUrl = HttpUrlSchema.safeParse(candidateUrl);
  if (!parsedUrl.success || label === undefined) {
    return token;
  }

  return (
    <a key={key} href={parsedUrl.data}>
      {label}
    </a>
  );
}

/** Converts the supported inline Markdown subset to safely escaped React nodes. */
export function renderSafeInlineMarkdown(value: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let cursor = 0;
  let key = 0;

  for (const match of value.matchAll(TOKEN_PATTERN)) {
    const index = match.index;
    if (index > cursor) {
      nodes.push(value.slice(cursor, index));
    }
    nodes.push(renderToken(match[0], key));
    cursor = index + match[0].length;
    key += 1;
  }

  if (cursor < value.length) {
    nodes.push(value.slice(cursor));
  }

  return nodes;
}
