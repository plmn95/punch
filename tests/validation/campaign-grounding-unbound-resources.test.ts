import { describe, expect, it } from "vitest";

import { CampaignDraftPayloadSchema } from "../../src/core/schemas/index.js";
import { validateCampaignGrounding } from "../../src/validation/index.js";
import {
  createGroundedCampaign,
  createGroundingContext,
} from "../support/grounding-fixtures.js";

describe("unbound product resources", () => {
  it("rejects a product image and another product CTA in an unbound hero", () => {
    const context = createGroundingContext(2);
    const campaign = createGroundedCampaign(context);
    const first = context.products[0]!;
    const second = context.products[1]!;
    if (
      first.imageUrl.state !== "observed" ||
      second.canonicalUrl.state !== "observed"
    ) {
      throw new Error("The fixture requires observed product resources.");
    }
    const validation = validateCampaignGrounding(
      CampaignDraftPayloadSchema.parse({
        ...campaign,
        blocks: [
          {
            type: "hero-stacked",
            heading: "An invalid unbound hero",
            image: { url: first.imageUrl.value, alt: "Product one" },
            cta: { label: "View product", href: second.canonicalUrl.value },
          },
          ...campaign.blocks,
        ],
      }),
      context,
    );

    expect(validation.issues).toEqual(
      expect.arrayContaining([
        {
          code: "unbound-product-image",
          productId: "product-01",
          blockIndex: 0,
        },
        {
          code: "unbound-product-url",
          productId: "product-02",
          blockIndex: 0,
        },
      ]),
    );
  });

  it("rejects product resources in unbound headers and campaign CTAs", () => {
    const context = createGroundingContext(1);
    const campaign = createGroundedCampaign(context);
    const product = context.products[0]!;
    if (product.imageUrl.state !== "observed") {
      throw new Error("The fixture requires an observed product image.");
    }
    const validation = validateCampaignGrounding(
      CampaignDraftPayloadSchema.parse({
        ...campaign,
        blocks: [
          {
            type: "header-standard",
            brandName: "Grounding Garden",
            homeUrl: product.suppliedUrl,
            logo: { url: product.imageUrl.value, alt: "Invalid product logo" },
          },
          ...campaign.blocks,
          {
            type: "cta-block",
            actions: [
              { label: "Invalid product action", href: product.suppliedUrl },
            ],
          },
        ],
      }),
      context,
    );

    expect(validation.issues).toEqual(
      expect.arrayContaining([
        {
          code: "unbound-product-url",
          productId: "product-01",
          blockIndex: 0,
        },
        {
          code: "unbound-product-image",
          productId: "product-01",
          blockIndex: 0,
        },
        {
          code: "unbound-product-url",
          productId: "product-01",
          blockIndex: 2,
        },
      ]),
    );
  });

  it("rejects product links rendered from unbound body Markdown", () => {
    const context = createGroundingContext(2);
    const campaign = createGroundedCampaign(context);
    const first = context.products[0]!;
    const second = context.products[1]!;
    if (first.canonicalUrl.state !== "observed") {
      throw new Error("The fixture requires an observed canonical URL.");
    }
    const validation = validateCampaignGrounding(
      CampaignDraftPayloadSchema.parse({
        ...campaign,
        blocks: [
          {
            type: "body-paragraph",
            markdown:
              `[First](${first.canonicalUrl.value}) and ` +
              `[second](${second.suppliedUrl})`,
          },
          ...campaign.blocks,
        ],
      }),
      context,
    );

    expect(validation.issues).toEqual(
      expect.arrayContaining([
        {
          code: "unbound-product-url",
          productId: "product-01",
          blockIndex: 0,
        },
        {
          code: "unbound-product-url",
          productId: "product-02",
          blockIndex: 0,
        },
      ]),
    );
  });

  it("rejects known product resources used in the opposite slot role", () => {
    const context = createGroundingContext(2);
    const campaign = createGroundedCampaign(context);
    const first = context.products[0]!;
    const second = context.products[1]!;
    if (
      first.imageUrl.state !== "observed" ||
      second.canonicalUrl.state !== "observed"
    ) {
      throw new Error("The fixture requires observed product resources.");
    }
    const validation = validateCampaignGrounding(
      CampaignDraftPayloadSchema.parse({
        ...campaign,
        blocks: [
          {
            type: "hero-stacked",
            heading: "Cross-role resource misuse",
            image: { url: second.canonicalUrl.value, alt: "Wrong role" },
            cta: { label: "Wrong role", href: first.imageUrl.value },
          },
          ...campaign.blocks,
        ],
      }),
      context,
    );

    expect(validation.issues).toEqual(
      expect.arrayContaining([
        {
          code: "unbound-product-url",
          productId: "product-01",
          blockIndex: 0,
        },
        {
          code: "unbound-product-image",
          productId: "product-02",
          blockIndex: 0,
        },
      ]),
    );
  });

  it("permits unrelated brand resources in unbound campaign blocks", () => {
    const context = createGroundingContext(1);
    const campaign = CampaignDraftPayloadSchema.parse({
      ...createGroundedCampaign(context),
      blocks: [
        {
          type: "hero-stacked",
          heading: "A brand-level introduction",
          image: {
            url: "https://grounding-garden.example.com/images/brand.jpg",
            alt: "Grounding Garden",
          },
          cta: {
            label: "Visit the brand",
            href: "https://grounding-garden.example.com/about",
          },
        },
        ...createGroundedCampaign(context).blocks,
      ],
    });

    expect(validateCampaignGrounding(campaign, context)).toEqual({
      valid: true,
      issues: [],
    });
  });
});
