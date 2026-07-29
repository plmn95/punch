import {
  isTextModelError,
  normaliseProviderUsage,
  TextModelError,
} from "../providers/index.js";
import type {
  ModelRequest,
  ModelResponse,
  TextModel,
} from "../providers/index.js";
import { createLinkedDeadline, throwIfModelAborted } from "./abort.js";

const MAX_MODEL_RESPONSE_BYTES = 128_000;
const STOP_REASONS = new Set(["complete", "max-output", "refusal", "unknown"]);

/** Completes one request under a call deadline and validates its envelope. */
export async function callModel(
  model: TextModel,
  request: ModelRequest,
  callTimeoutMs: number,
): Promise<ModelResponse> {
  throwIfModelAborted(request.signal, request.stage, request.attempt);
  const deadline = createLinkedDeadline(request.signal, callTimeoutMs, "call");
  const timedRequest = { ...request, signal: deadline.signal };

  try {
    const response = await raceWithAbort(
      model.complete(timedRequest),
      timedRequest,
    );
    throwIfModelAborted(deadline.signal, request.stage, request.attempt);
    return normaliseResponse(response, request);
  } catch (error) {
    throw normaliseFailure(error, deadline.signal, request);
  } finally {
    deadline.dispose();
  }
}

/** Races a provider promise with its linked abort signal. */
async function raceWithAbort(
  completion: Promise<ModelResponse>,
  request: ModelRequest,
): Promise<ModelResponse> {
  let rejectAbort: (() => void) | undefined;
  const aborted = new Promise<never>((_resolve, reject) => {
    rejectAbort = () => {
      try {
        throwIfModelAborted(request.signal, request.stage, request.attempt);
      } catch (error) {
        reject(error);
      }
    };
    request.signal.addEventListener("abort", rejectAbort, { once: true });
    if (request.signal.aborted) {
      rejectAbort();
    }
  });

  try {
    return await Promise.race([completion, aborted]);
  } finally {
    if (rejectAbort) {
      request.signal.removeEventListener("abort", rejectAbort);
    }
  }
}

/** Validates text, stop reason and usage before response processing. */
function normaliseResponse(
  response: ModelResponse,
  request: ModelRequest,
): ModelResponse {
  if (
    typeof response !== "object" ||
    response === null ||
    typeof response.text !== "string" ||
    exceedsResponseByteLimit(response.text) ||
    !STOP_REASONS.has(response.stopReason)
  ) {
    throw protocolError(request);
  }

  try {
    const usage = normaliseProviderUsage(response.usage);
    return {
      text: response.text,
      stopReason: response.stopReason,
      usage,
    };
  } catch {
    throw protocolError(request);
  }
}

/** Checks exact UTF-8 bytes without first encoding an oversized string. */
function exceedsResponseByteLimit(text: string): boolean {
  if (text.length > MAX_MODEL_RESPONSE_BYTES) {
    return true;
  }
  return new TextEncoder().encode(text).byteLength > MAX_MODEL_RESPONSE_BYTES;
}

/** Converts unknown provider failures into fixed safe categories. */
function normaliseFailure(
  error: unknown,
  signal: AbortSignal,
  request: ModelRequest,
): TextModelError {
  if (signal.aborted) {
    try {
      throwIfModelAborted(signal, request.stage, request.attempt);
    } catch (abortError) {
      if (isTextModelError(abortError)) {
        return new TextModelError({
          code: abortError.code,
          retryable: abortError.retryable,
          stage: request.stage,
          attempt: request.attempt,
          ...safeProviderErrorUsage(error),
        });
      }
      return protocolError(request);
    }
  }
  if (isTextModelError(error)) {
    return new TextModelError({
      code: error.code,
      retryable: error.retryable,
      stage: request.stage,
      attempt: request.attempt,
      ...safeProviderErrorUsage(error),
    });
  }
  return new TextModelError({
    code: "unknown",
    retryable: false,
    stage: request.stage,
    attempt: request.attempt,
  });
}

/** Returns bounded provider-error usage without trusting adapter metadata. */
function safeProviderErrorUsage(
  error: unknown,
): Readonly<{ usage?: ModelResponse["usage"] }> {
  if (!isTextModelError(error) || !error.usage) {
    return {};
  }
  try {
    return { usage: normaliseProviderUsage(error.usage) };
  } catch {
    return {};
  }
}

/** Creates a safe provider-protocol error for one request. */
function protocolError(request: ModelRequest): TextModelError {
  return new TextModelError({
    code: "protocol",
    retryable: false,
    stage: request.stage,
    attempt: request.attempt,
  });
}
