const ENTITY_PATTERN = /&(amp|quot|#x27|lt|gt|#\d+|#x[\da-f]+);/giu;
const NAMED_ENTITIES = {
  "#x27": "'",
  amp: "&",
  gt: ">",
  lt: "<",
  quot: '"',
} as const;

export type GeneratedStartTag = {
  readonly index: number;
  readonly name: string;
  readonly source: string;
};

export type GeneratedElementContext = {
  readonly ancestors: readonly GeneratedStartTag[];
  readonly tag: GeneratedStartTag;
};

const VOID_ELEMENTS = new Set([
  "area",
  "base",
  "br",
  "col",
  "embed",
  "hr",
  "img",
  "input",
  "link",
  "meta",
  "param",
  "source",
  "track",
  "wbr",
]);

/** Decodes the closed entity forms emitted by React text and attributes. */
export function decodeGeneratedHtml(value: string): string {
  return value.replace(ENTITY_PATTERN, (_, entity: string) => {
    const named = NAMED_ENTITIES[entity as keyof typeof NAMED_ENTITIES];
    if (named !== undefined) {
      return named;
    }
    const hexadecimal = entity.toLowerCase().startsWith("#x");
    const digits = entity.slice(hexadecimal ? 2 : 1);
    const codePoint = Number.parseInt(digits, hexadecimal ? 16 : 10);
    return Number.isNaN(codePoint)
      ? `&${entity};`
      : String.fromCodePoint(codePoint);
  });
}

/** Extracts start tags together with their generated ancestor stack. */
export function collectElementContexts(
  html: string,
): GeneratedElementContext[] {
  const stack: GeneratedStartTag[] = [];
  const contexts: GeneratedElementContext[] = [];
  for (const match of html.matchAll(/<\/?([a-z][a-z0-9-]*)\b[^>]*>/giu)) {
    const name = match[1]?.toLowerCase();
    if (match.index === undefined || name === undefined) {
      continue;
    }
    if (match[0].startsWith("</")) {
      let ancestorIndex = -1;
      for (let index = stack.length - 1; index >= 0; index -= 1) {
        if (stack[index]?.name === name) {
          ancestorIndex = index;
          break;
        }
      }
      if (ancestorIndex >= 0) {
        stack.splice(ancestorIndex);
      }
      continue;
    }
    const tag = { index: match.index, name, source: match[0] };
    contexts.push({ ancestors: [...stack], tag });
    if (!match[0].endsWith("/>") && !VOID_ELEMENTS.has(name)) {
      stack.push(tag);
    }
  }
  return contexts;
}

/** Extracts generated start tags with source offsets, never visible text. */
export function collectStartTags(
  html: string,
  expectedName?: string,
): GeneratedStartTag[] {
  return collectElementContexts(html).flatMap(({ tag }) =>
    expectedName === undefined || tag.name === expectedName ? [tag] : [],
  );
}

/** Extracts every double-quoted value for one generated attribute. */
export function attributeValues(
  tag: GeneratedStartTag,
  attribute: string,
): string[] {
  const pattern = new RegExp(`\\s${attribute}="([^"]*)"`, "gu");
  return [...tag.source.matchAll(pattern)].flatMap((match) =>
    match[1] === undefined ? [] : [decodeGeneratedHtml(match[1])],
  );
}

/** Returns one attribute only when it appears exactly once. */
export function exactAttribute(
  tag: GeneratedStartTag,
  attribute: string,
): string | undefined {
  const values = attributeValues(tag, attribute);
  return values.length === 1 ? values[0] : undefined;
}

/** Collects exact text from simple marked elements without parsing visible text as tags. */
export function markedElementTexts(
  html: string,
  marker: string,
  markerValue: string,
): string[] {
  return collectStartTags(html).flatMap((tag) => {
    if (exactAttribute(tag, marker) !== markerValue) {
      return [];
    }
    const contentStart = tag.index + tag.source.length;
    const contentEnd = html.indexOf(`</${tag.name}>`, contentStart);
    if (contentEnd < contentStart) {
      return [];
    }
    const rawText = html
      .slice(contentStart, contentEnd)
      .replaceAll("<!-- -->", "");
    return [decodeGeneratedHtml(rawText)];
  });
}
