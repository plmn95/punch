import { resolveBrand } from "../brand/resolve-brand.js";
import {
  BRAND_KEYS,
  parseBrandSettings,
  type BrandSettings,
} from "../brand/settings.js";
import { aggregateModelUsage } from "../providers/model-usage.js";
import { renderCampaignHtml } from "../rendering/render-campaign-html.js";
import { validateRenderedCampaign } from "../validation/render-validation.js";
import type { GenerateCampaignResult } from "./generate-campaign.js";
import { CampaignSchema } from "./schemas/campaign.js";

/** Renders existing semantic content without a model, network fetch, or grounding claim. */
export async function renderCampaign(
  input: unknown,
  settings: BrandSettings = {},
): Promise<GenerateCampaignResult> {
  const campaign = CampaignSchema.parse(input);
  const brand = resolveBrand({}, settings);
  const html = await renderCampaignHtml(campaign, brand.settings);
  const rendered = validateRenderedCampaign(campaign, html);
  return {
    campaign,
    brand,
    html,
    validation: {
      valid: true,
      scope: "render-only",
      checks: rendered.checks.map((check) => ({
        id: `render-${check.id}`,
        passed: true,
      })),
    },
    usage: aggregateModelUsage([]),
  };
}

/** Restyles the same in-memory generated campaign, retaining its generation proof and usage. */
export async function restyleCampaign(
  result: GenerateCampaignResult,
  settings: BrandSettings,
): Promise<GenerateCampaignResult> {
  const changes = parseBrandSettings(settings);
  const rendered = await renderCampaign(result.campaign, {
    ...result.brand?.settings,
    ...changes,
  });
  if (rendered.brand && result.brand) {
    for (const key of BRAND_KEYS) {
      if (changes[key] === undefined)
        rendered.brand.sources[key] = result.brand.sources[key];
    }
  }
  return {
    ...result,
    html: rendered.html,
    brand: rendered.brand!,
    validation: {
      ...result.validation,
      checks: [
        ...result.validation.checks.filter(
          (check) => !check.id.startsWith("render-"),
        ),
        ...rendered.validation.checks,
      ],
    },
  };
}
