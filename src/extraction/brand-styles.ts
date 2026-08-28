import postcss from "postcss";
import type { BrandStyleEvidence } from "../brand/settings.js";
import {
  collectStyleRoles,
  resolveStyleRoles,
  type SourcedStyleCandidate,
  type StyleRoleCandidate,
} from "./style-role-candidates.js";

import type { EvidenceRef } from "../core/schemas/index.js";
import type { CssSource, HtmlSource } from "./contracts.js";
import { hasBoundedCssStructure } from "./css-structure-budget.js";
import {
  elementAttribute,
  elementName,
  type HtmlDocument,
  nodeText,
  walkElements,
} from "./html-document.js";

const NON_BRAND_FONTS = new Set([
  "-apple-system",
  "arial",
  "blinkmacsystemfont",
  "cursive",
  "fantasy",
  "helvetica",
  "inherit",
  "initial",
  "math",
  "monospace",
  "revert",
  "revert-layer",
  "sans-serif",
  "segoe ui",
  "serif",
  "system-ui",
  "ui-monospace",
  "ui-rounded",
  "ui-sans-serif",
  "ui-serif",
  "unset",
]);
const MAX_DECLARATION_VALUE_BYTES = 4_096;
const MAX_STYLE_VALUES_PER_SOURCE = 32;

export type BrandStyles = Readonly<{
  roles: BrandStyleEvidence;
  colours: string[];
  fonts: string[];
  colourEvidence: EvidenceRef[];
  fontEvidence: EvidenceRef[];
}>;

type SourceStyles = Readonly<{
  roles: StyleRoleCandidate[];
  colours: string[];
  fonts: string[];
  reference: EvidenceRef;
}>;

/** Extracts inert style evidence from inline and already-fetched CSS. */
export function extractBrandStyles(
  source: HtmlSource,
  document: HtmlDocument,
  externalCss: readonly CssSource[],
): BrandStyles {
  return extractStyles([...inlineCssSources(source, document), ...externalCss]);
}

/** Parses inert CSS declarations without loading imports or resources. */
function extractStyles(sources: readonly CssSource[]): BrandStyles {
  const colours: string[] = [];
  const fonts: string[] = [];
  const colourEvidence: EvidenceRef[] = [];
  const fontEvidence: EvidenceRef[] = [];
  const candidates: SourcedStyleCandidate[] = [];
  for (const source of sources) {
    const extracted = extractSourceStyles(source);
    if (!extracted) {
      continue;
    }
    colours.push(...extracted.colours);
    fonts.push(...extracted.fonts);
    candidates.push(
      ...extracted.roles.map((role) => ({
        ...role,
        evidence: { url: source.url, field: source.field },
      })),
    );
    if (extracted.colours.length > 0) {
      colourEvidence.push(extracted.reference);
    }
    if (extracted.fonts.length > 0) {
      fontEvidence.push(extracted.reference);
    }
  }
  return {
    roles: resolveStyleRoles(candidates),
    colours: unique(colours).slice(0, 8),
    fonts: unique(fonts).slice(0, 8),
    colourEvidence: uniqueByJson(colourEvidence).slice(0, 8),
    fontEvidence: uniqueByJson(fontEvidence).slice(0, 8),
  };
}

/** Safely parses and collects bounded values from one stylesheet source. */
function extractSourceStyles(source: CssSource): SourceStyles | undefined {
  if (!hasBoundedCssStructure(source.css)) {
    return undefined;
  }
  try {
    const values = collectStyleValues(source.css);
    return {
      ...values,
      reference: {
        source: "website",
        url: source.url,
        field: source.field,
      },
    };
  } catch {
    // Invalid CSS contributes no inferred style evidence.
    return undefined;
  }
}

/** Collects bounded palette and primary-font values from one parsed CSS root. */
function collectStyleValues(css: string): Omit<SourceStyles, "reference"> {
  const colours: string[] = [];
  const fonts: string[] = [];
  const root = postcss.parse(css, { from: undefined });
  root.walkDecls((declaration) => {
    if (!isBoundedDeclarationValue(declaration.value)) {
      return;
    }
    if (
      colours.length < MAX_STYLE_VALUES_PER_SOURCE &&
      isColourDeclaration(declaration.prop, declaration.value)
    ) {
      appendBounded(colours, extractColours(declaration.value));
    }
    if (
      fonts.length < MAX_STYLE_VALUES_PER_SOURCE &&
      declaration.prop.toLowerCase() === "font-family"
    ) {
      appendBounded(fonts, extractFonts(declaration.value));
    }
  });
  return { colours, fonts, roles: collectStyleRoles(root) };
}

/** Reports whether a declaration value is safe for bounded token extraction. */
function isBoundedDeclarationValue(value: string): boolean {
  return (
    value.length <= MAX_DECLARATION_VALUE_BYTES &&
    new TextEncoder().encode(value).byteLength <= MAX_DECLARATION_VALUE_BYTES
  );
}

/** Appends only the remaining bounded values for one stylesheet source. */
function appendBounded(target: string[], values: readonly string[]): void {
  const remaining = MAX_STYLE_VALUES_PER_SOURCE - target.length;
  target.push(...values.slice(0, remaining));
}

/** Reports whether a declaration can safely contribute palette evidence. */
function isColourDeclaration(property: string, value: string): boolean {
  return (
    /(?:^|-)(?:background|border|color|fill|stroke)(?:-|$)/u.test(
      property.toLowerCase(),
    ) && !/url\s*\(/iu.test(value)
  );
}

/** Collects inline style blocks and attributes under stable evidence fields. */
function inlineCssSources(
  source: HtmlSource,
  document: HtmlDocument,
): CssSource[] {
  const sources: CssSource[] = [];
  walkElements(document, (element) => {
    if (sources.length >= 16) {
      return;
    }
    if (elementName(element) === "style") {
      sources.push({
        url: source.finalUrl,
        css: nodeText(element),
        field: styleField(sources.length),
      });
      return;
    }
    const style = elementAttribute(element, "style");
    if (style) {
      sources.push({
        url: source.finalUrl,
        css: `${elementName(element)}{${style}}`,
        field: styleField(sources.length),
      });
    }
  });
  return sources;
}

/** Returns a stable one-based inline-style evidence field. */
function styleField(index: number): string {
  return `styles.inline-${String(index + 1).padStart(2, "0")}`;
}

/** Returns supported CSS colours as normalised six-digit hex values. */
function extractColours(value: string): string[] {
  const colours: string[] = [];
  for (const match of value.matchAll(
    /#([0-9A-F]{3}|[0-9A-F]{6})(?![0-9A-F])/giu,
  )) {
    const hex = match[1]!;
    const expanded =
      hex.length === 3
        ? [...hex].map((digit) => `${digit}${digit}`).join("")
        : hex;
    colours.push(`#${expanded}`.toUpperCase());
    if (colours.length >= MAX_STYLE_VALUES_PER_SOURCE) {
      break;
    }
  }
  return colours;
}

/** Returns only an explicit non-system primary font from one declaration. */
function extractFonts(value: string): string[] {
  const font = primaryFontFamily(value)
    .trim()
    .replace(/^(['"])(.*)\1$/u, "$2");
  const normalised = font.toLowerCase();
  return font.length > 0 &&
    font.length <= 200 &&
    !normalised.startsWith("var(") &&
    !NON_BRAND_FONTS.has(normalised)
    ? [font]
    : [];
}

/** Reads the first comma-delimited family while respecting quoted commas. */
function primaryFontFamily(value: string): string {
  let quote: "'" | '"' | undefined;
  let escaped = false;
  for (let index = 0; index < value.length; index += 1) {
    const character = value[index]!;
    if (escaped) {
      escaped = false;
    } else if (character === "\\") {
      escaped = true;
    } else if (quote && character === quote) {
      quote = undefined;
    } else if (!quote && (character === "'" || character === '"')) {
      quote = character;
    } else if (!quote && character === ",") {
      return value.slice(0, index);
    }
  }
  return value;
}

/** Deduplicates strings without changing their first-seen order. */
function unique(values: readonly string[]): string[] {
  return [...new Set(values)];
}

/** Deduplicates serialisable values without changing first-seen order. */
function uniqueByJson<T>(values: readonly T[]): T[] {
  const seen = new Set<string>();
  return values.filter((value) => {
    const key = JSON.stringify(value);
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}
