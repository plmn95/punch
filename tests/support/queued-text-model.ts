import type {
  ModelRequest,
  ModelResponse,
  ModelUsage,
  TextModel,
} from "../../src/providers/index.js";

type QueuedResult =
  | ModelResponse
  | Error
  | ((request: ModelRequest) => ModelResponse | Promise<ModelResponse>);

const DEFAULT_USAGE: ModelUsage = {
  inputTokens: 11,
  outputTokens: 7,
  cacheReadInputTokens: 0,
  cacheWriteInputTokens: 0,
};

/** Builds one complete provider response for deterministic engine tests. */
export function modelResponse(
  text: string,
  usage: ModelUsage = DEFAULT_USAGE,
): ModelResponse {
  return {
    text,
    stopReason: "complete",
    usage,
  };
}

/** Records requests and returns queued deterministic model outcomes. */
export class QueuedTextModel implements TextModel {
  readonly requests: ModelRequest[] = [];
  readonly #results: QueuedResult[];

  constructor(results: readonly QueuedResult[]) {
    this.#results = [...results];
  }

  /** Returns the next queued outcome and records the complete request. */
  async complete(request: ModelRequest): Promise<ModelResponse> {
    this.requests.push(request);
    const result = this.#results.shift();

    if (!result) {
      throw new Error("The test model response queue is empty.");
    }

    if (result instanceof Error) {
      throw result;
    }

    if (typeof result === "function") {
      return result(request);
    }

    return result;
  }

  /** Reports how many prepared outcomes were not consumed. */
  get remaining(): number {
    return this.#results.length;
  }
}

/** Returns only when the model request receives cancellation. */
export function waitForAbort(request: ModelRequest): Promise<ModelResponse> {
  return new Promise((_, reject) => {
    if (request.signal.aborted) {
      reject(request.signal.reason);
      return;
    }

    request.signal.addEventListener(
      "abort",
      () => {
        reject(request.signal.reason);
      },
      { once: true },
    );
  });
}
