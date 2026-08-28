import { createHash } from "node:crypto";

import type { GenerateCampaignResult } from "../core/generate-campaign.js";
import type {
  ArtifactDescriptor,
  CampaignDocument,
  OutputArtifact,
  OutputBundle,
  TraceManifest,
  ValidationDocument,
} from "./contracts.js";
import {
  ARTIFACT_SCHEMA_VERSION,
  REDACTION_POLICY_VERSION,
  TRACE_SCHEMA_VERSION,
} from "./contracts.js";

/** Builds the complete allowlisted output bundle in memory. */
export function buildOutputBundle(
  result: GenerateCampaignResult,
): OutputBundle {
  const campaign = jsonArtifact("campaign.json", campaignDocument(result));
  const email = htmlArtifact("email.html", result.html);
  const traces = result.trace ? traceArtifacts(result.trace) : [];
  const described = [email, campaign, ...traces].map(describeArtifact);
  const validation = jsonArtifact(
    "validation.json",
    validationDocument(result, described),
  );
  return {
    artifacts: [email, campaign, validation, ...traces],
    result,
  };
}

/** Creates the stable public campaign document. */
function campaignDocument(result: GenerateCampaignResult): CampaignDocument {
  const productIds = result.campaign.blocks.flatMap((block) => {
    if (block.type === "product-feature") {
      return [block.productId];
    }
    return block.type === "product-grid"
      ? block.items.map((item) => item.productId)
      : [];
  });
  return {
    generator: "punch",
    artifactSchemaVersion: ARTIFACT_SCHEMA_VERSION,
    status: "valid",
    goal: result.campaign.goal,
    productIds: [...new Set(productIds)],
    campaign: result.campaign,
  };
}

/** Creates validation metadata without raw sources or provider payloads. */
function validationDocument(
  result: GenerateCampaignResult,
  artifacts: readonly ArtifactDescriptor[],
): ValidationDocument {
  return {
    generator: "punch",
    artifactSchemaVersion: ARTIFACT_SCHEMA_VERSION,
    status: "valid",
    validation: result.validation,
    usage: result.usage,
    artifacts,
  };
}

/** Builds allowlisted trace files only for stages that ran. */
function traceArtifacts(
  trace: NonNullable<GenerateCampaignResult["trace"]>,
): OutputArtifact[] {
  const stageArtifacts = [
    jsonArtifact("trace/brand-profile.json", trace.brandProfile),
    jsonArtifact("trace/product-profiles.json", trace.productProfiles),
    jsonArtifact("trace/draft.json", trace.draft),
    jsonArtifact("trace/critique.json", trace.critique),
    ...(trace.revisedCampaign
      ? [jsonArtifact("trace/revised-campaign.json", trace.revisedCampaign)]
      : []),
  ];
  const manifest: TraceManifest = {
    generator: "punch",
    traceSchemaVersion: TRACE_SCHEMA_VERSION,
    redactionPolicyVersion: REDACTION_POLICY_VERSION,
    status: "valid",
    promptVersions: trace.promptVersions,
    artifacts: stageArtifacts.map(describeArtifact),
  };
  return [jsonArtifact("trace/manifest.json", manifest), ...stageArtifacts];
}

/** Serialises one JSON artifact with a final newline. */
function jsonArtifact(path: string, value: unknown): OutputArtifact {
  return {
    path,
    mediaType: "application/json",
    content: `${JSON.stringify(value, null, 2)}\n`,
  };
}

/** Creates one standalone HTML artifact. */
function htmlArtifact(path: string, content: string): OutputArtifact {
  return { path, mediaType: "text/html", content };
}

/** Records bytes and digest for one immutable in-memory artifact. */
function describeArtifact(artifact: OutputArtifact): ArtifactDescriptor {
  const bytes = Buffer.byteLength(artifact.content, "utf8");
  const sha256 = createHash("sha256").update(artifact.content).digest("hex");
  return {
    path: artifact.path,
    mediaType: artifact.mediaType,
    bytes,
    sha256,
    disposition: "valid",
  };
}
