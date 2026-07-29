import { describe, expect, it } from "vitest";

import {
  GenerationContextSchema,
  ProductIdSchema,
  productIdFromIndex,
} from "../../src/core/schemas/index.js";
import { createGenerationContext } from "../factories.js";

describe("canonical product identity", () => {
  it("allocates only the six canonical input-order IDs", () => {
    expect(
      Array.from({ length: 6 }, (_, index) => productIdFromIndex(index)),
    ).toEqual([
      "product-01",
      "product-02",
      "product-03",
      "product-04",
      "product-05",
      "product-06",
    ]);
    expect(() => productIdFromIndex(-1)).toThrow(RangeError);
    expect(() => productIdFromIndex(6)).toThrow(RangeError);
  });

  it.each(["product-00", "product-07", "product-1", "product-001", "sku-01"])(
    "rejects the non-canonical ID %s",
    (productId) => {
      expect(() => ProductIdSchema.parse(productId)).toThrow();
    },
  );

  it("rejects reordered or skipped context IDs", () => {
    const context = createGenerationContext({ productCount: 3 });
    const reordered = {
      ...context,
      products: [context.products[1], context.products[0], context.products[2]],
    };
    const skipped = {
      ...context,
      products: context.products.map((product, index) =>
        index === 1 ? { ...product, productId: "product-03" } : product,
      ),
    };

    expect(() => GenerationContextSchema.parse(reordered)).toThrow(
      "follow input order",
    );
    expect(() => GenerationContextSchema.parse(skipped)).toThrow(
      "follow input order",
    );
  });
});
