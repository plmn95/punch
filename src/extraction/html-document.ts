import { Parser, parseDocument } from "htmlparser2";

import { HttpUrlSchema } from "../core/schemas/index.js";
import { ExtractionError } from "./extraction-error.js";
import { sanitiseSourceText } from "./text-normalisation.js";

export type HtmlDocument = ReturnType<typeof parseDocument>;
export type HtmlNode = HtmlDocument | HtmlDocument["children"][number];
export type HtmlElement = Extract<
  HtmlDocument["children"][number],
  { attribs: Record<string, string> }
>;

const HIDDEN_ELEMENTS = new Set([
  "canvas",
  "iframe",
  "noscript",
  "script",
  "style",
  "svg",
  "template",
]);
const MAX_HTML_STRUCTURE_TOKENS = 50_000;
const MAX_HTML_NESTING_DEPTH = 128;
const HTML_STRUCTURE_BREACH = Symbol("html-structure-breach");

/** Parses inert HTML without scripts, resource loading, or browser state. */
export function parseHtml(html: string): HtmlDocument {
  assertBoundedHtmlStructure(html);
  return parseDocument(html, {
    decodeEntities: true,
    lowerCaseAttributeNames: true,
    lowerCaseTags: true,
    recognizeSelfClosing: true,
  });
}

/** Preflights token count and depth before materialising a parsed DOM. */
function assertBoundedHtmlStructure(html: string): void {
  let tokens = 0;
  let depth = 0;
  const consume = () => {
    tokens += 1;
    if (tokens > MAX_HTML_STRUCTURE_TOKENS) {
      throw HTML_STRUCTURE_BREACH;
    }
  };
  const parser = new Parser({
    onopentag: () => {
      consume();
      depth += 1;
      if (depth > MAX_HTML_NESTING_DEPTH) {
        throw HTML_STRUCTURE_BREACH;
      }
    },
    onclosetag: () => {
      depth = Math.max(0, depth - 1);
    },
    onattribute: consume,
    ontext: consume,
    oncomment: consume,
    onprocessinginstruction: consume,
  });
  try {
    parser.end(html);
  } catch {
    throw new ExtractionError("invalid-source", false);
  }
}

/** Returns child nodes without assuming a specific DOM union member. */
export function childNodes(node: HtmlNode): readonly HtmlNode[] {
  return "children" in node ? node.children : [];
}

/** Reports whether a parsed node is an element. */
export function isElement(node: HtmlNode): node is HtmlElement {
  return "name" in node && "attribs" in node;
}

/** Returns one lower-cased parsed element name. */
export function elementName(element: HtmlElement): string {
  return element.name.toLowerCase();
}

/** Reads one lower-cased HTML attribute name. */
export function elementAttribute(
  element: HtmlElement,
  name: string,
): string | undefined {
  return element.attribs[name.toLowerCase()];
}

/** Walks parsed elements in document order. */
export function walkElements(
  node: HtmlNode,
  visit: (element: HtmlElement) => void,
): void {
  if (isElement(node)) {
    visit(node);
  }
  for (const child of childNodes(node)) {
    walkElements(child, visit);
  }
}

/** Returns decoded descendant text without markup. */
export function nodeText(node: HtmlNode): string {
  if (node.type === "text") {
    return node.data;
  }
  return childNodes(node).map(nodeText).join(" ");
}

/** Returns descendant text while excluding hidden or executable subtrees. */
export function visibleNodeText(node: HtmlNode): string {
  if (node.type === "text") {
    return node.data;
  }
  if (isElement(node) && isHiddenSelf(node)) {
    return "";
  }
  return childNodes(node).map(visibleNodeText).join(" ");
}

/** Reports whether an element or one of its ancestors is hidden content. */
export function isHiddenNode(node: HtmlNode): boolean {
  let current: HtmlNode | undefined = node;
  while (current) {
    if (isElement(current) && isHiddenSelf(current)) {
      return true;
    }
    current = "parent" in current ? (current.parent ?? undefined) : undefined;
  }
  return false;
}

/** Reports whether one element directly owns a hidden-content marker. */
function isHiddenSelf(node: HtmlElement): boolean {
  const name = elementName(node);
  const style = elementAttribute(node, "style")?.toLowerCase() ?? "";
  const ariaHidden = elementAttribute(node, "aria-hidden")
    ?.trim()
    .toLowerCase();
  return (
    HIDDEN_ELEMENTS.has(name) ||
    elementAttribute(node, "hidden") !== undefined ||
    ariaHidden === "true" ||
    /(?:display\s*:\s*none|visibility\s*:\s*hidden)/u.test(style)
  );
}

/** Returns matching metadata content in stable document order. */
export function metadataValues(
  document: HtmlDocument,
  attribute: "name" | "property" | "itemprop",
  expected: string,
): string[] {
  const values: string[] = [];
  walkElements(document, (element) => {
    if (
      elementName(element) === "meta" &&
      elementAttribute(element, attribute)?.toLowerCase() ===
        expected.toLowerCase()
    ) {
      const content = sanitiseSourceText(
        elementAttribute(element, "content") ?? "",
      );
      if (content) {
        values.push(content);
      }
    }
  });
  return values;
}

/** Returns semantic text from matching elements in document order. */
export function elementTextValues(
  document: HtmlDocument,
  name: string,
): string[] {
  const values: string[] = [];
  walkElements(document, (element) => {
    if (elementName(element) === name && !isHiddenNode(element)) {
      const text = sanitiseSourceText(visibleNodeText(element));
      if (text) {
        values.push(text);
      }
    }
  });
  return values;
}

/** Resolves an observed URL against the fetched document URL. */
export function resolveObservedUrl(
  value: unknown,
  finalUrl: string,
): string | undefined {
  if (typeof value !== "string" || value.trim() === "") {
    return undefined;
  }
  try {
    return HttpUrlSchema.parse(new URL(value, finalUrl).toString());
  } catch {
    return undefined;
  }
}

/** Returns parsed JSON-LD roots without interpreting their instructions. */
export function jsonLdValues(document: HtmlDocument): unknown[] {
  const values: unknown[] = [];
  let scripts = 0;
  let overflow = false;
  walkElements(document, (element) => {
    if (
      elementName(element) !== "script" ||
      elementAttribute(element, "type")?.toLowerCase() !== "application/ld+json"
    ) {
      return;
    }
    scripts += 1;
    if (scripts > 32) {
      overflow = true;
      return;
    }
    const rawText = nodeText(element);
    if (
      rawText.length > 64_000 ||
      new TextEncoder().encode(rawText).byteLength > 64_000
    ) {
      overflow = true;
      return;
    }
    const raw = rawText.trim();
    if (raw.length === 0) {
      return;
    }
    try {
      values.push(JSON.parse(raw));
    } catch {
      // Malformed structured data is ignored rather than repaired.
    }
  });
  return overflow ? [] : values;
}
