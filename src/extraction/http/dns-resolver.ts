import { Resolver } from "node:dns/promises";

import {
  abortFailure,
  PublicFetchError,
  throwIfFetchAborted,
} from "./fetch-error.js";
import type { ResolvedAddress } from "./public-address.js";

/** Resolver seam kept internal so public-address policy remains authoritative. */
export interface PublicAddressResolver {
  resolve(
    hostname: string,
    signal: AbortSignal,
  ): Promise<readonly ResolvedAddress[]>;
}

/** Resolves both address families and permits cancellation of active queries. */
export class NodePublicAddressResolver implements PublicAddressResolver {
  async resolve(
    hostname: string,
    signal: AbortSignal,
  ): Promise<readonly ResolvedAddress[]> {
    throwIfFetchAborted(signal);
    const resolver = new Resolver();
    const cancel = () => resolver.cancel();
    signal.addEventListener("abort", cancel, { once: true });
    if (signal.aborted) {
      signal.removeEventListener("abort", cancel);
      throw abortFailure(signal);
    }

    try {
      const results = await Promise.allSettled([
        resolver.resolve4(hostname),
        resolver.resolve6(hostname),
      ]);
      throwIfFetchAborted(signal);
      return collectAnswers(results);
    } catch (error) {
      if (signal.aborted) {
        throw abortFailure(signal);
      }
      if (error instanceof PublicFetchError) {
        throw error;
      }
      throw new PublicFetchError("dns-failure");
    } finally {
      signal.removeEventListener("abort", cancel);
    }
  }
}

/** Collects successful answers while allowing only genuine no-data failures. */
function collectAnswers(
  results: readonly PromiseSettledResult<readonly string[]>[],
): readonly ResolvedAddress[] {
  const answers: ResolvedAddress[] = [];
  results.forEach((result, index) => {
    if (result.status === "fulfilled") {
      const family = index === 0 ? 4 : 6;
      result.value.forEach((address) => answers.push({ address, family }));
      return;
    }
    if (!isNoDataFailure(result.reason)) {
      throw new PublicFetchError("dns-failure");
    }
  });
  return answers;
}

/** Reports whether a resolver error means that address family has no answer. */
function isNoDataFailure(error: unknown): boolean {
  if (typeof error !== "object" || error === null || !("code" in error)) {
    return false;
  }
  return error.code === "ENODATA" || error.code === "ENOTFOUND";
}
