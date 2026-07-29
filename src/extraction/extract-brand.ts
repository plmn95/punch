import {
  BrandEvidenceSchema,
  type EvidenceRef,
} from "../core/schemas/index.js";
import type {
  CssSource,
  DeterministicBrandExtraction,
  HtmlSource,
} from "./contracts.js";
import {
  type FactCandidate,
  inferredFact,
  resolveCriticalFact,
} from "./fact-candidates.js";
import { extractBrandStyles } from "./brand-styles.js";
import {
  elementAttribute,
  elementName,
  metadataValues,
  parseHtml,
  resolveObservedUrl,
  walkElements,
} from "./html-document.js";
import {
  jsonString,
  jsonUrlValues,
  selectJsonRecord,
} from "./structured-data.js";
import { buildSourceSegments } from "./source-text.js";
import { sanitiseSourceText } from "./text-normalisation.js";

const MAX_STYLESHEETS = 8;

/** Deterministically extracts bounded brand evidence and stylesheet targets. */
export function extractBrand(
  source: HtmlSource,
  externalCss: readonly CssSource[] = [],
): DeterministicBrandExtraction {
  const document = parseHtml(source.html);
  const selected = selectJsonRecord(
    document,
    ["Organization", "WebSite"],
    source.finalUrl,
    "origin",
  );
  const prefix = selected
    ? `jsonld.brand-${String(selected.index + 1).padStart(2, "0")}`
    : undefined;
  const styles = extractBrandStyles(source, document, externalCss);
  const evidence = BrandEvidenceSchema.parse({
    websiteUrl: source.finalUrl,
    name: extractBrandName(source, document, selected?.record, prefix),
    logoUrl: extractLogo(source, document, selected?.record, prefix),
    colours:
      styles.colours.length > 0
        ? inferredFact(
            styles.colours,
            styles.colourEvidence,
            "Website style declarations indicate this palette.",
          )
        : { state: "unknown" },
    fonts:
      styles.fonts.length > 0
        ? inferredFact(
            styles.fonts,
            styles.fontEvidence,
            "Website style declarations indicate these brand fonts.",
          )
        : { state: "unknown" },
    voice: { state: "unknown" },
  });

  return {
    evidence,
    segments: buildSourceSegments(document),
    stylesheetUrls: discoverStylesheetUrls(document, source.finalUrl),
  };
}

/** Discovers exact-final-origin stylesheet links without following imports. */
export function discoverStylesheetUrls(
  document: ReturnType<typeof parseHtml>,
  finalUrl: string,
): string[] {
  const urls: string[] = [];
  const seen = new Set<string>();
  const origin = new URL(finalUrl).origin;
  walkElements(document, (element) => {
    if (
      urls.length >= MAX_STYLESHEETS ||
      elementName(element) !== "link" ||
      !relTokens(elementAttribute(element, "rel")).has("stylesheet")
    ) {
      return;
    }
    const url = resolveObservedUrl(elementAttribute(element, "href"), finalUrl);
    if (url && new URL(url).origin === origin && !seen.has(url)) {
      seen.add(url);
      urls.push(url);
    }
  });
  return urls;
}

/** Extracts the first available, internally coherent brand-name source group. */
function extractBrandName(
  source: HtmlSource,
  document: ReturnType<typeof parseHtml>,
  record: Readonly<Record<string, unknown>> | undefined,
  prefix: string | undefined,
) {
  const jsonName = sanitiseSourceText(jsonString(record ?? {}, "name") ?? "");
  if (jsonName && prefix) {
    return resolveCriticalFact([
      textCandidate(jsonName, websiteRef(source, `${prefix}.name`)),
    ]);
  }
  for (const [attribute, field] of [
    ["property", "og:site_name"],
    ["name", "application-name"],
  ] as const) {
    const values = metadataValues(document, attribute, field);
    if (values.length > 0) {
      return resolveCriticalFact(
        values.map((value) =>
          textCandidate(
            value,
            websiteRef(source, `meta.${field.replaceAll(/[_:]/gu, "-")}`),
          ),
        ),
      );
    }
  }
  return { state: "unknown" as const };
}

/** Extracts a logo URL only from observed JSON-LD or logo-labelled images. */
function extractLogo(
  source: HtmlSource,
  document: ReturnType<typeof parseHtml>,
  record: Readonly<Record<string, unknown>> | undefined,
  prefix: string | undefined,
) {
  const jsonLogo = record
    ? jsonUrlValues(record, "logo")
        .map((value) => resolveObservedUrl(value, source.finalUrl))
        .find(Boolean)
    : undefined;
  if (jsonLogo && prefix) {
    return resolveCriticalFact([
      candidate(jsonLogo, websiteRef(source, `${prefix}.logo`), jsonLogo),
    ]);
  }

  const candidates: FactCandidate<string>[] = [];
  walkElements(document, (element) => {
    if (elementName(element) !== "img") {
      return;
    }
    const label = [
      elementAttribute(element, "alt"),
      elementAttribute(element, "class"),
      elementAttribute(element, "id"),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    const url = resolveObservedUrl(
      elementAttribute(element, "src"),
      source.finalUrl,
    );
    if (url && /\b(?:brand|logo|wordmark)\b/u.test(label)) {
      candidates.push(
        candidate(url, websiteRef(source, "dom.logo-image"), url),
      );
    }
  });
  return resolveCriticalFact(candidates);
}

/** Returns lower-cased relationship tokens. */
function relTokens(value: string | undefined): Set<string> {
  return new Set((value ?? "").toLowerCase().split(/\s+/u).filter(Boolean));
}

/** Returns one website evidence reference. */
function websiteRef(source: HtmlSource, field: string): EvidenceRef {
  return { source: "website", url: source.finalUrl, field };
}

/** Creates one normalised text candidate. */
function textCandidate(
  value: string,
  evidence: EvidenceRef,
): FactCandidate<string> {
  const normalised = sanitiseSourceText(value);
  return candidate(normalised, evidence, normalised.toLocaleLowerCase("en"));
}

/** Creates one typed fact candidate. */
function candidate<T>(
  value: T,
  evidence: EvidenceRef,
  key: string,
): FactCandidate<T> {
  return { value, evidence: [evidence], key };
}
