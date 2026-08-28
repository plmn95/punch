import Anthropic, {
  APIConnectionError,
  APIConnectionTimeoutError,
  APIUserAbortError,
  AuthenticationError,
  BadRequestError,
  InternalServerError,
  PermissionDeniedError,
  RateLimitError,
  UnprocessableEntityError,
} from "@anthropic-ai/sdk";

import { TextModelError } from "./model-error.js";
import type {
  ModelRequest,
  ModelResponse,
  ModelStopReason,
  TextModel,
} from "./text-model.js";

export const DEFAULT_ANTHROPIC_MODEL = "claude-sonnet-5";

export type AnthropicProviderOptions = Readonly<{
  apiKey: string;
  model?: string;
}>;

/** Official configured provider accepted by the public Punch engine. */
export type PunchProvider = Readonly<{
  kind: "anthropic";
  modelId: string;
  textModel: TextModel;
}>;

/** Creates the only provider supported by Punch 0.1.0. */
export function createAnthropicProvider(
  options: AnthropicProviderOptions,
): PunchProvider {
  const apiKey = options.apiKey.trim();
  const modelId = options.model?.trim() || DEFAULT_ANTHROPIC_MODEL;
  if (apiKey.length === 0 || apiKey.length > 512) {
    throw new TypeError("A valid Anthropic API key is required.");
  }
  if (modelId.length === 0 || modelId.length > 200) {
    throw new TypeError("A valid Anthropic model ID is required.");
  }

  const client = new Anthropic({ apiKey, maxRetries: 0 });
  return {
    kind: "anthropic",
    modelId,
    textModel: createTextModel(client, modelId),
  };
}

/** Adapts the Anthropic Messages API to Punch's bounded text-model seam. */
function createTextModel(client: Anthropic, modelId: string): TextModel {
  return {
    async complete(request): Promise<ModelResponse> {
      try {
        const message = await client.messages.create(
          {
            model: modelId,
            max_tokens: request.maxOutputTokens,
            thinking: { type: "disabled" },
            system: request.system,
            messages: [{ role: "user", content: request.user }],
          },
          { signal: request.signal },
        );
        return {
          text: textContent(message.content, request),
          stopReason: stopReason(message.stop_reason),
          usage: {
            inputTokens: message.usage.input_tokens,
            outputTokens: message.usage.output_tokens,
            cacheReadInputTokens: message.usage.cache_read_input_tokens ?? 0,
            cacheWriteInputTokens:
              message.usage.cache_creation_input_tokens ?? 0,
          },
        };
      } catch (error) {
        throw providerError(error, request);
      }
    },
  };
}

/** Joins only text blocks and rejects every unsupported response shape. */
function textContent(
  content: Anthropic.Messages.ContentBlock[],
  request: ModelRequest,
): string {
  const text = content.flatMap((block) =>
    block.type === "text" ? [block.text] : [],
  );
  if (content.length === 0 || text.length !== content.length) {
    throw modelError("protocol", false, request);
  }
  return text.join("");
}

/** Maps Anthropic stop reasons to the provider-neutral contract. */
function stopReason(
  reason: Anthropic.Messages.StopReason | null,
): ModelStopReason {
  if (reason === "end_turn" || reason === "stop_sequence") {
    return "complete";
  }
  if (reason === "max_tokens" || reason === "model_context_window_exceeded") {
    return "max-output";
  }
  return reason === "refusal" ? "refusal" : "unknown";
}

/** Converts SDK errors without retaining provider messages or payloads. */
function providerError(error: unknown, request: ModelRequest): TextModelError {
  if (error instanceof TextModelError) {
    return error;
  }
  if (error instanceof APIUserAbortError || request.signal.aborted) {
    return modelError("cancelled", false, request);
  }
  if (error instanceof APIConnectionTimeoutError) {
    return modelError("timeout", true, request);
  }
  if (error instanceof AuthenticationError) {
    return modelError("authentication", false, request);
  }
  if (error instanceof PermissionDeniedError) {
    return modelError("permission", false, request);
  }
  if (error instanceof RateLimitError) {
    return modelError("rate-limit", true, request);
  }
  if (
    error instanceof BadRequestError ||
    error instanceof UnprocessableEntityError
  ) {
    return modelError("request-rejected", false, request);
  }
  if (
    error instanceof InternalServerError ||
    error instanceof APIConnectionError
  ) {
    return modelError("unavailable", true, request);
  }
  return modelError("unknown", false, request);
}

/** Builds one safe provider-neutral error for the active request. */
function modelError(
  code: ConstructorParameters<typeof TextModelError>[0]["code"],
  retryable: boolean,
  request: ModelRequest,
): TextModelError {
  return new TextModelError({
    code,
    retryable,
    stage: request.stage,
    attempt: request.attempt,
  });
}
