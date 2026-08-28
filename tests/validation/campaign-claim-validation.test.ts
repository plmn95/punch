import { describe, expect, it } from "vitest";

import {
  CampaignDraftPayloadSchema,
  GenerationContextSchema,
  type CampaignDraftPayload,
  type GenerationContext,
} from "../../src/core/schemas/index.js";
import { validateCampaignClaims } from "../../src/validation/index.js";
import {
  createGroundedCampaign,
  createGroundingContext,
} from "../support/grounding-fixtures.js";

/** Replaces campaign-level copy through the canonical payload schema. */
function withSubject(
  campaign: CampaignDraftPayload,
  subject: string,
): CampaignDraftPayload {
  return CampaignDraftPayloadSchema.parse({ ...campaign, subject });
}

/** Replaces the first product description in context and campaign together. */
function withObservedDescription(
  context: GenerationContext,
  description: string,
): Readonly<{ context: GenerationContext; campaign: CampaignDraftPayload }> {
  const product = context.products[0]!;
  const evidence = product.description;
  if (evidence.state !== "observed") {
    throw new Error("The fictional claim fixture must begin observed.");
  }
  const nextContext = GenerationContextSchema.parse({
    ...context,
    products: context.products.map((entry, index) =>
      index === 0
        ? {
            ...entry,
            description: { ...evidence, value: description },
          }
        : entry,
    ),
  });
  return {
    context: nextContext,
    campaign: createGroundedCampaign(nextContext),
  };
}

describe("source-aware campaign claims", () => {
  it("allows exact product-scoped availability and rejects a mismatch", () => {
    const context = createGroundingContext(1);
    const campaign = createGroundedCampaign(context);
    const available = CampaignDraftPayloadSchema.parse({
      ...campaign,
      blocks: campaign.blocks.map((block) =>
        block.type === "product-feature"
          ? { ...block, eyebrow: "Available now" }
          : block,
      ),
    });
    const soldOut = CampaignDraftPayloadSchema.parse({
      ...campaign,
      blocks: campaign.blocks.map((block) =>
        block.type === "product-feature"
          ? { ...block, eyebrow: "Sold out" }
          : block,
      ),
    });

    expect(validateCampaignClaims(available, context)).toEqual({
      valid: true,
      issues: [],
    });
    expect(validateCampaignClaims(soldOut, context).issues).toContainEqual({
      code: "availability-claim-mismatch",
      field: "block",
      productId: "product-01",
      blockIndex: 0,
    });
  });

  it("rejects availability when its evidence is unknown", () => {
    const context = createGroundingContext(1);
    const unknown = GenerationContextSchema.parse({
      ...context,
      products: context.products.map((product) => ({
        ...product,
        availability: { state: "unknown" },
      })),
    });
    const campaign = withSubject(
      createGroundedCampaign(unknown),
      "Available now",
    );

    expect(validateCampaignClaims(campaign, unknown).issues[0]).toEqual({
      code: "unsupported-availability-claim",
      field: "subject",
    });
  });

  it("requires a campaign-level availability claim to fit every product", () => {
    const context = createGroundingContext(2);
    const campaign = withSubject(
      createGroundedCampaign(context),
      "Available now",
    );

    expect(validateCampaignClaims(campaign, context).issues).toContainEqual({
      code: "availability-claim-mismatch",
      field: "subject",
    });
  });

  it("rejects invented promotions and accepts the structured offer", () => {
    const sales = createGroundingContext(1);
    const promotion = GenerationContextSchema.parse({
      ...sales,
      goal: "promotion",
      offer: { description: "Save 15% on one fictional vessel." },
    });

    expect(
      validateCampaignClaims(
        withSubject(createGroundedCampaign(sales), "Save 15% today"),
        sales,
      ).issues[0]?.code,
    ).toBe("promotion-claim-without-offer");
    expect(
      validateCampaignClaims(
        withSubject(createGroundedCampaign(promotion), "Save 15% today"),
        promotion,
      ).valid,
    ).toBe(true);
    expect(
      validateCampaignClaims(
        withSubject(createGroundedCampaign(promotion), "Save 90% today"),
        promotion,
      ).issues[0]?.code,
    ).toBe("unsupported-promotion-claim");
  });

  it("requires observed product copy for selected high-risk claims", () => {
    const context = createGroundingContext(1);
    const unsupported = withSubject(
      createGroundedCampaign(context),
      "Free shipping on our fictional vessel",
    );
    const supported = withObservedDescription(
      context,
      "A fictional vessel with free shipping.",
    );

    expect(validateCampaignClaims(unsupported, context).issues[0]?.code).toBe(
      "unsupported-product-claim",
    );
    expect(
      validateCampaignClaims(
        withSubject(
          supported.campaign,
          "Free shipping on our fictional vessel",
        ),
        supported.context,
      ).valid,
    ).toBe(true);
  });

  it("never includes claim or evidence text in issue objects", () => {
    const context = createGroundingContext(1);
    const validation = validateCampaignClaims(
      withSubject(createGroundedCampaign(context), "Lifetime warranty"),
      context,
    );

    expect(Object.keys(validation.issues[0]!).sort()).toEqual([
      "code",
      "field",
    ]);
    expect(JSON.stringify(validation.issues)).not.toContain("warranty");
  });
});
