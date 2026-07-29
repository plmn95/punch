import type { ModelStage, ModelAttempt, ModelUsage } from "./text-model.js";

/** Safe provider-neutral failure categories. */
export type ModelErrorCode =
  | "authentication"
  | "permission"
  | "rate-limit"
  | "timeout"
  | "unavailable"
  | "request-rejected"
  | "cancelled"
  | "protocol"
  | "unknown";

/** Structured metadata that is safe to expose outside the provider adapter. */
export type ModelErrorDetails = Readonly<{
  code: ModelErrorCode;
  retryable: boolean;
  stage?: ModelStage;
  attempt?: ModelAttempt;
  usage?: ModelUsage;
}>;

const SAFE_MESSAGES: Readonly<Record<ModelErrorCode, string>> = {
  authentication: "The model provider could not authenticate.",
  permission: "The model provider denied this request.",
  "rate-limit": "The model provider is temporarily rate limited.",
  timeout: "The model provider did not respond before the deadline.",
  unavailable: "The model provider is temporarily unavailable.",
  "request-rejected": "The model provider rejected this request.",
  cancelled: "Generation was cancelled.",
  protocol: "The model provider returned an unsupported response.",
  unknown: "The model provider request failed.",
};

/** Error adapters throw without preserving raw provider messages or payloads. */
export class TextModelError extends Error {
  readonly code: ModelErrorCode;
  readonly retryable: boolean;
  readonly stage: ModelStage | undefined;
  readonly attempt: ModelAttempt | undefined;
  readonly usage: ModelUsage | undefined;

  constructor(details: ModelErrorDetails) {
    super(SAFE_MESSAGES[details.code]);
    this.name = "TextModelError";
    this.code = details.code;
    this.retryable = details.retryable;
    this.stage = details.stage;
    this.attempt = details.attempt;
    this.usage = details.usage;
  }
}

/** Returns a safe cancellation error for the current model request. */
export function modelCancelled(
  stage: ModelStage,
  attempt: ModelAttempt,
): TextModelError {
  return new TextModelError({
    code: "cancelled",
    retryable: false,
    stage,
    attempt,
  });
}

/** Tests whether an unknown value is a provider-neutral model error. */
export function isTextModelError(error: unknown): error is TextModelError {
  return error instanceof TextModelError;
}
