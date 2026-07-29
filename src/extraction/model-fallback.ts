import type { BrandEvidence } from "../core/schemas/index.js";
import {
  callModel,
  isTextModelError,
  zeroModelUsage,
  type ModelRequest,
  type TextModel,
} from "../providers/index.js";
import type { ExtractionModelCall, SourceSegment } from "./contracts.js";
import { ExtractionError } from "./extraction-error.js";
import { BrandFallbackSchema } from "./model-fallback-schemas.js";
import { mergeBrandFallback } from "./model-fallback-support.js";
import { buildBrandVoiceRequest } from "./prompts/brand-voice.js";

const MODEL_TIMEOUT_MS = 30_000;

/** Applies optional model fallback only to unknown brand voice. */
export async function applyBrandFallback(
  evidence: BrandEvidence,
  segments: readonly SourceSegment[],
  model: TextModel | undefined,
  signal: AbortSignal,
  calls: ExtractionModelCall[],
): Promise<BrandEvidence> {
  if (!model || evidence.voice.state !== "unknown" || segments.length === 0) {
    return evidence;
  }
  const result = await callFallback(
    model,
    buildBrandVoiceRequest(segments, signal),
    calls,
  );
  const parsed = BrandFallbackSchema.safeParse(result);
  if (!parsed.success) {
    return evidence;
  }
  return mergeBrandFallback(evidence, parsed.data, segments);
}

/** Calls one safe model request and returns only parsed JSON-shaped data. */
async function callFallback(
  model: TextModel,
  request: ModelRequest,
  calls: ExtractionModelCall[],
): Promise<unknown> {
  let response: Awaited<ReturnType<typeof callModel>>;
  try {
    response = await callModel(model, request, MODEL_TIMEOUT_MS);
  } catch (error) {
    calls.push({
      stage: "extract-brand",
      usage:
        isTextModelError(error) && error.usage ? error.usage : zeroModelUsage(),
    });
    if (request.signal.aborted) {
      throw new ExtractionError("cancelled", false);
    }
    return undefined;
  }
  calls.push({ stage: "extract-brand", usage: response.usage });
  if (response.stopReason !== "complete") {
    return undefined;
  }
  try {
    return JSON.parse(response.text);
  } catch {
    return undefined;
  }
}
