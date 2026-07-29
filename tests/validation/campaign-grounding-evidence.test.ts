import { describe, expect, it } from "vitest";

import {
  GenerationContextSchema,
  type GenerationContext,
  type ProductEvidence,
} from "../../src/core/schemas/index.js";
import {
  validateCampaignGrounding,
  validateProductEvidenceReferences,
  type CampaignGroundingIssueCode,
} from "../../src/validation/index.js";
import {
  createGroundedCampaign,
  createGroundingContext,
  mapCampaignPresentation,
} from "../support/grounding-fixtures.js";

type OptionalProductField = "price" | "imageUrl" | "description";

/** Replaces one product fact through the canonical context schema. */
function replaceFirstProductFact(
  context: GenerationContext,
  field: keyof ProductEvidence,
  fact: unknown,
): GenerationContext {
  return GenerationContextSchema.parse({
    ...context,
    products: context.products.map((product, index) =>
      index === 0 ? { ...product, [field]: fact } : product,
    ),
  });
}

/** Returns a distinct schema-valid conflict candidate value. */
function conflictValue(field: OptionalProductField): unknown {
  if (field === "price") {
    return { amount: "999.00", currency: "CHF", display: "CHF 999" };
  }
  if (field === "imageUrl") {
    return "https://grounding-garden.example.com/images/conflict.jpg";
  }
  return "A deliberately conflicting fictional description.";
}

/** Makes one optional product fact unknown or genuinely conflicted. */
function unavailableContext(
  field: OptionalProductField,
  state: "unknown" | "conflicted",
): GenerationContext {
  const context = createGroundingContext(1);
  const observed = context.products[0]![field];
  if (observed.state !== "observed") {
    throw new Error("The grounding fact must begin observed.");
  }
  const fact =
    state === "unknown"
      ? { state }
      : {
          state,
          candidates: [
            { value: observed.value, evidence: observed.evidence },
            { value: conflictValue(field), evidence: observed.evidence },
          ],
        };
  return replaceFirstProductFact(context, field, fact);
}

const OPTIONAL_CASES: ReadonlyArray<{
  field: OptionalProductField;
  code: CampaignGroundingIssueCode;
}> = [
  { field: "price", code: "product-price-unavailable" },
  { field: "imageUrl", code: "product-image-unavailable" },
  { field: "description", code: "product-description-unavailable" },
];

describe("grounding evidence states", () => {
  it.each(
    OPTIONAL_CASES.flatMap((test) => [
      { ...test, state: "unknown" as const },
      { ...test, state: "conflicted" as const },
    ]),
  )(
    "requires $field omission when evidence is $state",
    ({ field, state, code }) => {
      const unavailable = unavailableContext(field, state);
      const campaignWithFact = createGroundedCampaign(
        createGroundingContext(1),
      );
      const selected = validateCampaignGrounding(campaignWithFact, unavailable);
      const omitted = validateCampaignGrounding(
        createGroundedCampaign(unavailable),
        unavailable,
      );

      expect(selected.valid).toBe(false);
      expect(selected.issues.map((issue) => issue.code)).toContain(code);
      expect(omitted).toEqual({ valid: true, issues: [] });
    },
  );

  it("allows exact inferred description evidence", () => {
    const context = createGroundingContext(1);
    const description = context.products[0]!.description;
    if (description.state !== "observed") {
      throw new Error("The grounding description must begin observed.");
    }
    const inferred = replaceFirstProductFact(context, "description", {
      state: "inferred",
      value: description.value,
      evidence: description.evidence,
      rationale: "A labelled fictional description inference.",
    });

    expect(
      validateCampaignGrounding(createGroundedCampaign(inferred), inferred),
    ).toEqual({ valid: true, issues: [] });
  });

  it("allows omission of observed optionals and an observed price display", () => {
    const context = createGroundingContext(1);
    const campaign = mapCampaignPresentation(
      createGroundedCampaign(context),
      "product-01",
      (product) => ({
        productId: product.productId,
        name: product.name,
        price: {
          amount: product.price!.amount,
          currency: product.price!.currency,
        },
        cta: product.cta,
      }),
    );

    expect(validateCampaignGrounding(campaign, context)).toEqual({
      valid: true,
      issues: [],
    });
  });

  it("rejects a display string when price evidence has none", () => {
    const context = createGroundingContext(1);
    const price = context.products[0]!.price;
    if (price.state !== "observed") {
      throw new Error("The grounding price must begin observed.");
    }
    const withoutDisplay = replaceFirstProductFact(context, "price", {
      ...price,
      value: {
        amount: price.value.amount,
        currency: price.value.currency,
      },
    });
    const withDisplay = validateCampaignGrounding(
      createGroundedCampaign(context),
      withoutDisplay,
    );
    const exact = validateCampaignGrounding(
      createGroundedCampaign(withoutDisplay),
      withoutDisplay,
    );

    expect(withDisplay.issues.map((issue) => issue.code)).toContain(
      "product-price-mismatch",
    );
    expect(exact).toEqual({ valid: true, issues: [] });
  });

  it.each(["name", "canonicalUrl"] as const)(
    "rejects unavailable required %s evidence",
    (field) => {
      const context = replaceFirstProductFact(
        createGroundingContext(1),
        field,
        { state: "unknown" },
      );
      const campaign = createGroundedCampaign(createGroundingContext(1));
      const validation = validateCampaignGrounding(campaign, context);

      expect(validation.issues.map((issue) => issue.code)).toContain(
        field === "name"
          ? "product-name-unavailable"
          : "product-cta-url-unavailable",
      );
    },
  );
});

describe("product evidence-reference ownership", () => {
  it.each([
    {
      name: "another product ID",
      reference: {
        source: "product" as const,
        productId: "product-02" as const,
        url: "https://grounding-garden.example.com/products/vessel-1",
        field: "name",
      },
    },
    {
      name: "the supplied pre-redirect URL",
      reference: {
        source: "product" as const,
        productId: "product-01" as const,
        url: "https://grounding-garden.example.com/go/vessel-1",
        field: "name",
      },
    },
    {
      name: "a website source",
      reference: {
        source: "website" as const,
        url: "https://grounding-garden.example.com/products/vessel-1",
        field: "name",
      },
    },
  ])("rejects $name before campaign validation", ({ reference }) => {
    const context = createGroundingContext(1);
    const name = context.products[0]!.name;
    if (name.state !== "observed") {
      throw new Error("The grounding name must begin observed.");
    }
    const mismatched = replaceFirstProductFact(context, "name", {
      ...name,
      evidence: [reference],
    });

    expect(validateProductEvidenceReferences(mismatched)).toEqual({
      valid: false,
      issues: [
        {
          code: "product-evidence-reference-mismatch",
          productId: "product-01",
        },
      ],
    });
  });

  it("checks every conflicted candidate reference", () => {
    const context = createGroundingContext(2);
    const price = context.products[0]!.price;
    if (price.state !== "observed") {
      throw new Error("The grounding price must begin observed.");
    }
    const otherUrl =
      context.products[1]!.canonicalUrl.state === "observed"
        ? context.products[1]!.canonicalUrl.value
        : "";
    const mismatched = replaceFirstProductFact(context, "price", {
      state: "conflicted",
      candidates: [
        { value: price.value, evidence: price.evidence },
        {
          value: { amount: "77.00", currency: "NZD" },
          evidence: [
            {
              source: "product",
              productId: "product-01",
              url: otherUrl,
              field: "price",
            },
          ],
        },
      ],
    });

    expect(validateProductEvidenceReferences(mismatched).valid).toBe(false);
  });
});
