import { expect, it } from "vitest";

import { CampaignSchema, type Campaign } from "../../src/core/schemas/index.js";
import { renderCampaignHtml } from "../../src/rendering/index.js";
import { MAX_HTML_BYTES } from "../../src/rendering/render-contract.js";
import { validateRenderedCampaign } from "../../src/validation/index.js";
import {
  SINGLE_PRODUCT_CAMPAIGN,
  SIX_PRODUCT_CAMPAIGN,
  transformCheckpointCampaign,
  withoutProductImages,
} from "../rendering/checkpoint-4-support.js";

/** Returns a stable map of deterministic check outcomes. */
function checkOutcomes(campaign: Campaign, html: string) {
  return Object.fromEntries(
    validateRenderedCampaign(campaign, html).checks.map((check) => [
      check.id,
      check.passed,
    ]),
  );
}

/** Replaces one exact generated literal and proves the fixture contained it. */
function replaceRequired(html: string, expected: string, replacement: string) {
  expect(html).toContain(expected);
  return html.replace(expected, replacement);
}

/** Creates a schema-valid campaign whose rendered bytes exceed the output cap. */
function createOversizedCampaign(): Campaign {
  const header = SINGLE_PRODUCT_CAMPAIGN.blocks.find(
    (block) => block.type === "header-standard",
  );
  const product = SINGLE_PRODUCT_CAMPAIGN.blocks.find(
    (block) => block.type === "product-feature",
  );
  if (header === undefined || product === undefined) {
    throw new Error("The single-product fixture must retain its core blocks.");
  }

  return CampaignSchema.parse({
    ...SINGLE_PRODUCT_CAMPAIGN,
    blocks: [
      { ...header, id: "block-01" },
      { ...product, id: "block-02" },
      ...Array.from({ length: 38 }, (_, index) => ({
        type: "body-paragraph",
        markdown: "x".repeat(4_000),
        id: `block-${String(index + 3).padStart(2, "0")}`,
      })),
    ],
  });
}

it("passes all eight stable checks for image and image-free campaigns", async () => {
  for (const campaign of [
    SINGLE_PRODUCT_CAMPAIGN,
    withoutProductImages(SINGLE_PRODUCT_CAMPAIGN),
    SIX_PRODUCT_CAMPAIGN,
    withoutProductImages(SIX_PRODUCT_CAMPAIGN),
  ]) {
    const result = validateRenderedCampaign(
      campaign,
      await renderCampaignHtml(campaign),
    );

    expect(result.valid).toBe(true);
    expect(result.checks.map((check) => check.id)).toEqual([
      "contrast",
      "font-floor",
      "cta-height",
      "html-bytes",
      "grid-geometry",
      "compliance",
      "resource-urls",
      "product-binding",
    ]);
    expect(result.checks.every((check) => check.passed)).toBe(true);
  }
});

it("rejects oversized output by encoded byte length", async () => {
  const html = await renderCampaignHtml(SINGLE_PRODUCT_CAMPAIGN);
  const oversized = `${html}${"é".repeat(MAX_HTML_BYTES)}`;

  expect(checkOutcomes(SINGLE_PRODUCT_CAMPAIGN, oversized)["html-bytes"]).toBe(
    false,
  );
});

it("fails closed when schema-valid campaign output exceeds the cap", async () => {
  const campaign = createOversizedCampaign();

  await expect(renderCampaignHtml(campaign)).rejects.toThrow(
    "Rendered campaign failed deterministic checks: html-bytes",
  );
});

it("rejects missing compliance ownership tokens", async () => {
  const html = await renderCampaignHtml(SINGLE_PRODUCT_CAMPAIGN);
  const tampered = replaceRequired(
    html,
    "{{unsubscribe_url}}",
    "https://soft-orbit.example.com/unsubscribe",
  );

  expect(checkOutcomes(SINGLE_PRODUCT_CAMPAIGN, tampered).compliance).toBe(
    false,
  );
});

it("rejects unsafe or non-canonical resource URLs", async () => {
  const html = await renderCampaignHtml(SINGLE_PRODUCT_CAMPAIGN);
  const tampered = replaceRequired(
    html,
    "https://soft-orbit.example.com/",
    "https://user:secret@soft-orbit.example.com/",
  );

  expect(
    checkOutcomes(SINGLE_PRODUCT_CAMPAIGN, tampered)["resource-urls"],
  ).toBe(false);
});

it("does not interpret url-like copy or marker-like text as control syntax", async () => {
  const campaign = transformCheckpointCampaign(
    SINGLE_PRODUCT_CAMPAIGN,
    (block) => {
      if (block.type === "body-paragraph") {
        return {
          ...block,
          markdown:
            'Read url(example) and data-punch-product-id="fake" as plain text.',
        };
      }
      return block.type === "product-feature"
        ? {
            ...block,
            cta: {
              ...block.cta,
              href: "https://soft-orbit.example.com/products/url(foo)",
            },
          }
        : block;
    },
  );

  await expect(renderCampaignHtml(campaign)).resolves.toContain(
    "data-punch-product-id=&quot;fake&quot;",
  );
});

it("rejects swapped product links and images", async () => {
  const html = await renderCampaignHtml(SIX_PRODUCT_CAMPAIGN);
  const firstHref = "https://quiet-relay.example.com/products/anchor-notebook";
  const secondHref = "https://quiet-relay.example.com/products/loop-pen-set";
  const firstImage =
    "https://quiet-relay.example.com/images/products/anchor-notebook.jpg";
  const secondImage =
    "https://quiet-relay.example.com/images/products/loop-pen-set.jpg";
  const linksSwapped = replaceRequired(
    replaceRequired(html, firstHref, "__SECOND_HREF__"),
    secondHref,
    firstHref,
  ).replace("__SECOND_HREF__", secondHref);
  const imagesSwapped = replaceRequired(
    replaceRequired(html, firstImage, "__SECOND_IMAGE__"),
    secondImage,
    firstImage,
  ).replace("__SECOND_IMAGE__", secondImage);

  expect(
    checkOutcomes(SIX_PRODUCT_CAMPAIGN, linksSwapped)["product-binding"],
  ).toBe(false);
  expect(
    checkOutcomes(SIX_PRODUCT_CAMPAIGN, imagesSwapped)["product-binding"],
  ).toBe(false);
});

it("rejects swapped product facts, labels, and alt text", async () => {
  const html = await renderCampaignHtml(SIX_PRODUCT_CAMPAIGN);
  const tamperedPairs = [
    ["Anchor Notebook", "Loop Pen Set"],
    [
      "A clothbound, lay-flat notebook with 192 ruled pages and a stitched spine.",
      "Three fine-tip pens in charcoal, rust, and moss, packed in a paper sleeve.",
    ],
    ["$22", "$18"],
    ["View Anchor Notebook", "View Loop Pen Set"],
    [
      "Charcoal Anchor Notebook open beside a pencil",
      "Three Loop pens in charcoal, rust, and moss",
    ],
  ] as const;

  for (const [first, second] of tamperedPairs) {
    const swapped = replaceRequired(
      replaceRequired(html, first, "__SECOND_FACT__"),
      second,
      first,
    ).replace("__SECOND_FACT__", second);
    expect(
      checkOutcomes(SIX_PRODUCT_CAMPAIGN, swapped)["product-binding"],
    ).toBe(false);
  }
});

it("rejects extra product CTAs and stray image-free media", async () => {
  const html = await renderCampaignHtml(SINGLE_PRODUCT_CAMPAIGN);
  const cta = html.match(
    /<a data-punch-cta-for="product-01"[^>]*>[^<]*<\/a>/u,
  )?.[0];
  if (cta === undefined) {
    throw new Error("The fixture product CTA must remain present.");
  }
  const duplicateCta = html.replace(cta, `${cta}${cta}`);
  const imageFreeCampaign = withoutProductImages(SINGLE_PRODUCT_CAMPAIGN);
  const imageFreeHtml = await renderCampaignHtml(imageFreeCampaign);
  const productStart = imageFreeHtml.indexOf(
    'data-punch-product-id="product-01"',
  );
  const insertion = imageFreeHtml.indexOf(">", productStart) + 1;
  const strayImage = `${imageFreeHtml.slice(0, insertion)}<img alt="Stray" src="https://soft-orbit.example.com/stray.jpg"/>${imageFreeHtml.slice(insertion)}`;

  expect(
    checkOutcomes(SINGLE_PRODUCT_CAMPAIGN, duplicateCta)["product-binding"],
  ).toBe(false);
  expect(checkOutcomes(imageFreeCampaign, strayImage)["product-binding"]).toBe(
    false,
  );
});

it("rejects malformed grid geometry and oversized image widths", async () => {
  const html = await renderCampaignHtml(SIX_PRODUCT_CAMPAIGN);
  const malformedGrid = replaceRequired(
    html,
    'data-punch-grid-columns="2"',
    'data-punch-grid-columns="4"',
  );
  const oversizedImage = replaceRequired(html, 'width="520"', 'width="521"');
  const bodyStart = html.indexOf("<body");
  const bodyContent = html.indexOf(">", bodyStart) + 1;
  const extraImage = `${html.slice(0, bodyContent)}<img alt="Extra" data-punch-image-role="hero" src="https://quiet-relay.example.com/extra.jpg" style="height:auto;max-width:100%" width="520"/>${html.slice(bodyContent)}`;

  expect(
    checkOutcomes(SIX_PRODUCT_CAMPAIGN, malformedGrid)["grid-geometry"],
  ).toBe(false);
  expect(
    checkOutcomes(SIX_PRODUCT_CAMPAIGN, oversizedImage)["grid-geometry"],
  ).toBe(false);
  expect(checkOutcomes(SIX_PRODUCT_CAMPAIGN, extraImage)["grid-geometry"]).toBe(
    false,
  );
});

it("rejects extra, alternate, and spanning grid cells", async () => {
  const html = await renderCampaignHtml(SIX_PRODUCT_CAMPAIGN);
  const firstCell =
    '<td class="punch-mobile-column" data-punch-grid-column="product-02"';
  const extraCells = replaceRequired(
    html,
    firstCell,
    `<td></td><td></td><td></td>${firstCell}`,
  );
  const extraHeaderCell = replaceRequired(
    html,
    firstCell,
    `<th></th>${firstCell}`,
  );
  const spanningCell = replaceRequired(
    html,
    firstCell,
    '<td colspan="4" class="punch-mobile-column" data-punch-grid-column="product-02"',
  );
  const rowSpanningCell = replaceRequired(
    html,
    firstCell,
    '<td rowspan="2" class="punch-mobile-column" data-punch-grid-column="product-02"',
  );

  expect(checkOutcomes(SIX_PRODUCT_CAMPAIGN, extraCells)["grid-geometry"]).toBe(
    false,
  );
  expect(
    checkOutcomes(SIX_PRODUCT_CAMPAIGN, extraHeaderCell)["grid-geometry"],
  ).toBe(false);
  expect(
    checkOutcomes(SIX_PRODUCT_CAMPAIGN, spanningCell)["grid-geometry"],
  ).toBe(false);
  expect(
    checkOutcomes(SIX_PRODUCT_CAMPAIGN, rowSpanningCell)["grid-geometry"],
  ).toBe(false);
});
