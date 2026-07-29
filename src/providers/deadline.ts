import { modelCancelled, TextModelError } from "./model-error.js";
import type { ModelAttempt, ModelStage } from "./text-model.js";

type DeadlineKind = "call" | "run";

type DeadlineReason = Readonly<{
  kind: DeadlineKind;
}>;

const DEADLINE_REASONS = new WeakSet<object>();
const MAX_TIMEOUT_MS = 2_147_483_647;
const CANCELLED_REASON = Object.freeze({ kind: "cancelled" });

/** Linked deadline signal and the cleanup required after its work finishes. */
export type LinkedDeadline = Readonly<{
  signal: AbortSignal;
  dispose: () => void;
}>;

/** Creates a signal linked to its parent and one fixed deadline. */
export function createLinkedDeadline(
  parent: AbortSignal,
  timeoutMs: number,
  kind: DeadlineKind,
): LinkedDeadline {
  assertTimeout(timeoutMs);
  const controller = new AbortController();
  const abortFromParent = () => {
    const reason = isDeadlineReason(parent.reason)
      ? parent.reason
      : CANCELLED_REASON;
    controller.abort(reason);
  };
  const timer = setTimeout(() => {
    const reason: DeadlineReason = { kind };
    DEADLINE_REASONS.add(reason);
    controller.abort(reason);
  }, timeoutMs);

  if (parent.aborted) {
    abortFromParent();
  } else {
    parent.addEventListener("abort", abortFromParent, { once: true });
    if (parent.aborted) {
      abortFromParent();
    }
  }

  return {
    signal: controller.signal,
    dispose: () => {
      clearTimeout(timer);
      parent.removeEventListener("abort", abortFromParent);
    },
  };
}

/** Throws a safe cancellation or timeout error for an aborted signal. */
export function throwIfModelAborted(
  signal: AbortSignal,
  stage: ModelStage,
  attempt: ModelAttempt,
): void {
  if (!signal.aborted) {
    return;
  }
  if (isDeadlineReason(signal.reason)) {
    throw new TextModelError({
      code: "timeout",
      retryable: true,
      stage,
      attempt,
    });
  }
  throw modelCancelled(stage, attempt);
}

/** Reports whether an abort reason belongs to a Punch-owned deadline. */
function isDeadlineReason(reason: unknown): reason is DeadlineReason {
  return (
    typeof reason === "object" &&
    reason !== null &&
    DEADLINE_REASONS.has(reason)
  );
}

/** Rejects deadline configuration that cannot be applied safely. */
function assertTimeout(timeoutMs: number): void {
  if (
    !Number.isSafeInteger(timeoutMs) ||
    timeoutMs <= 0 ||
    timeoutMs > MAX_TIMEOUT_MS
  ) {
    throw new RangeError("Deadline is outside the supported range.");
  }
}
