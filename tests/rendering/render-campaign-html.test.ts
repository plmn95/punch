import { expect, it } from "vitest";

import type {
  Campaign,
  ProductPresentation,
} from "../../src/core/schemas/index.js";
import {
  PHYSICAL_ADDRESS_PLACEHOLDER,
  UNSUBSCRIBE_PLACEHOLDER,
} from "../../src/rendering/render-contract.js";
import { renderCampaignHtml } from "../../src/rendering/render-campaign-html.js";
import {
  countOccurrences,
  escapePattern,
  FIXED_CAMPAIGN,
  transformCampaign,
} from "./support.js";

const EXPECTED_BLOCK_TYPES = [
  "header-standard",
  "hero-stacked",
  "heading",
  "body-paragraph",
  "product-feature",
  "product-grid",
  "discount-code",
  "cta-block",
] as const;

/** Returns an equivalent object with its optional image field absent. */
function withoutImage<T extends { image?: unknown }>(value: T): T {
  const copy = { ...value };
  delete copy.image;
  return copy;
}

/** Collects every fixed product presentation in campaign order. */
function collectProducts(campaign: Campaign): ProductPresentation[] {
  const products: ProductPresentation[] = [];

  for (const block of campaign.blocks) {
    if (block.type === "product-feature") {
      products.push(block);
    }
    if (block.type === "product-grid") {
      products.push(...block.items);
    }
  }

  return products;
}

/** Extracts rendered href and src attribute values for URL-boundary checks. */
function collectRenderedUrls(html: string): string[] {
  return [...html.matchAll(/\s(?:href|src)="([^"]*)"/gu)].flatMap((match) =>
    match[1] === undefined ? [] : [match[1]],
  );
}

/** Verifies that one product's complete evidence remains inside its own scope. */
function expectCompleteProductScope(
  html: string,
  product: ProductPresentation,
  productIndex: number,
  scopeEnd: number,
): void {
  if (
    product.description === undefined ||
    product.price?.display === undefined ||
    product.image === undefined
  ) {
    throw new Error("Every fixed product presentation must remain complete.");
  }

  const productScope = html.slice(productIndex, scopeEnd);
  expect(productScope).toContain(product.name);
  expect(productScope).toContain(product.description);
  expect(productScope).toContain(product.price.display);
  expect(productScope).toMatch(
    new RegExp(
      `data-punch-image-for="${product.productId}"[^>]*src="${escapePattern(product.image.url)}"`,
      "u",
    ),
  );
  expect(productScope).toMatch(
    new RegExp(
      `data-punch-cta-for="${product.productId}"[^>]*href="${escapePattern(product.cta.href)}"`,
      "u",
    ),
  );
}

/** Verifies that every rendered resource URL uses an allowed form. */
function expectAllowedRenderedUrls(html: string): void {
  for (const url of collectRenderedUrls(html)) {
    if (url !== UNSUBSCRIBE_PLACEHOLDER) {
      expect(["http:", "https:"]).toContain(new URL(url).protocol);
    }
  }
}

it("renders the fixed fixture into deterministic, ordered standalone HTML", async () => {
  const first = await renderCampaignHtml(FIXED_CAMPAIGN);
  const second = await renderCampaignHtml(FIXED_CAMPAIGN);

  expect(first).toBe(second);
  expect(first).toMatch(/^<!DOCTYPE html/iu);
  expect(first).toContain('<html data-punch-render="email-v1" lang="en">');
  expect(first).toContain("<head>");
  expect(first).toContain("<body");
  expect(first).toContain(
    "<title>Save 15% on pieces for slower mornings</title>",
  );
  expect(first).toContain(
    "Meet three Kiln &amp; Leaf pieces and save 15% with TABLE15.",
  );

  let previousBlockIndex = -1;
  for (const [index, blockType] of EXPECTED_BLOCK_TYPES.entries()) {
    const blockId = `block-${String(index + 1).padStart(2, "0")}`;
    const idMarker = `data-punch-block-id="${blockId}"`;
    const typeMarker = `data-punch-block-type="${blockType}"`;
    const markerIndex = first.indexOf(idMarker);

    expect(countOccurrences(first, idMarker)).toBe(1);
    expect(countOccurrences(first, typeMarker)).toBe(1);
    expect(markerIndex).toBeGreaterThan(previousBlockIndex);
    previousBlockIndex = markerIndex;
  }

  expect(first.indexOf('data-punch-compliance="v1"')).toBeGreaterThan(
    previousBlockIndex,
  );
  expect(countOccurrences(first, PHYSICAL_ADDRESS_PLACEHOLDER)).toBe(1);
  expect(countOccurrences(first, UNSUBSCRIBE_PLACEHOLDER)).toBe(1);
  expect(first).toContain(`href="${UNSUBSCRIBE_PLACEHOLDER}"`);
});

it("preserves the fixed product fields and only emits allowed URL forms", async () => {
  const html = await renderCampaignHtml(FIXED_CAMPAIGN);
  const products = collectProducts(FIXED_CAMPAIGN);
  let previousProductIndex = -1;

  for (const [index, product] of products.entries()) {
    const marker = `data-punch-product-id="${product.productId}"`;
    const productIndex = html.indexOf(marker);
    const nextProduct = products[index + 1];
    const scopeEnd =
      nextProduct === undefined
        ? html.indexOf('data-punch-block-id="block-07"')
        : html.indexOf(
            `data-punch-product-id="${nextProduct.productId}"`,
            productIndex + marker.length,
          );

    expect(countOccurrences(html, marker)).toBe(1);
    expect(productIndex).toBeGreaterThan(previousProductIndex);
    expect(scopeEnd).toBeGreaterThan(productIndex);
    previousProductIndex = productIndex;

    expectCompleteProductScope(html, product, productIndex, scopeEnd);
  }

  expectAllowedRenderedUrls(html);
  expect(html).toContain('data-punch-grid-columns="2"');
  expect(html).toContain("@media only screen and (max-width: 600px)");
  expect(html).toContain(".punch-mobile-column");
});

it("uses an image-free branch and never invents placeholder media", async () => {
  const imageFreeCampaign = transformCampaign(FIXED_CAMPAIGN, (block) => {
    if (block.type === "product-feature") {
      return withoutImage(block);
    }
    if (block.type === "product-grid") {
      return {
        ...block,
        items: block.items.map(withoutImage),
      };
    }
    return block;
  });

  const html = await renderCampaignHtml(imageFreeCampaign);

  expect(html).not.toContain("<img");
  expect(html).not.toContain("data-punch-image-for");
  expect(html).not.toMatch(/placeholder|placehold\.co|picsum/iu);
  expect(html).toContain("Ember Mug");
  expect(html).toContain("Meadow Cup");
  expect(html).toContain("Hearth Pitcher");
});
