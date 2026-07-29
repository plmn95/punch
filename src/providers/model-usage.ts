import type {
  GenerationStage,
  ModelAttempt,
  ModelUsage,
} from "./text-model.js";

/** Usage attributed to one completed provider response. */
export type ModelCallUsage = Readonly<{
  stage: GenerationStage;
  attempt: ModelAttempt;
  usage: ModelUsage;
}>;

/** Aggregated usage for one semantic generation run. */
export type GenerationUsage = Readonly<{
  total: ModelUsage;
  byStage: Readonly<Record<GenerationStage, ModelUsage>>;
  calls: readonly ModelCallUsage[];
}>;

const ZERO_USAGE: ModelUsage = Object.freeze({
  inputTokens: 0,
  outputTokens: 0,
  cacheReadInputTokens: 0,
  cacheWriteInputTokens: 0,
});

const MAX_PROVIDER_TOKEN_COUNT = 1_000_000_000;

/** Returns a zeroed immutable usage value. */
export function zeroModelUsage(): ModelUsage {
  return ZERO_USAGE;
}

/** Adds two normalised usage values with safe-integer checks. */
export function addModelUsage(left: ModelUsage, right: ModelUsage): ModelUsage {
  return {
    inputTokens: addSafe(left.inputTokens, right.inputTokens),
    outputTokens: addSafe(left.outputTokens, right.outputTokens),
    cacheReadInputTokens: addSafe(
      left.cacheReadInputTokens,
      right.cacheReadInputTokens,
    ),
    cacheWriteInputTokens: addSafe(
      left.cacheWriteInputTokens,
      right.cacheWriteInputTokens,
    ),
  };
}

/** Validates provider usage before it enters run accounting. */
export function normaliseModelUsage(usage: ModelUsage): ModelUsage {
  return {
    inputTokens: normaliseCount(usage.inputTokens),
    outputTokens: normaliseCount(usage.outputTokens),
    cacheReadInputTokens: normaliseCount(usage.cacheReadInputTokens),
    cacheWriteInputTokens: normaliseCount(usage.cacheWriteInputTokens),
  };
}

/** Validates provider usage against safe integers and plausible call bounds. */
export function normaliseProviderUsage(usage: ModelUsage): ModelUsage {
  const normalised = normaliseModelUsage(usage);
  if (
    Object.values(normalised).some((count) => count > MAX_PROVIDER_TOKEN_COUNT)
  ) {
    throw new RangeError("Provider usage exceeds the supported call bound.");
  }
  return normalised;
}

/** Aggregates every completed call by stage and for the whole run. */
export function aggregateModelUsage(
  calls: readonly ModelCallUsage[],
): GenerationUsage {
  const byStage: Record<GenerationStage, ModelUsage> = {
    emit: ZERO_USAGE,
    critique: ZERO_USAGE,
    revise: ZERO_USAGE,
  };

  for (const call of calls) {
    byStage[call.stage] = addModelUsage(byStage[call.stage], call.usage);
  }

  return {
    total: Object.values(byStage).reduce(addModelUsage, ZERO_USAGE),
    byStage,
    calls: [...calls],
  };
}

/** Adds safe non-negative integer token counts without losing precision. */
function addSafe(left: number, right: number): number {
  const sum = normaliseCount(left) + normaliseCount(right);
  if (!Number.isSafeInteger(sum)) {
    throw new RangeError(
      "Model usage exceeds the supported safe-integer range.",
    );
  }
  return sum;
}

/** Rejects malformed provider token counts. */
function normaliseCount(value: number): number {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new RangeError("Model usage must be a non-negative safe integer.");
  }
  return value;
}
