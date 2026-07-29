import type { z } from "zod";

import {
  aggregateModelUsage,
  TextModelError,
  type ModelCallUsage,
  type ModelResponse,
  type TextModel,
} from "../providers/index.js";
import { callModel } from "./call-model.js";
import { GenerationError } from "./generation-error.js";
import { buildRepairPrompt, type ModelPrompt } from "./prompts/index.js";

type ValidationIssueSource<T> = (value: T) => readonly string[];

export type StructuredCallInput<T> = Readonly<{
  model: TextModel;
  prompt: ModelPrompt;
  schema: z.ZodType<T>;
  signal: AbortSignal;
  callTimeoutMs: number;
  validate?: ValidationIssueSource<T>;
  recordUsage: (call: ModelCallUsage) => void;
}>;

/** Calls one structured stage with no more than one repair attempt. */
export async function callStructured<T>(
  input: StructuredCallInput<T>,
): Promise<T> {
  const primary = await completeAttempt(input, input.prompt, "primary");
  const primaryResult = parseStructured(
    primary.text,
    input.schema,
    input.validate,
  );

  if (primary.stopReason === "complete" && primaryResult.success) {
    return primaryResult.value;
  }
  rejectUnsupportedStop(primary.stopReason, input.prompt.stage, "primary");

  const issueCodes =
    primary.stopReason === "max-output"
      ? [...primaryResult.issueCodes, "max-output"]
      : primaryResult.issueCodes;
  const repairPrompt = buildRepairPrompt({
    originalPrompt: input.prompt,
    outputSchema: input.schema,
    invalidText: primary.text,
    issueCodes: [...new Set(issueCodes)],
  });
  const repaired = await completeAttempt(input, repairPrompt, "repair");
  const repairedResult = parseStructured(
    repaired.text,
    input.schema,
    input.validate,
  );

  if (repaired.stopReason === "complete" && repairedResult.success) {
    return repairedResult.value;
  }
  rejectUnsupportedStop(repaired.stopReason, input.prompt.stage, "repair");
  throw invalidOutput(input.prompt.stage, "repair");
}

/** Completes one attempt and records only its normalised usage. */
async function completeAttempt<T>(
  input: StructuredCallInput<T>,
  prompt: ModelPrompt,
  attempt: "primary" | "repair",
): Promise<ModelResponse> {
  const response = await callModel(
    input.model,
    {
      ...prompt,
      attempt,
      signal: input.signal,
    },
    input.callTimeoutMs,
  );
  input.recordUsage({
    stage: prompt.stage,
    attempt,
    usage: response.usage,
  });
  return response;
}

type ParsedStructured<T> =
  | Readonly<{ success: true; value: T; issueCodes: readonly string[] }>
  | Readonly<{ success: false; issueCodes: readonly string[] }>;

/** Strictly parses JSON, validates its schema, then applies owned invariants. */
function parseStructured<T>(
  text: string,
  schema: z.ZodType<T>,
  validate?: ValidationIssueSource<T>,
): ParsedStructured<T> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(normaliseJsonEnvelope(text));
  } catch {
    return { success: false, issueCodes: ["invalid-json"] };
  }

  const result = schema.safeParse(parsed);
  if (!result.success) {
    return {
      success: false,
      issueCodes: uniqueIssueCodes(result.error.issues),
    };
  }

  const invariantIssues = validate?.(result.data) ?? [];
  return invariantIssues.length === 0
    ? { success: true, value: result.data, issueCodes: [] }
    : { success: false, issueCodes: [...new Set(invariantIssues)] };
}

/** Trims whitespace and at most one exact outer JSON Markdown fence. */
function normaliseJsonEnvelope(text: string): string {
  const trimmed = text.replace(/^\uFEFF/u, "").trim();
  const fenced = /^```json\r?\n([\s\S]*)\r?\n```$/iu.exec(trimmed);
  return fenced?.[1]?.trim() ?? trimmed;
}

/** Reduces Zod issues to safe structural codes without values or snippets. */
function uniqueIssueCodes(
  issues: ReadonlyArray<{ readonly code: string }>,
): string[] {
  return [...new Set(issues.map((issue) => issue.code))];
}

/** Rejects refusal and unknown stop reasons without attempting JSON repair. */
function rejectUnsupportedStop(
  stopReason: string,
  stage: ModelPrompt["stage"],
  attempt: "primary" | "repair",
): void {
  if (stopReason === "complete" || stopReason === "max-output") {
    return;
  }
  throw new TextModelError({
    code: stopReason === "refusal" ? "request-rejected" : "protocol",
    retryable: false,
    stage,
    attempt,
  });
}

/** Creates a safe structured-output error with no model text attached. */
function invalidOutput(
  stage: ModelPrompt["stage"],
  attempt: "primary" | "repair",
): GenerationError {
  return new GenerationError({
    code: "invalid-model-output",
    retryable: false,
    usage: aggregateModelUsage([]),
    stage,
    attempt,
  });
}
