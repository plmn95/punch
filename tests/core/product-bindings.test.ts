import { describe, expect, it } from "vitest";

import { collectProductBlockBindings } from "../../src/core/product-bindings.js";
import { createCampaignPayload } from "../factories.js";

describe("product-to-block binding metadata", () => {
  it("collects feature and grid bindings in semantic render order", () => {
    const campaign = createCampaignPayload();
    const grid = campaign.blocks.find((block) => block.type === "product-grid");
    if (grid === undefined) {
      throw new Error("The fictional campaign must contain a product grid.");
    }
    const withRepeatedFeature = {
      ...campaign,
      blocks: [
        {
          type: "product-feature" as const,
          productId: "product-01" as const,
          name: "Ember Mug",
          cta: {
            label: "View product",
            href: "https://kiln-and-leaf.example.com/products/ember-mug",
          },
        },
        ...campaign.blocks,
      ],
    };

    expect(collectProductBlockBindings(withRepeatedFeature)).toEqual([
      {
        blockIndex: 0,
        blockType: "product-feature",
        productId: "product-01",
      },
      ...grid.items.map((item, itemIndex) => ({
        blockIndex: 3,
        blockType: "product-grid" as const,
        itemIndex,
        productId: item.productId,
      })),
    ]);
  });
});
