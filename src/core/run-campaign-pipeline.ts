import {
  extractGenerationContext,
  type ExtractionResult,
} from "../extraction/index.js";
import { runGeneration, type GenerationRun } from "../generation/index.js";
import type { TextModel } from "../providers/index.js";
import type { PublicFetchSession } from "../extraction/http/index.js";

/** Internal dependencies for extraction followed by semantic generation. */
export type CampaignPipelineOptions = Readonly<{
  model: TextModel;
  signal?: AbortSignal;
  fetchSession?: PublicFetchSession;
  generationCallTimeoutMs?: number;
  generationRunTimeoutMs?: number;
}>;

/** Extraction evidence and semantic generation from one shared model/signal. */
export type CampaignPipelineRun = Readonly<{
  extraction: ExtractionResult;
  generation: GenerationRun;
}>;

/** Extracts one explicit URL set, then runs the existing generation engine. */
export async function runCampaignPipeline(
  input: unknown,
  options: CampaignPipelineOptions,
): Promise<CampaignPipelineRun> {
  const signal = options.signal ?? new AbortController().signal;
  const extraction = await extractGenerationContext(input, {
    model: options.model,
    signal,
    ...(options.fetchSession ? { fetchSession: options.fetchSession } : {}),
  });
  const generation = await runGeneration(extraction.context, {
    model: options.model,
    signal,
    ...(options.generationCallTimeoutMs !== undefined
      ? { callTimeoutMs: options.generationCallTimeoutMs }
      : {}),
    ...(options.generationRunTimeoutMs !== undefined
      ? { runTimeoutMs: options.generationRunTimeoutMs }
      : {}),
  });
  return { extraction, generation };
}
