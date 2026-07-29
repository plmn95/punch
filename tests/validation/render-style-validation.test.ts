import { expect, it } from "vitest";

import {
  contrastRatio,
  stylePixels,
  validateRenderStyles,
} from "../../src/validation/render-style-validation.js";
import { renderCampaignHtml } from "../../src/rendering/index.js";
import {
  SINGLE_PRODUCT_CAMPAIGN,
  SIX_PRODUCT_CAMPAIGN,
} from "../rendering/checkpoint-4-support.js";

it("passes the exported renderer's real contrast, type, and CTA styles", async () => {
  const html = await renderCampaignHtml(SINGLE_PRODUCT_CAMPAIGN);

  expect(validateRenderStyles(html)).toEqual({
    contrast: true,
    ctaHeight: true,
    fontFloor: true,
  });
});

it("rejects final HTML with low contrast, small text, or a short CTA", async () => {
  const html = await renderCampaignHtml(SINGLE_PRODUCT_CAMPAIGN);
  const lowContrast = html.replace(
    "color:#2f251f;font-family:Georgia",
    "color:#f8f3ed;font-family:Georgia",
  );
  const smallText = html.replace("font-size:22px", "font-size:10px");
  const darkBackground = html.replace(
    "background-color:#f8f3ed",
    "background-color:#2f251f",
  );
  const unmarkedText = html.replace(' data-punch-text-role="product-name"', "");
  const smallResponsiveText = html.replace(
    "font-size: 32px !important",
    "font-size: 8px !important",
  );
  const unsupportedResponsiveText = html.replace(
    "font-size: 32px !important",
    "font-size: 0.5rem !important",
  );
  const responsiveFontShorthand = html.replace(
    "font-size: 32px !important",
    "font: 0.5rem Georgia !important",
  );
  const shortCta = html.replace(
    "line-height:20px;min-height:48px;padding:14px 22px",
    "line-height:20px;min-height:30px;padding:4px 22px",
  );
  const unmarkedCta = html.replace(' data-punch-role="cta"', "");
  const mislabelledCta = shortCta.replace(
    'data-punch-text-role="button"',
    'data-punch-text-role="image-link"',
  );

  expect(validateRenderStyles(lowContrast).contrast).toBe(false);
  expect(validateRenderStyles(darkBackground).contrast).toBe(false);
  expect(validateRenderStyles(unmarkedText).contrast).toBe(false);
  expect(validateRenderStyles(unmarkedText).fontFloor).toBe(false);
  expect(validateRenderStyles(smallText).fontFloor).toBe(false);
  expect(validateRenderStyles(smallResponsiveText).fontFloor).toBe(false);
  expect(validateRenderStyles(unsupportedResponsiveText).fontFloor).toBe(false);
  expect(validateRenderStyles(responsiveFontShorthand).fontFloor).toBe(false);
  expect(validateRenderStyles(shortCta).ctaHeight).toBe(false);
  expect(validateRenderStyles(unmarkedCta).ctaHeight).toBe(false);
  expect(validateRenderStyles(mislabelledCta).ctaHeight).toBe(false);
});

it("rejects a product heading masquerading as a non-text role", async () => {
  const html = await renderCampaignHtml(SIX_PRODUCT_CAMPAIGN);
  const mislabelledProduct = html
    .replace(
      'data-punch-product-name-for="product-01" data-punch-text-role="product-name"',
      'data-punch-product-name-for="product-01" data-punch-text-role="image-link"',
    )
    .replace(
      "color:#2f251f;font-family:Georgia, &quot;Times New Roman&quot;, serif;font-size:22px",
      "color:#fffdf9;font-family:Georgia, &quot;Times New Roman&quot;, serif;font-size:5px",
    );

  expect(validateRenderStyles(mislabelledProduct).contrast).toBe(false);
  expect(validateRenderStyles(mislabelledProduct).fontFloor).toBe(false);
});

it("computes WCAG ratios for opaque six-digit colours", () => {
  expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 5);
  expect(contrastRatio("#777777", "#ffffff")).toBeCloseTo(4.478, 3);
  expect(contrastRatio("#fff", "#ffffff")).toBeUndefined();
  expect(contrastRatio("transparent", "#ffffff")).toBeUndefined();
});

it("accepts only non-negative numeric or pixel style values", () => {
  expect(stylePixels(44)).toBe(44);
  expect(stylePixels("14.5px")).toBe(14.5);
  expect(stylePixels(-1)).toBeUndefined();
  expect(stylePixels("14rem")).toBeUndefined();
});
