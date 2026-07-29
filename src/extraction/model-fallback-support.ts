import {
  BrandEvidenceSchema,
  type BrandEvidence,
  type EvidenceRef,
} from "../core/schemas/index.js";
import type { SourceSegment } from "./contracts.js";
import type { BrandFallback } from "./model-fallback-schemas.js";
import { findSourceSegment } from "./source-text.js";

/** Merges only locally supported fallback fields into brand evidence. */
export function mergeBrandFallback(
  evidence: BrandEvidence,
  fallback: BrandFallback,
  segments: readonly SourceSegment[],
): BrandEvidence {
  return BrandEvidenceSchema.parse({
    ...evidence,
    voice: supportedBrandVoice(evidence, fallback.voice, segments),
  });
}

/** Returns a labelled voice inference with bounded source evidence. */
function supportedBrandVoice(
  evidence: BrandEvidence,
  fallback: BrandFallback["voice"],
  segments: readonly SourceSegment[],
) {
  if (
    evidence.voice.state !== "unknown" ||
    !fallback ||
    !supportsSegments(fallback.segmentIds, segments)
  ) {
    return evidence.voice;
  }
  return {
    state: "inferred" as const,
    value: {
      summary: `Tone guidance only: ${fallback.traits.join(", ")}.`,
      traits: fallback.traits,
    },
    evidence: fallback.segmentIds.map((id) =>
      websiteSegmentRef(evidence.websiteUrl, id, segments),
    ),
    rationale: "Model-assisted tone classification; not factual evidence.",
  };
}

/** Reports whether every cited segment belongs to the bounded source set. */
function supportsSegments(
  segmentIds: readonly string[],
  segments: readonly SourceSegment[],
): boolean {
  return (
    new Set(segmentIds).size === segmentIds.length &&
    segmentIds.every((id) => Boolean(findSourceSegment(segments, id)))
  );
}

/** Returns website-scoped segment evidence. */
function websiteSegmentRef(
  websiteUrl: string,
  segmentId: string,
  segments: readonly SourceSegment[],
): EvidenceRef {
  const segment = findSourceSegment(segments, segmentId)!;
  return { source: "website", url: websiteUrl, field: segment.field };
}
