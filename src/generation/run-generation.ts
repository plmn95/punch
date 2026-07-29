import {
  CampaignDraftPayloadSchema,
  CritiqueOutputPayloadSchema,
  GenerationContextSchema,
  RevisionOutputPayloadSchema,
  normaliseCampaignDraft,
  normaliseCritiqueOutput,
  type Campaign,
  type CampaignDraftPayload,
  type CritiqueResult,
  type GenerationContext,
  type IssueId,
} from "../core/schemas/index.js";
import {
  aggregateModelUsage,
  type GenerationUsage,
  type ModelCallUsage,
  type TextModel,
} from "../providers/index.js";
import { createLinkedDeadline, throwIfModelAborted } from "./abort.js";
import { GenerationError, toGenerationError } from "./generation-error.js";
import {
  buildCritiquePrompt,
  buildEmitPrompt,
  buildRevisePrompt,
  PROMPT_VERSIONS,
} from "./prompts/index.js";
import { shouldRevise } from "./should-revise.js";
import {
  campaignStageIssues,
  critiqueReferenceIssues,
  revisionStageIssues,
} from "./stage-invariants.js";
import { callStructured } from "./structured-call.js";

const DEFAULT_CALL_TIMEOUT_MS = 60_000;
const DEFAULT_RUN_TIMEOUT_MS = 180_000;

/** Configured generation dependencies and engine-owned deadline bounds. */
export type GenerationEngineOptions = Readonly<{
  model: TextModel;
  signal?: AbortSignal;
  callTimeoutMs?: number;
  runTimeoutMs?: number;
}>;

/** Validated semantic generation artifacts and complete model usage. */
export type GenerationRun = Readonly<{
  finalCampaign: Campaign;
  draft: Campaign;
  critique: CritiqueResult;
  revisedCampaign?: Campaign;
  addressedIssueIds?: readonly IssueId[];
  usage: GenerationUsage;
  promptVersions: Readonly<{
    emit: string;
    critique: string;
    repair?: string;
    revise?: string;
  }>;
}>;

/** Runs emit, critique and no more than one conditional revision. */
export async function runGeneration(
  contextInput: GenerationContext,
  options: GenerationEngineOptions,
): Promise<GenerationRun> {
  const usageCalls: ModelCallUsage[] = [];
  try {
    return await runWithDeadline(contextInput, options, usageCalls);
  } catch (error) {
    throw toGenerationError(error, aggregateModelUsage(usageCalls));
  }
}

/** Links the whole run to one caller signal and total deadline. */
async function runWithDeadline(
  contextInput: GenerationContext,
  options: GenerationEngineOptions,
  usageCalls: ModelCallUsage[],
): Promise<GenerationRun> {
  const baseSignal = options.signal ?? new AbortController().signal;
  const deadline = createLinkedDeadline(
    baseSignal,
    options.runTimeoutMs ?? DEFAULT_RUN_TIMEOUT_MS,
    "run",
  );

  try {
    throwIfModelAborted(deadline.signal, "emit", "primary");
    const context = parseContext(contextInput, usageCalls);
    return await runStages(context, options, deadline.signal, usageCalls);
  } finally {
    deadline.dispose();
  }
}

/** Runs the acyclic semantic stages against one validated context. */
async function runStages(
  context: GenerationContext,
  options: GenerationEngineOptions,
  signal: AbortSignal,
  usageCalls: ModelCallUsage[],
): Promise<GenerationRun> {
  const callTimeoutMs = options.callTimeoutMs ?? DEFAULT_CALL_TIMEOUT_MS;
  const draftPayload = await callCampaignStage(
    context,
    options.model,
    signal,
    callTimeoutMs,
    usageCalls,
  );
  const draft = normaliseCampaignDraft(draftPayload);
  const critique = await callCritiqueStage(
    context,
    draft,
    options.model,
    signal,
    callTimeoutMs,
    usageCalls,
  );

  if (!shouldRevise(critique)) {
    return acceptedRun(draft, critique, usageCalls);
  }
  return revisedRun(
    context,
    draft,
    critique,
    options.model,
    signal,
    callTimeoutMs,
    usageCalls,
  );
}

/** Calls and validates the emit stage against caller-owned goal state. */
async function callCampaignStage(
  context: GenerationContext,
  model: TextModel,
  signal: AbortSignal,
  callTimeoutMs: number,
  usageCalls: ModelCallUsage[],
): Promise<CampaignDraftPayload> {
  return callStructured({
    model,
    prompt: buildEmitPrompt(context),
    schema: CampaignDraftPayloadSchema,
    signal,
    callTimeoutMs,
    validate: (payload) => campaignStageIssues(payload, context),
    recordUsage: (call) => usageCalls.push(call),
  });
}

/** Calls and normalises the critique stage. */
async function callCritiqueStage(
  context: GenerationContext,
  campaign: Campaign,
  model: TextModel,
  signal: AbortSignal,
  callTimeoutMs: number,
  usageCalls: ModelCallUsage[],
): Promise<CritiqueResult> {
  const payload = await callStructured({
    model,
    prompt: buildCritiquePrompt(context, campaign),
    schema: CritiqueOutputPayloadSchema,
    signal,
    callTimeoutMs,
    validate: (output) => critiqueReferenceIssues(output, campaign, context),
    recordUsage: (call) => usageCalls.push(call),
  });
  return normaliseCritiqueOutput(payload);
}

/** Returns an accepted draft without revision-shaped properties. */
function acceptedRun(
  draft: Campaign,
  critique: CritiqueResult,
  usageCalls: readonly ModelCallUsage[],
): GenerationRun {
  return {
    finalCampaign: draft,
    draft,
    critique,
    usage: aggregateModelUsage(usageCalls),
    promptVersions: {
      emit: PROMPT_VERSIONS.emit,
      critique: PROMPT_VERSIONS.critique,
      ...(usedRepair(usageCalls) ? { repair: PROMPT_VERSIONS.repair } : {}),
    },
  };
}

/** Calls one revision and returns its normalised final campaign. */
async function revisedRun(
  context: GenerationContext,
  draft: Campaign,
  critique: CritiqueResult,
  model: TextModel,
  signal: AbortSignal,
  callTimeoutMs: number,
  usageCalls: ModelCallUsage[],
): Promise<GenerationRun> {
  const revision = await callStructured({
    model,
    prompt: buildRevisePrompt(context, draft, critique),
    schema: RevisionOutputPayloadSchema,
    signal,
    callTimeoutMs,
    validate: (payload) => revisionStageIssues(payload, critique, context),
    recordUsage: (call) => usageCalls.push(call),
  });
  const revisedCampaign = normaliseCampaignDraft(revision.campaign);
  return {
    finalCampaign: revisedCampaign,
    draft,
    critique,
    revisedCampaign,
    addressedIssueIds: revision.addressedIssueIds,
    usage: aggregateModelUsage(usageCalls),
    promptVersions: {
      emit: PROMPT_VERSIONS.emit,
      critique: PROMPT_VERSIONS.critique,
      revise: PROMPT_VERSIONS.revise,
      ...(usedRepair(usageCalls) ? { repair: PROMPT_VERSIONS.repair } : {}),
    },
  };
}

/** Reports whether any semantic stage needed structured repair. */
function usedRepair(usageCalls: readonly ModelCallUsage[]): boolean {
  return usageCalls.some((call) => call.attempt === "repair");
}

/** Validates context without exposing Zod values or issue messages. */
function parseContext(
  context: GenerationContext,
  usageCalls: readonly ModelCallUsage[],
): GenerationContext {
  const result = GenerationContextSchema.safeParse(context);
  if (result.success) {
    return result.data;
  }
  throw new GenerationError({
    code: "invalid-context",
    retryable: false,
    usage: aggregateModelUsage(usageCalls),
  });
}
