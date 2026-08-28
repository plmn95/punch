import type {
  BrandEvidence,
  Campaign,
  GenerateCampaignInput,
  ProductEvidence,
} from "./schemas/index.js";
import {
  runCampaignPipeline,
  type CampaignPipelineRun,
} from "./run-campaign-pipeline.js";
import type { PunchProvider } from "../providers/anthropic.js";
import { renderCampaignHtml } from "../rendering/index.js";
import { validateRenderedCampaign } from "../validation/index.js";
import type { GenerationUsage } from "../providers/index.js";
import type { BrandReviewer, ResolvedBrand } from "../brand/settings.js";

export type GenerateCampaignOptions = Readonly<{
  reviewBrand?: BrandReviewer;
  provider: PunchProvider;
  signal?: AbortSignal;
  trace?: boolean;
  callTimeoutMs?: number;
  runTimeoutMs?: number;
}>;

export type CampaignValidation = Readonly<{
  scope?: "generation-and-render" | "render-only";
  valid: true;
  checks: ReadonlyArray<Readonly<{ id: string; passed: true }>>;
}>;

export type CampaignTrace = Readonly<{
  brandProfile: BrandEvidence;
  productProfiles: readonly ProductEvidence[];
  draft: Campaign;
  critique: unknown;
  revisedCampaign?: Campaign;
  promptVersions: Readonly<Record<string, string>>;
}>;

export type GenerateCampaignResult = Readonly<{
  brand?: ResolvedBrand;
  campaign: Campaign;
  html: string;
  validation: CampaignValidation;
  usage: GenerationUsage;
  trace?: CampaignTrace;
}>;

/** Generates and validates one grounded standalone ecommerce email. */
export async function generateCampaign(
  input: GenerateCampaignInput,
  options: GenerateCampaignOptions,
): Promise<GenerateCampaignResult> {
  const run = await runCampaignPipeline(input, {
    ...(options.reviewBrand ? { reviewBrand: options.reviewBrand } : {}),
    model: options.provider.textModel,
    ...(options.signal ? { signal: options.signal } : {}),
    ...(options.callTimeoutMs !== undefined
      ? { generationCallTimeoutMs: options.callTimeoutMs }
      : {}),
    ...(options.runTimeoutMs !== undefined
      ? { generationRunTimeoutMs: options.runTimeoutMs }
      : {}),
  });
  const campaign = run.generation.finalCampaign;
  const html = await renderCampaignHtml(
    campaign,
    run.extraction.brand?.settings,
  );
  const rendered = validateRenderedCampaign(campaign, html);
  const checks = [
    { id: "campaign-grounding", passed: true as const },
    { id: "campaign-claims", passed: true as const },
    ...rendered.checks.map((check) => ({
      id: `render-${check.id}`,
      passed: true as const,
    })),
  ];

  return {
    campaign,
    ...(run.extraction.brand ? { brand: run.extraction.brand } : {}),
    html,
    validation: { valid: true, scope: "generation-and-render", checks },
    usage: run.generation.usage,
    ...(options.trace ? { trace: campaignTrace(run) } : {}),
  };
}

/** Selects only the approved redacted fields for an opt-in generation trace. */
function campaignTrace(run: CampaignPipelineRun): CampaignTrace {
  return {
    brandProfile: run.extraction.context.brand,
    productProfiles: run.extraction.context.products,
    draft: run.generation.draft,
    critique: run.generation.critique,
    ...(run.generation.revisedCampaign
      ? { revisedCampaign: run.generation.revisedCampaign }
      : {}),
    promptVersions: run.generation.promptVersions,
  };
}
