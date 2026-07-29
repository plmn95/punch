import type {
  BrandEvidence,
  CampaignDraftPayload,
  CritiqueOutputPayload,
  GenerationContext,
  ProductEvidence,
  ProductPresentation,
  RevisionOutputPayload,
} from "../src/core/schemas/index.js";

const WEBSITE_URL = "https://kiln-and-leaf.example.com/";

/** Creates one fictional observed website evidence reference. */
function websiteEvidence(field: string) {
  return {
    source: "website" as const,
    url: WEBSITE_URL,
    field,
  };
}

/** Creates one fictional observed product evidence reference. */
function productEvidence(productId: string, url: string, field: string) {
  return {
    source: "product" as const,
    productId,
    url,
    field,
  };
}

/** Creates a newly authored fictional product evidence profile. */
export function createProductEvidence(index: number): ProductEvidence {
  const productId = `product-${String(index).padStart(2, "0")}`;
  const slug = index === 1 ? "ember-mug" : `meadow-cup-${index}`;
  const suppliedUrl = `${WEBSITE_URL}products/${slug}`;
  const evidence = (field: string) =>
    productEvidence(productId, suppliedUrl, field);

  return {
    productId,
    suppliedUrl,
    canonicalUrl: {
      state: "observed",
      value: suppliedUrl,
      evidence: [evidence("canonical-url")],
    },
    name: {
      state: "observed",
      value: index === 1 ? "Ember Mug" : `Meadow Cup ${index}`,
      evidence: [evidence("name")],
    },
    price: {
      state: "observed",
      value: {
        amount: String(24 + index),
        currency: "EUR",
        display: `€${24 + index}`,
      },
      evidence: [evidence("price")],
    },
    availability: {
      state: "observed",
      value: "in-stock",
      evidence: [evidence("availability")],
    },
    imageUrl: {
      state: "observed",
      value: `${WEBSITE_URL}images/${slug}.jpg`,
      evidence: [evidence("image-url")],
    },
    description: {
      state: "inferred",
      value: "A softly glazed cup made for slow morning drinks.",
      evidence: [evidence("description")],
      rationale: "A conservative paraphrase of the fictional product copy.",
    },
  };
}

/** Creates a newly authored fictional brand evidence profile. */
function createBrandEvidence(): BrandEvidence {
  return {
    websiteUrl: WEBSITE_URL,
    name: {
      state: "observed",
      value: "Kiln & Leaf",
      evidence: [websiteEvidence("name")],
    },
    logoUrl: { state: "unknown" },
    colours: {
      state: "inferred",
      value: ["#B85C3F", "#F4EBDD"],
      evidence: [websiteEvidence("styles.colours")],
      rationale: "The fictional source repeatedly uses these colours.",
    },
    fonts: { state: "unknown" },
    voice: {
      state: "inferred",
      value: {
        summary: "Warm, direct, and grounded in everyday rituals.",
        traits: ["warm", "plain-spoken"],
      },
      evidence: [websiteEvidence("copy.voice")],
      rationale: "The fictional source uses short and welcoming sentences.",
    },
  };
}

/** Creates a validated-shape fictional generation context. */
export function createGenerationContext(
  options: Readonly<{
    goal?: GenerationContext["goal"];
    productCount?: number;
    instructions?: string;
  }> = {},
): GenerationContext {
  const goal = options.goal ?? "sales";
  const products = Array.from(
    { length: options.productCount ?? 2 },
    (_, index) => createProductEvidence(index + 1),
  );
  const base = {
    schemaVersion: "0.1.0" as const,
    brand: createBrandEvidence(),
    products,
    ...(options.instructions ? { instructions: options.instructions } : {}),
  };

  if (goal === "promotion") {
    return {
      ...base,
      goal,
      offer: {
        description: "Save 15% on the selected cups.",
        code: "CUP15",
        endsAt: "2027-02-14T23:59:00+02:00",
      },
    };
  }
  return { ...base, goal };
}

/** Maps observed fictional product evidence to one campaign presentation. */
function createProductItem(product: ProductEvidence): ProductPresentation {
  if (
    product.name.state !== "observed" ||
    product.price.state !== "observed" ||
    product.imageUrl.state !== "observed" ||
    product.canonicalUrl.state !== "observed"
  ) {
    throw new Error("The fictional product fixture must be observed.");
  }

  return {
    productId: product.productId,
    name: product.name.value,
    price: product.price.value,
    image: {
      url: product.imageUrl.value,
      alt: `${product.name.value} on a neutral background`,
    },
    cta: {
      label: "View product",
      href: product.canonicalUrl.value,
    },
  };
}

/** Creates a fictional two-product semantic campaign payload. */
export function createCampaignPayload(
  goal: GenerationContext["goal"] = "sales",
): CampaignDraftPayload {
  const first = createProductEvidence(1);
  const second = createProductEvidence(2);

  return {
    schemaVersion: "0.1.0",
    goal,
    subject: "Two cups for quieter mornings",
    preheader: "Meet the fictional Kiln & Leaf cup selection.",
    blocks: [
      {
        type: "header-standard",
        brandName: "Kiln & Leaf",
        homeUrl: WEBSITE_URL,
      },
      {
        type: "hero-stacked",
        heading: "Choose the cup that fits your ritual",
        body: "Two considered shapes, presented as one coherent collection.",
      },
      {
        type: "product-grid",
        columns: 2,
        items: [createProductItem(first), createProductItem(second)],
      },
      ...(goal === "promotion"
        ? [
            {
              type: "discount-code" as const,
              description: "Use the supplied offer at checkout.",
              code: "CUP15",
              endsAt: "2027-02-14T23:59:00+02:00",
            },
          ]
        : []),
      {
        type: "cta-block",
        heading: "See the complete cup collection",
        actions: [{ label: "Visit Kiln & Leaf", href: WEBSITE_URL }],
      },
    ],
  };
}

/** Creates a critique payload with an optional blocking issue. */
export function createCritiquePayload(
  severity?: "blocking" | "advisory",
): CritiqueOutputPayload {
  return {
    issues: severity
      ? [
          {
            severity,
            code: "clarity",
            summary: "The campaign hierarchy can be clearer.",
            instruction: "Make the collection introduction more direct.",
            blockId: "block-02",
          },
        ]
      : [],
  };
}

/** Creates a revision that addresses the first normalised critique issue. */
export function createRevisionPayload(
  goal: GenerationContext["goal"] = "sales",
): RevisionOutputPayload {
  return {
    campaign: {
      ...createCampaignPayload(goal),
      subject: "Find your everyday cup",
    },
    addressedIssueIds: ["issue-01"],
  };
}
