import type { CampaignDraftPayload, ProductId } from "./schemas/index.js";

export type ProductBlockBinding =
  | Readonly<{
      blockIndex: number;
      blockType: "product-feature";
      productId: ProductId;
    }>
  | Readonly<{
      blockIndex: number;
      blockType: "product-grid";
      itemIndex: number;
      productId: ProductId;
    }>;

/** Collects explicit product-to-block metadata in semantic render order. */
export function collectProductBlockBindings(
  campaign: Pick<CampaignDraftPayload, "blocks">,
): ProductBlockBinding[] {
  const bindings: ProductBlockBinding[] = [];
  campaign.blocks.forEach((block, blockIndex) => {
    if (block.type === "product-feature") {
      bindings.push({
        blockIndex,
        blockType: block.type,
        productId: block.productId,
      });
    }
    if (block.type === "product-grid") {
      block.items.forEach((item, itemIndex) => {
        bindings.push({
          blockIndex,
          blockType: block.type,
          itemIndex,
          productId: item.productId,
        });
      });
    }
  });
  return bindings;
}
