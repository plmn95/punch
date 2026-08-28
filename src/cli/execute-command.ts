import { z } from "zod";

import { ResolvedBrandSchema } from "../brand/settings.js";
import {
  generateCampaign,
  type GenerateCampaignResult,
} from "../core/generate-campaign.js";
import { renderCampaign } from "../core/render-campaign.js";
import { CampaignSchema } from "../core/schemas/campaign.js";
import {
  assertOutputAvailable,
  writeCampaignOutput,
} from "../output/write-output.js";
import { createAnthropicProvider } from "../providers/anthropic.js";
import type { GenerateCommand, RenderCommand } from "./arguments.js";
import { CliArgumentError } from "./cli-error.js";
import { editBrand } from "./guide-brand.js";
import { confirm, type CliIo } from "./io.js";
import {
  readBrandProfile,
  readLocalJson,
  saveBrandProfile,
} from "./local-files.js";
import { reviewResult } from "./preview-result.js";

const SavedCampaignSchema = z.object({
  generator: z.literal("punch"),
  campaign: CampaignSchema,
  brand: ResolvedBrandSchema.optional(),
});

/** Executes a validated command with optional human review around the unchanged engine. */
export async function executeCommand(
  command: GenerateCommand | RenderCommand,
  io: CliIo,
  guided: boolean,
): Promise<string> {
  await assertOutputAvailable(command.output, command.force);
  const initial =
    command.kind === "generate"
      ? await generate(command, io, guided)
      : await renderSaved(command);
  const reviewed = guided
    ? await reviewResult(io, initial)
    : { result: initial };
  if (io.signal.aborted)
    throw new CliArgumentError("cancelled", "Cancelled before saving.");
  const output = await writeCampaignOutput(reviewed.result, command.output, {
    force: command.force,
  });
  const profile =
    reviewed.saveBrandPath === undefined
      ? command.saveBrandPath
      : reviewed.saveBrandPath;
  if (profile && reviewed.result.brand) {
    try {
      await saveBrandProfile(profile, reviewed.result.brand.settings);
    } catch {
      throw new CliArgumentError(
        "invalid-file",
        `Campaign saved in ${output}, but the profile could not be saved. Choose a new profile filename.`,
      );
    }
  }
  return output;
}

/** Runs generation only after credentials exist and the guided brand review is confirmed. */
async function generate(
  command: GenerateCommand,
  io: CliIo,
  guided: boolean,
): Promise<GenerateCampaignResult> {
  const apiKey = io.env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey)
    throw new CliArgumentError(
      "missing-arguments",
      "ANTHROPIC_API_KEY is required.",
    );
  const profile = command.brandPath
    ? await readBrandProfile(command.brandPath)
    : {};
  return generateCampaign(
    { ...command.input, brand: { ...profile, ...command.input.brand } },
    {
      provider: createAnthropicProvider({ apiKey }),
      signal: io.signal,
      trace: command.trace,
      ...(guided
        ? {
            reviewBrand: async (brand) => {
              const changes = await editBrand(io, brand);
              await confirm(io, "Generate this campaign using AI?");
              io.stderr("Generating and validating the campaign…\n");
              return changes;
            },
          }
        : {}),
    },
  );
}

/** Loads semantic content and saved settings but does not trust prior validation claims. */
async function renderSaved(
  command: RenderCommand,
): Promise<GenerateCampaignResult> {
  const data = await readLocalJson(command.campaignPath, 1_000_000);
  const saved = SavedCampaignSchema.safeParse(data);
  const campaign = saved.success
    ? saved.data.campaign
    : CampaignSchema.parse(data);
  const profile = command.brandPath
    ? await readBrandProfile(command.brandPath)
    : {};
  return renderCampaign(campaign, {
    ...(saved.success ? saved.data.brand?.settings : {}),
    ...profile,
    ...command.brand,
  });
}
