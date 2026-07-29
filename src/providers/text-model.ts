/** Semantic generation stages understood by the internal model seam. */
export type GenerationStage = "emit" | "critique" | "revise";

/** Source-extraction stages understood by the internal model seam. */
export type ExtractionStage = "extract-brand";

/** Every bounded semantic stage supported by one configured text model. */
export type ModelStage = GenerationStage | ExtractionStage;

/** Attempt kind within one semantic generation stage. */
export type ModelAttempt = "primary" | "repair";

/** Provider-neutral reason why text generation stopped. */
export type ModelStopReason = "complete" | "max-output" | "refusal" | "unknown";

/** Normalised token usage returned by a completed model call. */
export type ModelUsage = Readonly<{
  inputTokens: number;
  outputTokens: number;
  cacheReadInputTokens: number;
  cacheWriteInputTokens: number;
}>;

/** Provider-neutral request passed to the injected text model. */
export type ModelRequest = Readonly<{
  stage: ModelStage;
  attempt: ModelAttempt;
  promptVersion: string;
  system: string;
  user: string;
  maxOutputTokens: number;
  signal: AbortSignal;
}>;

/** Provider-neutral response returned by a completed model call. */
export type ModelResponse = Readonly<{
  text: string;
  stopReason: ModelStopReason;
  usage: ModelUsage;
}>;

/** Small internal seam implemented by configured model adapters and test fakes. */
export interface TextModel {
  complete(request: ModelRequest): Promise<ModelResponse>;
}
