import {
  CampaignSchema,
  productIdFromIndex,
  type Campaign,
  type CampaignBlock,
  type ProductPresentation,
} from "../../src/core/schemas/index.js";
import campaignFixture from "../fixtures/checkpoint-2/campaign.json" with { type: "json" };

export const FIXED_CAMPAIGN = CampaignSchema.parse(campaignFixture);

/** Counts exact literal appearances without treating the value as a pattern. */
export function countOccurrences(value: string, expected: string): number {
  return value.split(expected).length - 1;
}

/** Escapes one literal for use in a scoped HTML assertion pattern. */
export function escapePattern(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
}

/** Applies a block transform and reparses the resulting campaign boundary. */
export function transformCampaign(
  campaign: Campaign,
  transform: (block: CampaignBlock) => CampaignBlock,
): Campaign {
  return CampaignSchema.parse({
    ...campaign,
    blocks: campaign.blocks.map(transform),
  });
}

/** Creates independent schema-valid products for grid-geometry cases. */
export function createGridProducts(count: number): ProductPresentation[] {
  const grid = FIXED_CAMPAIGN.blocks.find(
    (block) => block.type === "product-grid",
  );
  const template = grid?.items[0];
  if (template === undefined || template.image === undefined) {
    throw new Error("The fixed grid template must retain its image.");
  }

  return Array.from({ length: count }, (_, index) => {
    const sequence = String(index + 1).padStart(2, "0");
    return {
      ...template,
      productId: productIdFromIndex(index),
      name: `Grid product ${sequence}`,
      image: {
        alt: `Grid product ${sequence}`,
        url: `https://kiln-and-leaf.example.com/images/products/grid-${sequence}.jpg`,
      },
      cta: {
        label: `View grid product ${sequence}`,
        href: `https://kiln-and-leaf.example.com/products/grid-${sequence}`,
      },
    };
  });
}
