import { describe, expect, it } from "vitest";

import {
  BrandEvidenceSchema,
  GenerateCampaignInputSchema,
  GenerationContextSchema,
  ProductEvidenceSchema,
} from "../../src/core/schemas/index.js";
import {
  createGenerationContext,
  createProductEvidence,
} from "../factories.js";

/** Creates a minimal valid explicit input with the requested product count. */
function explicitInput(productCount: number) {
  return {
    website: "https://merchant.example.com",
    products: Array.from(
      { length: productCount },
      (_, index) => `https://merchant.example.com/products/item-${index + 1}`,
    ),
    goal: "sales",
  };
}

describe("explicit generation input", () => {
  it.each([1, 6])("accepts %s explicit product URLs", (productCount) => {
    const result = GenerateCampaignInputSchema.parse(
      explicitInput(productCount),
    );

    expect(result.products).toHaveLength(productCount);
    expect(result.website).toBe("https://merchant.example.com/");
  });

  it.each([0, 7])("rejects %s products", (productCount) => {
    expect(() =>
      GenerateCampaignInputSchema.parse(explicitInput(productCount)),
    ).toThrow();
  });

  it.each([
    "ftp://merchant.example.com/product",
    "file:///tmp/product",
    "https://user:password@merchant.example.com/product",
    "not a URL",
  ])("rejects an unsupported or credentialled URL: %s", (product) => {
    expect(() =>
      GenerateCampaignInputSchema.parse({
        ...explicitInput(1),
        products: [product],
      }),
    ).toThrow();
  });

  it("rejects duplicates after URL canonicalisation", () => {
    expect(() =>
      GenerateCampaignInputSchema.parse({
        ...explicitInput(2),
        products: [
          "https://merchant.example.com/products/item#first",
          "https://merchant.example.com/products/item#second",
        ],
      }),
    ).toThrow("unique after canonicalisation");
  });

  it("requires offers only for promotions", () => {
    expect(() =>
      GenerateCampaignInputSchema.parse({
        ...explicitInput(1),
        goal: "promotion",
      }),
    ).toThrow();
    expect(() =>
      GenerateCampaignInputSchema.parse({
        ...explicitInput(1),
        offer: { description: "Unexpected offer" },
      }),
    ).toThrow();
    expect(
      GenerateCampaignInputSchema.parse({
        ...explicitInput(1),
        goal: "promotion",
        offer: {
          description: "Save 10% on the selected product.",
          endsAt: "2027-02-14T23:59:00+02:00",
        },
      }).goal,
    ).toBe("promotion");
  });

  it("rejects invalid dates and overlong instructions", () => {
    expect(() =>
      GenerateCampaignInputSchema.parse({
        ...explicitInput(1),
        goal: "promotion",
        offer: {
          description: "A fictional offer.",
          endsAt: "14 February someday",
        },
      }),
    ).toThrow();
    expect(() =>
      GenerateCampaignInputSchema.parse({
        ...explicitInput(1),
        instructions: "x".repeat(4_001),
      }),
    ).toThrow();
  });

  it.each(["<!-- raw comment -->", "<!doctype html>", '<?xml version="1.0"?>'])(
    "rejects raw markup in semantic text: %s",
    (instructions) => {
      expect(() =>
        GenerateCampaignInputSchema.parse({
          ...explicitInput(1),
          instructions,
        }),
      ).toThrow("semantic text");
    },
  );
});

describe("evidence contracts", () => {
  it("permits labelled descriptive inference but never critical inference", () => {
    const brand = createGenerationContext().brand;
    expect(BrandEvidenceSchema.parse(brand).voice.state).toBe("inferred");

    const product = createProductEvidence(1);
    expect(() =>
      ProductEvidenceSchema.parse({
        ...product,
        name: {
          state: "inferred",
          value: "Invented critical name",
          evidence: [],
          rationale: "Not permitted.",
        },
      }),
    ).toThrow();
  });

  it("requires evidence for observations and distinct conflict candidates", () => {
    const product = createProductEvidence(1);
    expect(() =>
      ProductEvidenceSchema.parse({
        ...product,
        name: {
          state: "observed",
          value: "Ember Mug",
          evidence: [],
        },
      }),
    ).toThrow();

    const candidate = {
      value: "Ember Mug",
      evidence: [
        {
          source: "product",
          productId: product.productId,
          url: product.suppliedUrl,
          field: "name",
        },
      ],
    };
    expect(() =>
      ProductEvidenceSchema.parse({
        ...product,
        name: {
          state: "conflicted",
          candidates: [candidate, candidate],
        },
      }),
    ).toThrow("distinct candidate");
  });

  it("keeps price amount and currency in one atomic fact", () => {
    const product = createProductEvidence(1);
    expect(() =>
      ProductEvidenceSchema.parse({
        ...product,
        price: {
          state: "observed",
          value: { amount: "25" },
          evidence: [
            {
              source: "product",
              productId: product.productId,
              url: product.suppliedUrl,
              field: "price",
            },
          ],
        },
      }),
    ).toThrow();
  });

  it("rejects duplicate context product IDs and supplied URLs", () => {
    const context = createGenerationContext();
    const duplicateId = {
      ...context,
      products: [
        context.products[0],
        {
          ...context.products[1],
          productId: context.products[0]?.productId,
        },
      ],
    };
    const duplicateUrl = {
      ...context,
      products: [
        context.products[0],
        {
          ...context.products[1],
          suppliedUrl: context.products[0]?.suppliedUrl,
        },
      ],
    };

    expect(() => GenerationContextSchema.parse(duplicateId)).toThrow(
      "IDs must be unique",
    );
    expect(() => GenerationContextSchema.parse(duplicateUrl)).toThrow(
      "URLs must be unique",
    );
  });

  it("rejects an aggregate context that exceeds the model-input byte cap", () => {
    const context = createGenerationContext({ productCount: 6 });
    const products = context.products.map((product) => {
      const evidence = Array.from({ length: 8 }, (_, index) => ({
        source: "product" as const,
        productId: product.productId,
        url: `https://merchant.example.com/evidence/${index}?value=${"x".repeat(
          1_900,
        )}`,
        field: "large-source",
      }));
      return {
        ...product,
        canonicalUrl: { ...product.canonicalUrl, evidence },
        name: { ...product.name, evidence },
        price: { ...product.price, evidence },
        availability: { ...product.availability, evidence },
        imageUrl: { ...product.imageUrl, evidence },
        description: { ...product.description, evidence },
      };
    });

    expect(() =>
      GenerationContextSchema.parse({ ...context, products }),
    ).toThrow("aggregate byte limit");
  });
});
