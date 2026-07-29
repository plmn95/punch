import { z } from "zod";
import { describe, expect, it } from "vitest";

import { callStructured } from "../../src/generation/structured-call.js";
import type { ModelCallUsage } from "../../src/providers/index.js";
import {
  modelResponse,
  QueuedTextModel,
} from "../support/queued-text-model.js";

const ResultSchema = z.strictObject({
  value: z.string().min(1),
});

const PROMPT = {
  stage: "emit" as const,
  promptVersion: "punch.test.v1",
  system: "Return JSON.",
  user: "Use the fictional test contract.",
  maxOutputTokens: 100,
};

/** Calls the structured helper and records completed-call usage. */
async function runStructured(
  model: QueuedTextModel,
  signal: AbortSignal = new AbortController().signal,
) {
  const calls: ModelCallUsage[] = [];
  const result = await callStructured({
    model,
    prompt: PROMPT,
    schema: ResultSchema,
    signal,
    callTimeoutMs: 1_000,
    recordUsage: (call) => calls.push(call),
  });
  return { result, calls };
}

describe("structured model calls", () => {
  it("accepts strict JSON, a BOM, and one exact outer JSON fence", async () => {
    const plain = new QueuedTextModel([modelResponse('{"value":"plain"}')]);
    const fenced = new QueuedTextModel([
      modelResponse('\uFEFF  ```json\n{"value":"fenced"}\n```  '),
    ]);

    await expect(runStructured(plain)).resolves.toMatchObject({
      result: { value: "plain" },
    });
    await expect(runStructured(fenced)).resolves.toMatchObject({
      result: { value: "fenced" },
    });
  });

  it.each([
    'Before {"value":"unsafe"}',
    '{"value":"first"}\n{"value":"second"}',
    '```javascript\n{"value":"unsafe"}\n```',
  ])("does not mine JSON from an invalid envelope", async (invalidText) => {
    const model = new QueuedTextModel([
      modelResponse(invalidText),
      modelResponse('{"value":"repaired"}'),
    ]);

    await expect(runStructured(model)).resolves.toMatchObject({
      result: { value: "repaired" },
    });
    expect(model.requests.map((request) => request.attempt)).toEqual([
      "primary",
      "repair",
    ]);
  });

  it("repairs invalid syntax once and counts both completed calls", async () => {
    const model = new QueuedTextModel([
      modelResponse('{"value":'),
      modelResponse('{"value":"fixed"}'),
    ]);

    const run = await runStructured(model);

    expect(run.result).toEqual({ value: "fixed" });
    expect(run.calls).toHaveLength(2);
    expect(model.requests[1]).toMatchObject({
      stage: "emit",
      attempt: "repair",
      promptVersion: "punch.structured-repair.v1",
      maxOutputTokens: 100,
    });
    expect(model.requests[1]?.user).toContain("<untrusted-invalid-result>");
  });

  it("repairs schema failures and engine-owned invariant failures", async () => {
    const schemaModel = new QueuedTextModel([
      modelResponse('{"value":"","extra":true}'),
      modelResponse('{"value":"valid"}'),
    ]);
    await expect(runStructured(schemaModel)).resolves.toMatchObject({
      result: { value: "valid" },
    });

    const invariantModel = new QueuedTextModel([
      modelResponse('{"value":"wrong"}'),
      modelResponse('{"value":"expected"}'),
    ]);
    const calls: ModelCallUsage[] = [];
    await expect(
      callStructured({
        model: invariantModel,
        prompt: PROMPT,
        schema: ResultSchema,
        signal: new AbortController().signal,
        callTimeoutMs: 1_000,
        validate: (value) =>
          value.value === "expected" ? [] : ["value-mismatch"],
        recordUsage: (call) => calls.push(call),
      }),
    ).resolves.toEqual({ value: "expected" });
    expect(calls).toHaveLength(2);
  });

  it("always repairs a max-output primary response", async () => {
    const complete = modelResponse('{"value":"apparently-complete"}');
    const model = new QueuedTextModel([
      { ...complete, stopReason: "max-output" },
      modelResponse('{"value":"confirmed"}'),
    ]);

    await expect(runStructured(model)).resolves.toMatchObject({
      result: { value: "confirmed" },
    });
    expect(model.requests).toHaveLength(2);
  });

  it("fails after one invalid repair without exposing model text", async () => {
    const secretCanary = "fictional-secret-canary";
    const model = new QueuedTextModel([
      modelResponse(`not-json-${secretCanary}`),
      modelResponse(`still-not-json-${secretCanary}`),
    ]);

    const failure = await runStructured(model).catch((error: unknown) => error);
    const exposed = `${String(failure)} ${JSON.stringify(failure)} ${
      failure instanceof Error ? failure.stack : ""
    }`;

    expect(failure).toMatchObject({
      code: "invalid-model-output",
      stage: "emit",
      attempt: "repair",
    });
    expect(exposed).not.toContain(secretCanary);
    expect(model.requests).toHaveLength(2);
    expect(model.remaining).toBe(0);
  });

  it.each(["refusal", "unknown"] as const)(
    "does not repair a %s response",
    async (stopReason) => {
      const response = modelResponse('{"value":"ignored"}');
      const model = new QueuedTextModel([{ ...response, stopReason }]);

      await expect(runStructured(model)).rejects.toMatchObject({
        code: stopReason === "refusal" ? "request-rejected" : "protocol",
        stage: "emit",
        attempt: "primary",
      });
      expect(model.requests).toHaveLength(1);
    },
  );

  it.each(["x".repeat(128_001), "é".repeat(70_000)])(
    "rejects an oversized provider response before structured parsing",
    async (oversized) => {
      const model = new QueuedTextModel([modelResponse(oversized)]);

      await expect(runStructured(model)).rejects.toMatchObject({
        code: "protocol",
        stage: "emit",
        attempt: "primary",
      });
      expect(model.requests).toHaveLength(1);
    },
  );

  it("makes no provider call for a pre-aborted signal", async () => {
    const controller = new AbortController();
    controller.abort("fictional cancellation");
    const model = new QueuedTextModel([modelResponse('{"value":"unused"}')]);

    await expect(runStructured(model, controller.signal)).rejects.toMatchObject(
      {
        code: "cancelled",
      },
    );
    expect(model.requests).toHaveLength(0);
    expect(model.remaining).toBe(1);
  });
});
