import {
  ProductEvidenceSchema,
  type EvidenceRef,
} from "../core/schemas/index.js";
import type {
  DeterministicProductExtraction,
  ProductSource,
} from "./contracts.js";
import { type FactCandidate, resolveCriticalFact } from "./fact-candidates.js";
import {
  elementTextValues,
  metadataValues,
  parseHtml,
  resolveObservedUrl,
} from "./html-document.js";
import {
  jsonString,
  jsonUrlValues,
  selectJsonRecord,
  type JsonRecord,
} from "./structured-data.js";
import {
  extractProductAvailability,
  extractProductPrice,
  productEvidenceRef,
  productFactCandidate,
} from "./product-commerce.js";
import { sanitiseSourceText } from "./text-normalisation.js";

/** Deterministically extracts one product without combining JSON-LD nodes. */
export function extractProduct(
  source: ProductSource,
): DeterministicProductExtraction {
  const document = parseHtml(source.html);
  const selected = selectJsonRecord(
    document,
    ["Product"],
    source.finalUrl,
    "exact-url",
  );
  const prefix = selected
    ? `jsonld.product-${String(selected.index + 1).padStart(2, "0")}`
    : undefined;
  const evidence = ProductEvidenceSchema.parse({
    productId: source.productId,
    suppliedUrl: source.suppliedUrl,
    canonicalUrl: resolveCriticalFact([
      productFactCandidate(
        source.finalUrl,
        productEvidenceRef(source, "response.final-url"),
        source.finalUrl,
      ),
    ]),
    name: extractName(source, document, selected?.record, prefix),
    price: extractProductPrice(source, document, selected?.record, prefix),
    availability: extractProductAvailability(
      source,
      document,
      selected?.record,
      prefix,
    ),
    imageUrl: extractImage(source, document, selected?.record, prefix),
    description: extractDescription(source, document, selected?.record, prefix),
  });

  return { evidence };
}

/** Extracts a name from one selected source group. */
function extractName(
  source: ProductSource,
  document: ReturnType<typeof parseHtml>,
  record: JsonRecord | undefined,
  prefix: string | undefined,
) {
  const jsonName = sanitiseSourceText(jsonString(record ?? {}, "name") ?? "");
  if (jsonName && prefix) {
    return resolveCriticalFact([
      textCandidate(jsonName, productEvidenceRef(source, `${prefix}.name`)),
    ]);
  }
  const meta = metadataValues(document, "property", "og:title");
  if (meta.length > 0) {
    return resolveCriticalFact(
      meta.map((value) =>
        textCandidate(value, productEvidenceRef(source, "meta.og-title")),
      ),
    );
  }
  return resolveCriticalFact(
    elementTextValues(document, "h1").map((value) =>
      textCandidate(value, productEvidenceRef(source, "dom.h1")),
    ),
  );
}

/** Selects one exact observed product image URL in source order. */
function extractImage(
  source: ProductSource,
  document: ReturnType<typeof parseHtml>,
  record: JsonRecord | undefined,
  prefix: string | undefined,
) {
  const jsonImage = record
    ? jsonUrlValues(record, "image")
        .map((value) => resolveObservedUrl(value, source.finalUrl))
        .find(Boolean)
    : undefined;
  if (jsonImage && prefix) {
    return resolveCriticalFact([
      productFactCandidate(
        jsonImage,
        productEvidenceRef(source, `${prefix}.image`),
        jsonImage,
      ),
    ]);
  }
  const image = metadataValues(document, "property", "og:image")
    .map((value) => resolveObservedUrl(value, source.finalUrl))
    .find(Boolean);
  return resolveCriticalFact(
    image
      ? [
          productFactCandidate(
            image,
            productEvidenceRef(source, "meta.og-image"),
            image,
          ),
        ]
      : [],
  );
}

/** Extracts an exact description while preserving unknowns. */
function extractDescription(
  source: ProductSource,
  document: ReturnType<typeof parseHtml>,
  record: JsonRecord | undefined,
  prefix: string | undefined,
) {
  const jsonDescription = sanitiseSourceText(
    jsonString(record ?? {}, "description") ?? "",
  );
  if (jsonDescription && prefix) {
    return resolveCriticalFact([
      textCandidate(
        jsonDescription,
        productEvidenceRef(source, `${prefix}.description`),
      ),
    ]);
  }
  const description = [
    ...metadataValues(document, "property", "og:description"),
    ...metadataValues(document, "name", "description"),
  ];
  return resolveCriticalFact(
    description.map((value) =>
      textCandidate(value, productEvidenceRef(source, "meta.description")),
    ),
  );
}

/** Creates one stable semantic-text candidate. */
function textCandidate(
  value: string,
  evidence: EvidenceRef,
): FactCandidate<string> {
  const normalised = sanitiseSourceText(value);
  return productFactCandidate(
    normalised,
    evidence,
    normalised.toLocaleLowerCase("en"),
  );
}
