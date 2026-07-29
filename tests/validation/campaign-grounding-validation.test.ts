import { describe, expect, it } from "vitest";

import {
  CampaignDraftPayloadSchema,
  type CampaignDraftPayload,
  type ProductId,
  type ProductPresentation,
} from "../../src/core/schemas/index.js";
import {
  validateCampaignGrounding,
  type CampaignGroundingIssueCode,
} from "../../src/validation/index.js";
import {
  createGroundedCampaign,
  createGroundedPresentation,
  createGroundingContext,
  mapCampaignPresentation,
} from "../support/grounding-fixtures.js";

/** Returns safe issue codes in deterministic result order. */
function issueCodes(
  campaign: CampaignDraftPayload,
  productCount: number,
): CampaignGroundingIssueCode[] {
  return validateCampaignGrounding(
    campaign,
    createGroundingContext(productCount),
  ).issues.map((issue) => issue.code);
}

/** Removes one product from a multi-product grid. */
function omitProduct(
  campaign: CampaignDraftPayload,
  productId: ProductId,
): CampaignDraftPayload {
  return CampaignDraftPayloadSchema.parse({
    ...campaign,
    blocks: campaign.blocks
      .filter(
        (block) =>
          block.type !== "product-feature" || block.productId !== productId,
      )
      .map((block) =>
        block.type === "product-grid"
          ? {
              ...block,
              items: block.items.filter(
                (product) => product.productId !== productId,
              ),
            }
          : block,
      ),
  });
}

describe("deterministic campaign grounding", () => {
  it.each([1, 6])("accepts an exact %s-product campaign", (productCount) => {
    const context = createGroundingContext(productCount);
    const validation = validateCampaignGrounding(
      createGroundedCampaign(context),
      context,
    );

    expect(validation).toEqual({ valid: true, issues: [] });
  });

  it("allows whole-product reordering and exact cross-block repetition", () => {
    const context = createGroundingContext(6);
    const campaign = createGroundedCampaign(context);
    const grid = campaign.blocks.find((block) => block.type === "product-grid");
    if (grid === undefined) {
      throw new Error("The six-product fixture must contain a product grid.");
    }
    const repeated = CampaignDraftPayloadSchema.parse({
      ...campaign,
      blocks: [
        {
          type: "product-feature",
          ...createGroundedPresentation(context.products[0]!),
        },
        {
          ...grid,
          items: [
            ...[...grid.items].reverse(),
            createGroundedPresentation(context.products[0]!),
          ],
        },
      ],
    });

    expect(validateCampaignGrounding(repeated, context)).toEqual({
      valid: true,
      issues: [],
    });
  });

  it.each([
    "product-01",
    "product-02",
    "product-03",
    "product-04",
    "product-05",
    "product-06",
  ] as const)("rejects omission of required %s", (productId) => {
    const context = createGroundingContext(6);
    const campaign = omitProduct(createGroundedCampaign(context), productId);
    const validation = validateCampaignGrounding(campaign, context);

    expect(validation.valid).toBe(false);
    expect(validation.issues).toContainEqual({
      code: "missing-product-id",
      productId,
    });
  });

  it("rejects a canonical ID that is absent from a one-product context", () => {
    const context = createGroundingContext(1);
    const campaign = mapCampaignPresentation(
      createGroundedCampaign(context),
      "product-01",
      (product) => ({ ...product, productId: "product-02" }),
    );
    const validation = validateCampaignGrounding(campaign, context);

    expect(validation.issues.map((issue) => issue.code)).toEqual([
      "missing-product-id",
      "unknown-product-id",
    ]);
  });

  it("rejects one corrupted occurrence even when another is exact", () => {
    const context = createGroundingContext(1);
    const product = createGroundedPresentation(context.products[0]!);
    const campaign = CampaignDraftPayloadSchema.parse({
      ...createGroundedCampaign(context),
      blocks: [
        { type: "product-feature", ...product },
        { type: "product-feature", ...product, name: "Wrong repeated name" },
      ],
    });
    const validation = validateCampaignGrounding(campaign, context);

    expect(validation.issues).toContainEqual({
      code: "product-name-mismatch",
      productId: "product-01",
      blockIndex: 1,
    });
  });

  const swappedFieldCases: ReadonlyArray<{
    name: string;
    code: CampaignGroundingIssueCode;
    mutate: (
      product: ProductPresentation,
      other: ProductPresentation,
    ) => ProductPresentation;
  }> = [
    {
      name: "name",
      code: "product-name-mismatch",
      mutate: (product, other) => ({ ...product, name: other.name }),
    },
    {
      name: "price amount",
      code: "product-price-mismatch",
      mutate: (product, other) => ({
        ...product,
        price: { ...product.price!, amount: other.price!.amount },
      }),
    },
    {
      name: "price currency",
      code: "product-price-mismatch",
      mutate: (product, other) => ({
        ...product,
        price: { ...product.price!, currency: other.price!.currency },
      }),
    },
    {
      name: "price display",
      code: "product-price-mismatch",
      mutate: (product) => ({
        ...product,
        price: { ...product.price!, display: "Invented display" },
      }),
    },
    {
      name: "description",
      code: "product-description-mismatch",
      mutate: (product, other) => ({
        ...product,
        description: other.description,
      }),
    },
    {
      name: "image URL",
      code: "product-image-mismatch",
      mutate: (product, other) => ({
        ...product,
        image: { ...product.image!, url: other.image!.url },
      }),
    },
    {
      name: "CTA URL",
      code: "product-cta-url-mismatch",
      mutate: (product, other) => ({
        ...product,
        cta: { ...product.cta, href: other.cta.href },
      }),
    },
  ];

  it.each(swappedFieldCases)("rejects a cross-product $name swap", (test) => {
    const context = createGroundingContext(6);
    const campaign = createGroundedCampaign(context);
    const other = createGroundedPresentation(context.products[1]!);
    const swapped = mapCampaignPresentation(campaign, "product-01", (product) =>
      test.mutate(product, other),
    );

    expect(issueCodes(swapped, 6)).toContain(test.code);
  });

  it("requires the observed canonical URL rather than the supplied URL", () => {
    const context = createGroundingContext(1);
    const campaign = mapCampaignPresentation(
      createGroundedCampaign(context),
      "product-01",
      (product) => ({
        ...product,
        cta: { ...product.cta, href: context.products[0]!.suppliedUrl },
      }),
    );

    expect(issueCodes(campaign, 1)).toContain("product-cta-url-mismatch");
  });

  it("reports only safe codes, IDs, and semantic locations", () => {
    const context = createGroundingContext(1);
    const campaign = mapCampaignPresentation(
      createGroundedCampaign(context),
      "product-01",
      (product) => ({ ...product, name: "Sensitive wrong value" }),
    );
    const validation = validateCampaignGrounding(campaign, context);
    const serialisedIssues = JSON.stringify(validation.issues);

    expect(Object.keys(validation.issues[0]!).sort()).toEqual([
      "blockIndex",
      "code",
      "productId",
    ]);
    expect(serialisedIssues).not.toContain("Sensitive wrong value");
    expect(serialisedIssues).not.toContain("Grounding Vessel");
    expect(serialisedIssues).not.toContain("grounding-garden.example.com");
  });
});
