import type {
  GenerationStage,
  GenerationUsage,
  ModelAttempt,
  ModelErrorCode,
  ModelUsage,
} from "../providers/index.js";
import {
  aggregateModelUsage,
  isTextModelError,
  normaliseProviderUsage,
} from "../providers/index.js";

/** Stable generation-engine failure categories. */
export type GenerationErrorCode =
  | "invalid-context"
  | "invalid-model-output"
  | "provider-failure"
  | "timeout"
  | "cancelled"
  | "generation-invariant";

/** Safe metadata recorded for a generation failure. */
export type GenerationErrorDetails = Readonly<{
  code: GenerationErrorCode;
  retryable: boolean;
  usage: GenerationUsage;
  stage?: GenerationStage;
  attempt?: ModelAttempt;
  providerCode?: ModelErrorCode;
}>;

const SAFE_MESSAGES: Readonly<Record<GenerationErrorCode, string>> = {
  "invalid-context": "The generation context is invalid.",
  "invalid-model-output": "The model returned an invalid structured result.",
  "provider-failure": "The model provider request failed.",
  timeout: "Generation did not finish before the deadline.",
  cancelled: "Generation was cancelled.",
  "generation-invariant": "Generation could not satisfy its required contract.",
};

/** Safe engine error that excludes prompts, responses, evidence and raw causes. */
export class GenerationError extends Error {
  readonly code: GenerationErrorCode;
  readonly retryable: boolean;
  readonly usage: GenerationUsage;
  readonly stage: GenerationStage | undefined;
  readonly attempt: ModelAttempt | undefined;
  readonly providerCode: ModelErrorCode | undefined;

  constructor(details: GenerationErrorDetails) {
    super(SAFE_MESSAGES[details.code]);
    this.name = "GenerationError";
    this.code = details.code;
    this.retryable = details.retryable;
    this.usage = details.usage;
    this.stage = details.stage;
    this.attempt = details.attempt;
    this.providerCode = details.providerCode;
  }
}

/** Converts one safe internal failure into an engine error with current usage. */
export function toGenerationError(
  error: unknown,
  usage: GenerationUsage,
): GenerationError {
  if (error instanceof GenerationError) {
    return copyGenerationError(error, usage);
  }
  if (isTextModelError(error)) {
    return fromModelError(error, usageWithModelError(error, usage));
  }
  return new GenerationError({
    code: "generation-invariant",
    retryable: false,
    usage,
  });
}

/** Copies a safe engine error while replacing its accumulated usage. */
function copyGenerationError(
  error: GenerationError,
  usage: GenerationUsage,
): GenerationError {
  return new GenerationError({
    code: error.code,
    retryable: error.retryable,
    usage,
    ...(error.stage ? { stage: error.stage } : {}),
    ...(error.attempt ? { attempt: error.attempt } : {}),
    ...(error.providerCode ? { providerCode: error.providerCode } : {}),
  });
}

/** Maps provider-neutral model errors to stable engine categories. */
function fromModelError(
  error: {
    code: ModelErrorCode;
    retryable: boolean;
    stage: GenerationStage | undefined;
    attempt: ModelAttempt | undefined;
    usage: ModelUsage | undefined;
  },
  usage: GenerationUsage,
): GenerationError {
  const code =
    error.code === "cancelled"
      ? "cancelled"
      : error.code === "timeout"
        ? "timeout"
        : "provider-failure";
  return new GenerationError({
    code,
    retryable: error.retryable,
    usage,
    providerCode: error.code,
    ...(error.stage ? { stage: error.stage } : {}),
    ...(error.attempt ? { attempt: error.attempt } : {}),
  });
}

/** Adds safe provider-error usage when its stage and attempt are known. */
function usageWithModelError(
  error: {
    stage: GenerationStage | undefined;
    attempt: ModelAttempt | undefined;
    usage: ModelUsage | undefined;
  },
  usage: GenerationUsage,
): GenerationUsage {
  if (!error.stage || !error.attempt || !error.usage) {
    return usage;
  }
  try {
    return aggregateModelUsage([
      ...usage.calls,
      {
        stage: error.stage,
        attempt: error.attempt,
        usage: normaliseProviderUsage(error.usage),
      },
    ]);
  } catch {
    return usage;
  }
}
