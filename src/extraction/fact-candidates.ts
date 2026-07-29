import type { EvidenceRef } from "../core/schemas/index.js";

export type FactCandidate<T> = Readonly<{
  value: T;
  evidence: readonly EvidenceRef[];
  key: string;
}>;

export type CriticalFact<T> =
  | Readonly<{
      state: "observed";
      value: T;
      evidence: readonly EvidenceRef[];
    }>
  | Readonly<{
      state: "conflicted";
      candidates: ReadonlyArray<{
        value: T;
        evidence: readonly EvidenceRef[];
      }>;
    }>
  | Readonly<{ state: "unknown" }>;

export type DescriptiveFact<T> =
  | CriticalFact<T>
  | Readonly<{
      state: "inferred";
      value: T;
      evidence: readonly EvidenceRef[];
      rationale: string;
    }>;

/** Resolves bounded candidates without selecting between distinct values. */
export function resolveCriticalFact<T>(
  candidates: readonly FactCandidate<T>[],
): CriticalFact<T> {
  const grouped = groupCandidates(candidates);
  if (grouped.length === 0) {
    return { state: "unknown" };
  }
  if (grouped.length === 1) {
    const candidate = grouped[0]!;
    return {
      state: "observed",
      value: candidate.value,
      evidence: candidate.evidence,
    };
  }
  return {
    state: "conflicted",
    candidates: grouped.slice(0, 6).map(({ value, evidence }) => ({
      value,
      evidence,
    })),
  };
}

/** Returns one inferred descriptive value with bounded unique evidence. */
export function inferredFact<T>(
  value: T,
  evidence: readonly EvidenceRef[],
  rationale: string,
): DescriptiveFact<T> {
  return {
    state: "inferred",
    value,
    evidence: uniqueEvidence(evidence),
    rationale,
  };
}

/** Groups semantic equals and merges their evidence in stable order. */
function groupCandidates<T>(
  candidates: readonly FactCandidate<T>[],
): FactCandidate<T>[] {
  const grouped = new Map<string, FactCandidate<T>>();
  for (const candidate of candidates) {
    const existing = grouped.get(candidate.key);
    grouped.set(
      candidate.key,
      existing
        ? {
            ...existing,
            evidence: uniqueEvidence([
              ...existing.evidence,
              ...candidate.evidence,
            ]),
          }
        : { ...candidate, evidence: uniqueEvidence(candidate.evidence) },
    );
  }
  return [...grouped.values()];
}

/** Removes duplicate evidence references and respects the schema cap. */
function uniqueEvidence(evidence: readonly EvidenceRef[]): EvidenceRef[] {
  const seen = new Set<string>();
  return evidence.filter((reference) => {
    const key = JSON.stringify(reference);
    if (seen.has(key) || seen.size >= 8) {
      return false;
    }
    seen.add(key);
    return true;
  });
}
