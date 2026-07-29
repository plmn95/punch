import { describe, expect, it } from "vitest";

import { renderCampaignHtml } from "../../src/rendering/index.js";
import { gridRowWidth } from "../../src/rendering/render-contract.js";
import {
  collectCheckpointProducts,
  SINGLE_PRODUCT_CAMPAIGN,
  SIX_PRODUCT_CAMPAIGN,
  withoutProductImages,
} from "./checkpoint-4-support.js";
import { countOccurrences } from "./support.js";

const CANONICAL_CAMPAIGNS = [
  ["single product", SINGLE_PRODUCT_CAMPAIGN, 1],
  ["six products", SIX_PRODUCT_CAMPAIGN, 6],
] as const;

/** Collects every HTTP(S) string from one validated fictional campaign. */
function collectCampaignUrls(value: unknown): string[] {
  if (typeof value === "string") {
    return /^https?:\/\//u.test(value) ? [value] : [];
  }
  if (Array.isArray(value)) {
    return value.flatMap(collectCampaignUrls);
  }
  return value !== null && typeof value === "object"
    ? Object.values(value).flatMap(collectCampaignUrls)
    : [];
}

/** Requires every product marker and observed field to survive rendering. */
function expectProductsRemainBound(
  campaign: typeof SINGLE_PRODUCT_CAMPAIGN,
  html: string,
) {
  for (const product of collectCheckpointProducts(campaign)) {
    expect(
      countOccurrences(html, `data-punch-product-id="${product.productId}"`),
    ).toBe(1);
    expect(html).toContain(product.name);
    expect(html).toContain(product.cta.label);
    expect(html).toContain(`href="${product.cta.href}"`);
    if (product.price !== undefined) {
      expect(html).toContain(product.price.display);
    }
    if (product.image !== undefined) {
      expect(html).toContain(`src="${product.image.url}"`);
      expect(html).toContain(`data-punch-image-for="${product.productId}"`);
    }
  }
}

describe.each(CANONICAL_CAMPAIGNS)(
  "%s checkpoint-4 fixture",
  (_, campaign, productCount) => {
    it("renders deterministically with every fixture product presentation represented", async () => {
      const first = await renderCampaignHtml(campaign);
      const second = await renderCampaignHtml(campaign);

      expect(first).toBe(second);
      expect(collectCheckpointProducts(campaign)).toHaveLength(productCount);
      expectProductsRemainBound(campaign, first);
    });

    it("retains its hierarchy without inventing image placeholders", async () => {
      const imageFree = withoutProductImages(campaign);
      const html = await renderCampaignHtml(imageFree);

      expect(html).not.toContain("<img");
      expect(html).not.toContain("data-punch-image-for");
      expect(html).not.toMatch(/placeholder|placehold\.co|picsum/iu);
      expectProductsRemainBound(imageFree, html);
    });
  },
);

it("uses only the exact reserved fictional fixture hosts", () => {
  const hosts = CANONICAL_CAMPAIGNS.flatMap(([, campaign]) =>
    collectCampaignUrls(campaign).map((url) => new URL(url).hostname),
  );

  expect(new Set(hosts)).toEqual(
    new Set(["quiet-relay.example.com", "soft-orbit.example.com"]),
  );
});

it("uses a featured product plus a balanced two-column supporting grid", async () => {
  const html = await renderCampaignHtml(SIX_PRODUCT_CAMPAIGN);
  const featureIndex = html.indexOf('data-punch-block-type="product-feature"');
  const gridIndex = html.indexOf('data-punch-block-type="product-grid"');

  expect(featureIndex).toBeGreaterThan(-1);
  expect(gridIndex).toBeGreaterThan(featureIndex);
  expect(countOccurrences(html, 'data-punch-grid-columns="2"')).toBe(1);
  expect(countOccurrences(html, "data-punch-grid-row-table=")).toBe(3);
  expect(html).toContain(`width="${gridRowWidth(1, 2)}"`);
});
