import type {
  Availability,
  CampaignDraftPayload,
  GenerationContext,
  ProductId,
} from "../core/schemas/index.js";

export const CAMPAIGN_CLAIM_ISSUE_CODES = [
  "unsupported-availability-claim",
  "availability-claim-mismatch",
  "promotion-claim-without-offer",
  "unsupported-promotion-claim",
  "unsupported-product-claim",
] as const;

export type CampaignClaimIssueCode =
  (typeof CAMPAIGN_CLAIM_ISSUE_CODES)[number];

export type CampaignClaimIssue = Readonly<{
  code: CampaignClaimIssueCode;
  field: "subject" | "preheader" | "block";
  productId?: ProductId;
  blockIndex?: number;
}>;

export type CampaignClaimValidation = Readonly<{
  valid: boolean;
  issues: readonly CampaignClaimIssue[];
}>;

type ClaimLocation = Readonly<{
  text: string;
  field: CampaignClaimIssue["field"];
  productId?: ProductId;
  blockIndex?: number;
}>;

const AVAILABILITY_RULES: ReadonlyArray<
  Readonly<{ pattern: RegExp; value: Availability }>
> = [
  {
    pattern: /\b(?:in stock|available now|now available|ready to ship)\b/iu,
    value: "in-stock",
  },
  {
    pattern: /\b(?:out of stock|sold out|unavailable)\b/iu,
    value: "out-of-stock",
  },
  { pattern: /\bpre[ -]?order(?:ed|s|ing)?\b/iu, value: "preorder" },
  { pattern: /\bback[ -]?order(?:ed|s|ing)?\b/iu, value: "backorder" },
  { pattern: /\bdiscontinued\b/iu, value: "discontinued" },
];

const PRODUCT_CLAIM_PATTERNS = [
  /\bfree shipping\b/iu,
  /\b(?:lifetime|limited) warranty\b/iu,
  /\bmoney[ -]?back guarantee\b/iu,
  /\b(?:best[ -]?seller|award[ -]?winning)\b/iu,
  /\b(?:organic|sustainable|eco[ -]?friendly|handmade)\b/iu,
  /\b(?:clinically|scientifically) proven\b/iu,
] as const;

const PROMOTION_PATTERNS = [
  /\b\d+(?:\.\d+)?%\s+off\b/giu,
  /\bsave\s+\d+(?:\.\d+)?%(?=\s|$|[.,!?:;])/giu,
  /\b(?:limited[ -]?time offer|today only|sale ends?|offer ends?)\b/giu,
] as const;

/** Validates source-aware claims across generated campaign prose. */
export function validateCampaignClaims(
  campaign: Pick<CampaignDraftPayload, "subject" | "preheader" | "blocks">,
  context: GenerationContext,
): CampaignClaimValidation {
  const locations = claimLocations(campaign);
  const issues = locations.flatMap((location) => [
    ...availabilityIssues(location, context),
    ...promotionIssues(location, context),
    ...productClaimIssues(location, context),
  ]);
  return { valid: issues.length === 0, issues: uniqueIssues(issues) };
}

/** Fails safely if a selected campaign retains any unsupported prose claim. */
export function assertCampaignClaims(
  campaign: Pick<CampaignDraftPayload, "subject" | "preheader" | "blocks">,
  context: GenerationContext,
): CampaignClaimValidation {
  const validation = validateCampaignClaims(campaign, context);
  if (!validation.valid) {
    throw new Error("Campaign failed deterministic source-aware claim checks");
  }
  return validation;
}

/** Collects campaign- and product-scoped semantic text without URLs. */
function claimLocations(
  campaign: Pick<CampaignDraftPayload, "subject" | "preheader" | "blocks">,
): ClaimLocation[] {
  return [
    { text: campaign.subject, field: "subject" },
    { text: campaign.preheader, field: "preheader" },
    ...campaign.blocks.flatMap((block, blockIndex) => {
      if (block.type === "product-feature") {
        return productLocations(block, blockIndex);
      }
      if (block.type === "product-grid") {
        return block.items.flatMap((item) =>
          productLocations(item, blockIndex),
        );
      }
      return blockText(block).map((text) => ({
        text,
        field: "block" as const,
        blockIndex,
      }));
    }),
  ];
}

/** Collects text tied to one explicit product identity. */
function productLocations(
  product: Readonly<{
    productId: ProductId;
    name: string;
    description?: string | undefined;
    image?: Readonly<{ alt: string }> | undefined;
    cta: Readonly<{ label: string }>;
    eyebrow?: string | undefined;
  }>,
  blockIndex: number,
): ClaimLocation[] {
  const values = [
    product.eyebrow,
    product.name,
    product.description,
    product.image?.alt,
    product.cta.label,
  ].filter((value): value is string => value !== undefined);
  return values.map((text) => ({
    text,
    field: "block",
    productId: product.productId,
    blockIndex,
  }));
}

/** Collects text from identity-free blocks only. */
function blockText(block: CampaignDraftPayload["blocks"][number]): string[] {
  switch (block.type) {
    case "header-standard":
      return [block.brandName, block.logo?.alt].filter(isText);
    case "hero-stacked":
      return [
        block.eyebrow,
        block.heading,
        block.body,
        block.image?.alt,
        block.cta?.label,
      ].filter(isText);
    case "heading":
      return [block.text];
    case "body-paragraph":
      return [block.markdown];
    case "discount-code":
      return [block.heading, block.description, block.code].filter(isText);
    case "cta-block":
      return [
        block.heading,
        block.body,
        ...block.actions.map((action) => action.label),
      ].filter(isText);
    default:
      return [];
  }
}

/** Checks availability language against the exact applicable product evidence. */
function availabilityIssues(
  location: ClaimLocation,
  context: GenerationContext,
): CampaignClaimIssue[] {
  return AVAILABILITY_RULES.flatMap((rule) => {
    if (!rule.pattern.test(location.text)) {
      return [];
    }
    const products = location.productId
      ? context.products.filter(
          (product) => product.productId === location.productId,
        )
      : context.products;
    const unsupported = products.some(
      (product) => product.availability.state !== "observed",
    );
    const mismatched = products.some(
      (product) =>
        product.availability.state === "observed" &&
        product.availability.value !== rule.value,
    );
    const code = unsupported
      ? "unsupported-availability-claim"
      : mismatched
        ? "availability-claim-mismatch"
        : undefined;
    return code ? [locatedIssue(location, code)] : [];
  });
}

/** Rejects promotion language unless the structured offer supports it. */
function promotionIssues(
  location: ClaimLocation,
  context: GenerationContext,
): CampaignClaimIssue[] {
  const claims = PROMOTION_PATTERNS.flatMap(
    (pattern) => location.text.match(pattern) ?? [],
  );
  if (claims.length === 0) {
    return [];
  }
  if (context.goal !== "promotion") {
    return [locatedIssue(location, "promotion-claim-without-offer")];
  }
  const support = normalise(
    `${context.offer.description} ${context.offer.code ?? ""} ${context.offer.endsAt ?? ""}`,
  );
  return claims.some((claim) => !support.includes(normalise(claim)))
    ? [locatedIssue(location, "unsupported-promotion-claim")]
    : [];
}

/** Rejects selected high-risk commerce claims without observed product copy. */
function productClaimIssues(
  location: ClaimLocation,
  context: GenerationContext,
): CampaignClaimIssue[] {
  const claims = PRODUCT_CLAIM_PATTERNS.flatMap(
    (pattern) => location.text.match(pattern) ?? [],
  );
  if (claims.length === 0) {
    return [];
  }
  const products = location.productId
    ? context.products.filter(
        (product) => product.productId === location.productId,
      )
    : context.products;
  const unsupported = claims.some((claim) =>
    products.some((product) =>
      product.description.state !== "observed"
        ? true
        : !normalise(product.description.value).includes(normalise(claim)),
    ),
  );
  return unsupported
    ? [locatedIssue(location, "unsupported-product-claim")]
    : [];
}

/** Creates one value-free claim issue at its semantic location. */
function locatedIssue(
  location: ClaimLocation,
  code: CampaignClaimIssueCode,
): CampaignClaimIssue {
  return {
    code,
    field: location.field,
    ...(location.productId ? { productId: location.productId } : {}),
    ...(location.blockIndex === undefined
      ? {}
      : { blockIndex: location.blockIndex }),
  };
}

/** Removes duplicate issue locations produced by overlapping phrase rules. */
function uniqueIssues(
  issues: readonly CampaignClaimIssue[],
): CampaignClaimIssue[] {
  return [
    ...new Map(issues.map((issue) => [JSON.stringify(issue), issue])).values(),
  ];
}

/** Normalises a bounded claim fragment for exact evidence comparison. */
function normalise(value: string): string {
  return value.toLocaleLowerCase("en").replace(/\s+/gu, " ").trim();
}

/** Narrows optional block text. */
function isText(value: string | undefined): value is string {
  return value !== undefined;
}
