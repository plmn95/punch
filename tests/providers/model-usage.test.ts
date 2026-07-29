import { describe, expect, it } from "vitest";

import {
  addModelUsage,
  aggregateModelUsage,
  normaliseModelUsage,
  TextModelError,
  zeroModelUsage,
  type ModelUsage,
} from "../../src/providers/index.js";

const FIRST_USAGE: ModelUsage = {
  inputTokens: 10,
  outputTokens: 4,
  cacheReadInputTokens: 3,
  cacheWriteInputTokens: 1,
};

const SECOND_USAGE: ModelUsage = {
  inputTokens: 7,
  outputTokens: 5,
  cacheReadInputTokens: 2,
  cacheWriteInputTokens: 6,
};

describe("model usage", () => {
  it("adds and aggregates every token category by stage", () => {
    expect(addModelUsage(FIRST_USAGE, SECOND_USAGE)).toEqual({
      inputTokens: 17,
      outputTokens: 9,
      cacheReadInputTokens: 5,
      cacheWriteInputTokens: 7,
    });

    expect(
      aggregateModelUsage([
        { stage: "emit", attempt: "primary", usage: FIRST_USAGE },
        { stage: "emit", attempt: "repair", usage: SECOND_USAGE },
        { stage: "critique", attempt: "primary", usage: FIRST_USAGE },
      ]),
    ).toEqual({
      total: {
        inputTokens: 27,
        outputTokens: 13,
        cacheReadInputTokens: 8,
        cacheWriteInputTokens: 8,
      },
      byStage: {
        emit: {
          inputTokens: 17,
          outputTokens: 9,
          cacheReadInputTokens: 5,
          cacheWriteInputTokens: 7,
        },
        critique: FIRST_USAGE,
        revise: zeroModelUsage(),
      },
      calls: [
        { stage: "emit", attempt: "primary", usage: FIRST_USAGE },
        { stage: "emit", attempt: "repair", usage: SECOND_USAGE },
        { stage: "critique", attempt: "primary", usage: FIRST_USAGE },
      ],
    });
  });

  it.each([
    -1,
    0.5,
    Number.NaN,
    Number.POSITIVE_INFINITY,
    Number.MAX_SAFE_INTEGER + 1,
  ])("rejects unsafe usage count %s", (inputTokens) => {
    expect(() =>
      normaliseModelUsage({
        ...FIRST_USAGE,
        inputTokens,
      }),
    ).toThrow(RangeError);
  });

  it("rejects overflow while adding otherwise valid counts", () => {
    expect(() =>
      addModelUsage(
        {
          ...zeroModelUsage(),
          inputTokens: Number.MAX_SAFE_INTEGER,
        },
        {
          ...zeroModelUsage(),
          inputTokens: 1,
        },
      ),
    ).toThrow("safe-integer range");
  });
});

describe("safe model errors", () => {
  it("contains no provider secret or raw provider message", () => {
    const secretCanary = "sk-ant-fictional-secret-canary";
    const rawProviderMessage = `authentication failed for ${secretCanary}`;
    const error = new TextModelError({
      code: "authentication",
      retryable: false,
      stage: "emit",
      attempt: "primary",
    });
    const exposed = JSON.stringify({
      name: error.name,
      message: error.message,
      code: error.code,
      retryable: error.retryable,
      stage: error.stage,
      attempt: error.attempt,
    });

    expect(exposed).not.toContain(secretCanary);
    expect(exposed).not.toContain(rawProviderMessage);
    expect(error.message).toBe("The model provider could not authenticate.");
  });
});
