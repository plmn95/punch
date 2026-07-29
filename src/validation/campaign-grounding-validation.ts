import type {
  CampaignDraftPayload,
  EvidenceRef,
  GenerationContext,
  Money,
  ProductEvidence,
  ProductId,
  ProductPresentation,
} from "../core/schemas/index.js";
import { unboundProductResourceIssues } from "./unbound-product-resources.js";

export const CAMPAIGN_GROUNDING_ISSUE_CODES = [
  "product-evidence-reference-mismatch",
  "missing-product-id",
  "unknown-product-id",
  "product-name-unavailable",
  "product-name-mismatch",
  "product-price-unavailable",
  "product-price-mismatch",
  "product-description-unavailable",
  "product-description-mismatch",
  "product-image-unavailable",
  "product-image-mismatch",
  "product-cta-url-unavailable",
  "product-cta-url-mismatch",
  "unbound-product-image",
  "unbound-product-url",
] as const;

export type CampaignGroundingIssueCode =
  (typeof CAMPAIGN_GROUNDING_ISSUE_CODES)[number];

export type CampaignGroundingIssue = Readonly<{
  code: CampaignGroundingIssueCode;
  productId: ProductId;
  blockIndex?: number;
  itemIndex?: number;
}>;

export type CampaignGroundingValidation = Readonly<{
  valid: boolean;
  issues: readonly CampaignGroundingIssue[];
}>;

type LocatedProduct = Readonly<{
  presentation: ProductPresentation;
  blockIndex: number;
  itemIndex?: number;
}>;

type EvidenceBearingFact =
  | Readonly<{ state: "unknown" }>
  | Readonly<{
      state: "observed" | "inferred";
      evidence: readonly EvidenceRef[];
    }>
  | Readonly<{
      state: "conflicted";
      candidates: ReadonlyArray<{
        readonly evidence: readonly EvidenceRef[];
      }>;
    }>;

/** Returns every source reference attached to one evidence fact. */
function factEvidenceRefs(fact: EvidenceBearingFact): EvidenceRef[] {
  if (fact.state === "unknown") {
    return [];
  }
  return fact.state === "conflicted"
    ? fact.candidates.flatMap((candidate) => candidate.evidence)
    : [...fact.evidence];
}

/** Returns only canonical source URLs observed for one product. */
function productEvidenceUrls(product: ProductEvidence): Set<string> {
  const urls = new Set<string>();
  if (product.canonicalUrl.state === "observed") {
    urls.add(product.canonicalUrl.value);
  }
  if (product.canonicalUrl.state === "conflicted") {
    for (const candidate of product.canonicalUrl.candidates) {
      urls.add(candidate.value);
    }
  }
  return urls;
}

/** Returns all product-field references in deterministic field order. */
function productEvidenceRefs(product: ProductEvidence): EvidenceRef[] {
  return [
    product.canonicalUrl,
    product.name,
    product.price,
    product.availability,
    product.imageUrl,
    product.description,
  ].flatMap(factEvidenceRefs);
}

/** Checks that product evidence cannot point at another product container. */
export function validateProductEvidenceReferences(
  context: GenerationContext,
): CampaignGroundingValidation {
  const issues = context.products.flatMap((product) => {
    const allowedUrls = productEvidenceUrls(product);
    const mismatched = productEvidenceRefs(product).some(
      (reference) =>
        reference.source !== "product" ||
        reference.productId !== product.productId ||
        !allowedUrls.has(reference.url),
    );
    return mismatched
      ? [
          {
            code: "product-evidence-reference-mismatch" as const,
            productId: product.productId,
          },
        ]
      : [];
  });
  return { valid: issues.length === 0, issues };
}

/** Collects every product presentation with its semantic location. */
function collectLocatedProducts(
  campaign: Pick<CampaignDraftPayload, "blocks">,
): LocatedProduct[] {
  const locations: LocatedProduct[] = [];
  campaign.blocks.forEach((block, blockIndex) => {
    if (block.type === "product-feature") {
      locations.push({ presentation: block, blockIndex });
    }
    if (block.type === "product-grid") {
      block.items.forEach((presentation, itemIndex) => {
        locations.push({ presentation, blockIndex, itemIndex });
      });
    }
  });
  return locations;
}

/** Creates one safe issue without copying generated or evidence values. */
function locatedIssue(
  location: LocatedProduct,
  code: CampaignGroundingIssueCode,
): CampaignGroundingIssue {
  return {
    code,
    productId: location.presentation.productId,
    blockIndex: location.blockIndex,
    ...(location.itemIndex === undefined
      ? {}
      : { itemIndex: location.itemIndex }),
  };
}

/** Checks an optional price without permitting an invented display value. */
function priceMatches(actual: Money, expected: Money): boolean {
  return (
    actual.amount === expected.amount &&
    actual.currency === expected.currency &&
    (actual.display === undefined || actual.display === expected.display)
  );
}

/** Validates one known product presentation against its exact evidence. */
function presentationIssues(
  location: LocatedProduct,
  evidence: ProductEvidence,
): CampaignGroundingIssue[] {
  const product = location.presentation;
  const issues: CampaignGroundingIssue[] = [];

  if (evidence.name.state !== "observed") {
    issues.push(locatedIssue(location, "product-name-unavailable"));
  } else if (product.name !== evidence.name.value) {
    issues.push(locatedIssue(location, "product-name-mismatch"));
  }
  if (product.price !== undefined) {
    if (evidence.price.state !== "observed") {
      issues.push(locatedIssue(location, "product-price-unavailable"));
    } else if (!priceMatches(product.price, evidence.price.value)) {
      issues.push(locatedIssue(location, "product-price-mismatch"));
    }
  }
  if (product.description !== undefined) {
    if (
      evidence.description.state !== "observed" &&
      evidence.description.state !== "inferred"
    ) {
      issues.push(locatedIssue(location, "product-description-unavailable"));
    } else if (product.description !== evidence.description.value) {
      issues.push(locatedIssue(location, "product-description-mismatch"));
    }
  }
  if (product.image !== undefined) {
    if (evidence.imageUrl.state !== "observed") {
      issues.push(locatedIssue(location, "product-image-unavailable"));
    } else if (product.image.url !== evidence.imageUrl.value) {
      issues.push(locatedIssue(location, "product-image-mismatch"));
    }
  }
  if (evidence.canonicalUrl.state !== "observed") {
    issues.push(locatedIssue(location, "product-cta-url-unavailable"));
  } else if (product.cta.href !== evidence.canonicalUrl.value) {
    issues.push(locatedIssue(location, "product-cta-url-mismatch"));
  }
  return issues;
}

/** Validates coverage and every exact product-bearing campaign fact. */
export function validateCampaignGrounding(
  campaign: Pick<CampaignDraftPayload, "blocks">,
  context: GenerationContext,
): CampaignGroundingValidation {
  const locations = collectLocatedProducts(campaign);
  const evidenceById = new Map(
    context.products.map((product) => [product.productId, product]),
  );
  const presentedIds = new Set(
    locations.map((location) => location.presentation.productId),
  );
  const issues: CampaignGroundingIssue[] = [
    ...validateProductEvidenceReferences(context).issues,
    ...unboundProductResourceIssues(campaign, context),
  ];

  for (const product of context.products) {
    if (!presentedIds.has(product.productId)) {
      issues.push({
        code: "missing-product-id",
        productId: product.productId,
      });
    }
  }
  for (const location of locations) {
    const evidence = evidenceById.get(location.presentation.productId);
    if (evidence === undefined) {
      issues.push(locatedIssue(location, "unknown-product-id"));
    } else {
      issues.push(...presentationIssues(location, evidence));
    }
  }
  return { valid: issues.length === 0, issues };
}

/** Fails safely if a selected final campaign is not exactly grounded. */
export function assertCampaignGrounding(
  campaign: Pick<CampaignDraftPayload, "blocks">,
  context: GenerationContext,
): CampaignGroundingValidation {
  const validation = validateCampaignGrounding(campaign, context);
  if (!validation.valid) {
    throw new Error("Campaign failed deterministic product grounding");
  }
  return validation;
}
