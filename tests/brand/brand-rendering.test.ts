import { describe, expect, it } from "vitest";

import { resolveBrand } from "../../src/brand/resolve-brand.js";
import {
  BrandSettingsSchema,
  DEFAULT_BRAND_SETTINGS,
} from "../../src/brand/settings.js";
import {
  renderCampaign,
  restyleCampaign,
} from "../../src/core/render-campaign.js";
import { renderCampaignHtml } from "../../src/rendering/render-campaign-html.js";
import { validateRenderedCampaign } from "../../src/validation/render-validation.js";
import { FIXED_CAMPAIGN } from "../rendering/support.js";
import { CampaignSchema } from "../../src/core/schemas/campaign.js";
import six from "../fixtures/checkpoint-4/six-product.json" with { type: "json" };
import single from "../fixtures/checkpoint-4/single-product.json" with { type: "json" };

describe("brand settings and isolated rendering", () => {
  it.each([
    "red",
    "#abc",
    "#123456;background:red",
    "url(https://example.com)",
  ])("rejects unsafe or ambiguous colour %s", (colour) => {
    expect(
      BrandSettingsSchema.safeParse({ primaryColour: colour }).success,
    ).toBe(false);
  });

  it.each([
    "Arial; color:red",
    'A";background:url(x)',
    "var(--font)",
    "inherit",
    "A\u001b[31m",
  ])("rejects executable or control-bearing font %s", (font) => {
    expect(BrandSettingsSchema.safeParse({ bodyFont: font }).success).toBe(
      false,
    );
  });

  it("resolves manual, website and fallback slots separately", () => {
    const brand = resolveBrand(
      {
        primaryColour: {
          value: "#006644",
          confidence: "explicit",
          evidence: {
            url: "https://grove.example.com/",
            field: "styles.inline-01",
          },
        },
      },
      { bodyFont: "Verdana" },
    );
    expect(brand.sources).toEqual({
      primaryColour: "website",
      backgroundColour: "fallback",
      textColour: "fallback",
      headingFont: "fallback",
      bodyFont: "manual",
    });
    expect(brand.settings.primaryColour).toBe("#006644");
    expect(resolveBrand().settings).toEqual(DEFAULT_BRAND_SETTINGS);
  });

  it("preserves manual primary colours but refuses unreadable manual text", async () => {
    const html = await renderCampaignHtml(FIXED_CAMPAIGN, {
      primaryColour: "#FFFF00",
    });
    expect(html).toContain("background-color:#FFFF00");
    expect(validateRenderedCampaign(FIXED_CAMPAIGN, html).valid).toBe(true);
    expect(() =>
      resolveBrand({}, { backgroundColour: "#FFFFFF", textColour: "#EEEEEE" }),
    ).toThrow("4.5:1");
    const dark = resolveBrand({}, { backgroundColour: "#111111" });
    expect(dark.settings.textColour).toBe("#FFFFFF");
    expect(dark.warnings).toContain("text-contrast-fallback");
  });

  it("renders distinct brands concurrently without leaking colours or fonts", async () => {
    const before = JSON.stringify(FIXED_CAMPAIGN);
    const [blue, dark, baseline] = await Promise.all([
      renderCampaignHtml(FIXED_CAMPAIGN, {
        primaryColour: "#2563EB",
        headingFont: "Verdana",
      }),
      renderCampaignHtml(FIXED_CAMPAIGN, {
        primaryColour: "#F0ABFC",
        backgroundColour: "#111827",
        textColour: "#F9FAFB",
        headingFont: "Courier New",
      }),
      renderCampaignHtml(FIXED_CAMPAIGN),
    ]);
    expect(blue).toContain("#2563EB");
    expect(blue).not.toContain("#F0ABFC");
    expect(dark).toContain("#F0ABFC");
    expect(dark).not.toContain("#2563EB");
    expect(baseline).not.toContain("#F0ABFC");
    expect(blue).toContain("Verdana");
    expect(dark).toContain("Courier New");
    expect(await renderCampaignHtml(FIXED_CAMPAIGN)).toBe(baseline);
    expect(JSON.stringify(FIXED_CAMPAIGN)).toBe(before);
  });

  it.each([single, six])(
    "retains render checks across diverse light/dark palettes",
    async (fixture) => {
      const campaign = CampaignSchema.parse(fixture);
      for (const backgroundColour of [
        "#FFFFFF",
        "#101010",
        "#808080",
        "#FDF6E3",
      ]) {
        for (const primaryColour of [
          "#FFDD00",
          "#2563EB",
          "#000000",
          "#FFFFFF",
        ]) {
          const html = await renderCampaignHtml(campaign, {
            primaryColour,
            backgroundColour,
            bodyFont: "Verdana",
            headingFont: "Georgia",
          });
          expect(validateRenderedCampaign(campaign, html).valid).toBe(true);
        }
      }
    },
  );

  it("restyles identical copy with zero provider usage and explicit render-only scope", async () => {
    const result = await renderCampaign(FIXED_CAMPAIGN);
    const next = await restyleCampaign(result, { primaryColour: "#006644" });
    expect(next.campaign).toEqual(result.campaign);
    expect(next.html).not.toEqual(result.html);
    expect(next.usage.calls).toHaveLength(0);
    expect(next.validation.scope).toBe("render-only");
    expect(
      next.validation.checks.every((check) => check.id.startsWith("render-")),
    ).toBe(true);
  });
});
