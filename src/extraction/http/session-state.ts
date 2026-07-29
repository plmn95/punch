import {
  abortFailure,
  PublicFetchError,
  throwIfFetchAborted,
} from "./fetch-error.js";
import type { PublicFetchLimits } from "./fetch-policy.js";
import type { BodyBudget } from "./bounded-body.js";

export type LinkedDeadline = Readonly<{
  signal: AbortSignal;
  dispose: () => void;
}>;

/** Links a caller signal to one fixed timeout with listener cleanup. */
export function createLinkedDeadline(
  parent: AbortSignal,
  timeoutMs: number,
): LinkedDeadline {
  const controller = new AbortController();
  const abort = () => controller.abort(abortFailure(parent));
  const timer = setTimeout(
    () => controller.abort(new PublicFetchError("timeout")),
    timeoutMs,
  );
  timer.unref();
  if (parent.aborted) {
    abort();
  } else {
    parent.addEventListener("abort", abort, { once: true });
    if (parent.aborted) {
      abort();
    }
  }
  return {
    signal: controller.signal,
    dispose: () => {
      clearTimeout(timer);
      parent.removeEventListener("abort", abort);
    },
  };
}

/** Shared session state for documents, bytes, and policy cancellation. */
export class SessionState {
  readonly signal: AbortSignal;
  readonly budget: BodyBudget;
  private documents = 0;
  private compressedBytes = 0;
  private decompressedBytes = 0;
  private readonly controller = new AbortController();
  private readonly unlinkSession: () => void;

  constructor(
    callerSignal: AbortSignal,
    private readonly limits: PublicFetchLimits,
  ) {
    this.signal = this.controller.signal;
    this.budget = {
      consumeCompressed: (bytes) => this.consumeCompressed(bytes),
      consumeDecompressed: (bytes) => this.consumeDecompressed(bytes),
    };
    this.unlinkSession = linkSessionSignal(
      this.controller,
      callerSignal,
      limits.sessionTimeoutMs,
    );
  }

  /** Reserves one logical document before any queued network work. */
  startDocument(): void {
    throwIfFetchAborted(this.signal);
    this.documents += 1;
    if (this.documents > this.limits.maxDocuments) {
      this.fail("document-limit");
    }
  }

  /** Clears session resources and cancels any remaining work. */
  dispose(): void {
    this.unlinkSession();
    if (!this.signal.aborted) {
      this.controller.abort(new PublicFetchError("cancelled"));
    }
  }

  /** Applies the aggregate compressed-byte budget. */
  private consumeCompressed(bytes: number): void {
    this.compressedBytes += bytes;
    if (this.compressedBytes > this.limits.aggregateCompressedBytes) {
      this.fail("aggregate-limit");
    }
  }

  /** Applies the aggregate decompressed-byte budget. */
  private consumeDecompressed(bytes: number): void {
    this.decompressedBytes += bytes;
    if (this.decompressedBytes > this.limits.aggregateDecompressedBytes) {
      this.fail("aggregate-limit");
    }
  }

  /** Aborts sibling work and throws one stable policy failure. */
  private fail(code: "aggregate-limit" | "document-limit"): never {
    const error = new PublicFetchError(code);
    this.unlinkSession();
    this.controller.abort(error);
    throw error;
  }
}

/** Links caller cancellation and one total timeout to a session controller. */
function linkSessionSignal(
  controller: AbortController,
  caller: AbortSignal,
  timeoutMs: number,
): () => void {
  let cleaned = false;
  const cleanup = () => {
    if (cleaned) {
      return;
    }
    cleaned = true;
    clearTimeout(timer);
    caller.removeEventListener("abort", abort);
  };
  const abort = () => {
    cleanup();
    controller.abort(new PublicFetchError("cancelled"));
  };
  const timer = setTimeout(() => {
    cleanup();
    controller.abort(new PublicFetchError("session-timeout"));
  }, timeoutMs);
  timer.unref();
  if (caller.aborted) {
    clearTimeout(timer);
    abort();
    return cleanup;
  }
  caller.addEventListener("abort", abort, { once: true });
  if (caller.aborted) {
    abort();
  }
  return cleanup;
}

/** Bounded FIFO gate for concurrent logical resource requests. */
export class RequestGate {
  private active = 0;
  private readonly waiters: Array<() => void> = [];

  constructor(private readonly maximum: number) {}

  /** Acquires one permit or waits under the supplied deadline signal. */
  async acquire(signal: AbortSignal): Promise<() => void> {
    throwIfFetchAborted(signal);
    if (this.active < this.maximum) {
      this.active += 1;
      return this.releaseOnce();
    }
    await this.wait(signal);
    return this.releaseOnce();
  }

  /** Waits for a permit while removing an aborted queued request. */
  private async wait(signal: AbortSignal): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      let settled = false;
      const resume = () => {
        if (settled) {
          return;
        }
        settled = true;
        signal.removeEventListener("abort", cancel);
        resolve();
      };
      const cancel = () => {
        if (settled) {
          return;
        }
        settled = true;
        const index = this.waiters.indexOf(resume);
        if (index >= 0) {
          this.waiters.splice(index, 1);
        }
        signal.removeEventListener("abort", cancel);
        reject(abortFailure(signal));
      };
      this.waiters.push(resume);
      signal.addEventListener("abort", cancel, { once: true });
      if (signal.aborted) {
        cancel();
      }
    });
  }

  /** Returns an idempotent release closure for one held permit. */
  private releaseOnce(): () => void {
    let released = false;
    return () => {
      if (released) {
        return;
      }
      released = true;
      const next = this.waiters.shift();
      if (next) {
        next();
      } else {
        this.active -= 1;
      }
    };
  }
}
