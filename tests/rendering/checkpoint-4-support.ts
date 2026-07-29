import {
  CampaignSchema,
  type Campaign,
  type CampaignBlock,
  type ProductPresentation,
} from "../../src/core/schemas/index.js";
import singleProductFixture from "../fixtures/checkpoint-4/single-product.json" with { type: "json" };
import sixProductFixture from "../fixtures/checkpoint-4/six-product.json" with { type: "json" };

export const SINGLE_PRODUCT_CAMPAIGN =
  CampaignSchema.parse(singleProductFixture);
export const SIX_PRODUCT_CAMPAIGN = CampaignSchema.parse(sixProductFixture);

/** Removes one optional image while retaining every other supplied field. */
function omitImage<T extends { image?: unknown }>(value: T): Omit<T, "image"> {
  const { image, ...imageFree } = value;
  void image;
  return imageFree;
}

/** Collects each semantic product presentation in campaign order. */
export function collectCheckpointProducts(
  campaign: Campaign,
): ProductPresentation[] {
  return campaign.blocks.flatMap((block) => {
    if (block.type === "product-feature") {
      return [block];
    }
    return block.type === "product-grid" ? block.items : [];
  });
}

/** Derives an otherwise identical campaign without optional product images. */
export function withoutProductImages(campaign: Campaign): Campaign {
  return CampaignSchema.parse({
    ...campaign,
    blocks: campaign.blocks.map((block) => {
      if (block.type === "product-feature") {
        return omitImage(block);
      }
      if (block.type === "product-grid") {
        return {
          ...block,
          items: block.items.map(omitImage),
        };
      }
      return block;
    }),
  });
}

/** Applies one block transform and reparses the checkpoint campaign boundary. */
export function transformCheckpointCampaign(
  campaign: Campaign,
  transform: (block: CampaignBlock) => CampaignBlock,
): Campaign {
  return CampaignSchema.parse({
    ...campaign,
    blocks: campaign.blocks.map(transform),
  });
}
