import {
  CampaignDraftPayloadSchema,
  GenerationContextSchema,
  productIdFromIndex,
  type CampaignDraftPayload,
  type GenerationContext,
  type ProductEvidence,
  type ProductId,
  type ProductPresentation,
} from "../../src/core/schemas/index.js";
import { createGenerationContext } from "../factories.js";

const PRODUCT_ORIGIN = "https://grounding-garden.example.com/";
const CURRENCIES = ["EUR", "GBP", "USD", "CAD", "AUD", "JPY"] as const;
const DISPLAYS = ["€31", "£32", "$33", "CA$34", "A$35", "¥36"] as const;
const AVAILABILITY = [
  "in-stock",
  "out-of-stock",
  "preorder",
  "backorder",
  "discontinued",
  "in-stock",
] as const;

/** Creates one product source reference owned by its canonical final URL. */
function productReference(
  productId: ProductId,
  canonicalUrl: string,
  field: string,
) {
  return {
    source: "product" as const,
    productId,
    url: canonicalUrl,
    field,
  };
}

/** Creates one distinct fictional product for grounding adversaries. */
function createGroundingProduct(index: number): ProductEvidence {
  const productId = productIdFromIndex(index);
  const sequence = index + 1;
  const canonicalUrl = `${PRODUCT_ORIGIN}products/vessel-${sequence}`;
  const reference = (field: string) =>
    productReference(productId, canonicalUrl, field);
  return {
    productId,
    suppliedUrl: `${PRODUCT_ORIGIN}go/vessel-${sequence}`,
    canonicalUrl: {
      state: "observed",
      value: canonicalUrl,
      evidence: [reference("canonical-url")],
    },
    name: {
      state: "observed",
      value: `Grounding Vessel ${sequence}`,
      evidence: [reference("name")],
    },
    price: {
      state: "observed",
      value: {
        amount: `${30 + sequence}.00`,
        currency: CURRENCIES[index]!,
        display: DISPLAYS[index]!,
      },
      evidence: [reference("price")],
    },
    availability: {
      state: "observed",
      value: AVAILABILITY[index]!,
      evidence: [reference("availability")],
    },
    imageUrl: {
      state: "observed",
      value: `${PRODUCT_ORIGIN}images/vessel-${sequence}.jpg`,
      evidence: [reference("image-url")],
    },
    description: {
      state: "observed",
      value: `Distinct fictional vessel description ${sequence}.`,
      evidence: [reference("description")],
    },
  };
}

/** Creates a schema-valid context with one to six deliberately distinct products. */
export function createGroundingContext(
  productCount: number,
): GenerationContext {
  const base = createGenerationContext({ productCount });
  return GenerationContextSchema.parse({
    ...base,
    products: Array.from({ length: productCount }, (_, index) =>
      createGroundingProduct(index),
    ),
  });
}

/** Maps one evidence profile to its exact grounded product presentation. */
export function createGroundedPresentation(
  product: ProductEvidence,
): ProductPresentation {
  if (
    product.name.state !== "observed" ||
    product.canonicalUrl.state !== "observed"
  ) {
    throw new Error("Grounded test products require observed identity.");
  }
  return {
    productId: product.productId,
    name: product.name.value,
    ...(product.description.state === "observed" ||
    product.description.state === "inferred"
      ? { description: product.description.value }
      : {}),
    ...(product.price.state === "observed"
      ? { price: product.price.value }
      : {}),
    ...(product.imageUrl.state === "observed"
      ? {
          image: {
            url: product.imageUrl.value,
            alt: product.name.value,
          },
        }
      : {}),
    cta: {
      label: "View product",
      href: product.canonicalUrl.value,
    },
  };
}

/** Returns a stable grid width for two through six fictional products. */
function gridColumns(productCount: number): 2 | 3 | 4 {
  if (productCount === 2) {
    return 2;
  }
  return productCount === 4 ? 4 : 3;
}

/** Creates one exact single- or multi-product campaign from its context. */
export function createGroundedCampaign(
  context: GenerationContext,
): CampaignDraftPayload {
  const products = context.products.map(createGroundedPresentation);
  const productBlocks =
    products.length === 1
      ? [{ type: "product-feature" as const, ...products[0]! }]
      : products.length === 2
        ? [
            {
              type: "product-grid" as const,
              columns: 2 as const,
              items: products,
            },
          ]
        : [
            { type: "product-feature" as const, ...products[0]! },
            {
              type: "product-grid" as const,
              columns: gridColumns(products.length - 1),
              items: products.slice(1),
            },
          ];
  const discountBlocks =
    context.goal === "promotion" && context.offer.code
      ? [
          {
            type: "discount-code" as const,
            description: context.offer.description,
            code: context.offer.code,
            ...(context.offer.endsAt ? { endsAt: context.offer.endsAt } : {}),
          },
        ]
      : [];
  return CampaignDraftPayloadSchema.parse({
    schemaVersion: "0.1.0",
    goal: context.goal,
    subject: "A grounded fictional product selection",
    preheader: "Every supplied product remains correctly represented.",
    blocks: [...productBlocks, ...discountBlocks],
  });
}

/** Replaces one product presentation while preserving its block structure. */
export function mapCampaignPresentation(
  campaign: CampaignDraftPayload,
  productId: ProductId,
  transform: (product: ProductPresentation) => ProductPresentation,
): CampaignDraftPayload {
  return CampaignDraftPayloadSchema.parse({
    ...campaign,
    blocks: campaign.blocks.map((block) => {
      if (block.type === "product-feature" && block.productId === productId) {
        return { ...block, ...transform(block), type: block.type };
      }
      if (block.type === "product-grid") {
        return {
          ...block,
          items: block.items.map((product) =>
            product.productId === productId ? transform(product) : product,
          ),
        };
      }
      return block;
    }),
  });
}
