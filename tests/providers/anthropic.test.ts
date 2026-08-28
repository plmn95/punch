import { afterEach, describe, expect, it, vi } from "vitest";

import { createAnthropicProvider } from "../../src/providers/anthropic.js";

afterEach(() => vi.unstubAllGlobals());

/** Creates one model request with fictional content and no secrets. */
function request() {
  return {
    stage: "emit" as const,
    attempt: "primary" as const,
    promptVersion: "test",
    system: "Return JSON.",
    user: "Create a fictional cup campaign.",
    maxOutputTokens: 200,
    signal: new AbortController().signal,
  };
}

describe("Anthropic provider adapter", () => {
  it("normalises text, stop reason and token usage", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (_input: string | URL | Request, init?: RequestInit) => {
        const body = JSON.parse(String(init?.body)) as {
          thinking?: unknown;
        };
        expect(body.thinking).toEqual({ type: "disabled" });
        return new Response(
          JSON.stringify({
            id: "msg_test",
            type: "message",
            role: "assistant",
            model: "claude-sonnet-5",
            content: [{ type: "text", text: '{"ok":true}' }],
            stop_reason: "end_turn",
            stop_sequence: null,
            usage: {
              input_tokens: 12,
              output_tokens: 6,
              cache_creation_input_tokens: null,
              cache_read_input_tokens: null,
            },
          }),
          { status: 200, headers: { "content-type": "application/json" } },
        );
      }),
    );
    const provider = createAnthropicProvider({ apiKey: "fictional-test-key" });

    await expect(provider.textModel.complete(request())).resolves.toEqual({
      text: '{"ok":true}',
      stopReason: "complete",
      usage: {
        inputTokens: 12,
        outputTokens: 6,
        cacheReadInputTokens: 0,
        cacheWriteInputTokens: 0,
      },
    });
  });

  it("does not expose credentials or raw provider errors", async () => {
    const secret = "fictional-secret-canary";
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({
              type: "error",
              error: {
                type: "authentication_error",
                message: `Rejected ${secret}`,
              },
            }),
            { status: 401, headers: { "content-type": "application/json" } },
          ),
      ),
    );
    const provider = createAnthropicProvider({ apiKey: secret });

    const error = await provider.textModel
      .complete(request())
      .catch((value: unknown) => value);
    expect(error).toMatchObject({ code: "authentication", retryable: false });
    expect(JSON.stringify(error)).not.toContain(secret);
    expect(String(error)).not.toContain(secret);
  });
});
