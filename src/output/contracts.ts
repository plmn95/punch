import type {
  CampaignTrace,
  CampaignValidation,
  GenerateCampaignResult,
} from "../core/generate-campaign.js";
import type { Campaign, ProductId } from "../core/schemas/index.js";
import type { GenerationUsage } from "../providers/index.js";

export const ARTIFACT_SCHEMA_VERSION = "0.1.0";
export const TRACE_SCHEMA_VERSION = "0.1.0";
export const REDACTION_POLICY_VERSION = "0.1.0";

export type OutputArtifact = Readonly<{
  path: string;
  mediaType: "application/json" | "text/html";
  content: string;
}>;

export type ArtifactDescriptor = Readonly<{
  path: string;
  mediaType: OutputArtifact["mediaType"];
  bytes: number;
  sha256: string;
  disposition: "valid";
}>;

export type CampaignDocument = Readonly<{
  generator: "punch";
  artifactSchemaVersion: string;
  status: "valid";
  goal: Campaign["goal"];
  productIds: readonly ProductId[];
  campaign: Campaign;
}>;

export type ValidationDocument = Readonly<{
  generator: "punch";
  artifactSchemaVersion: string;
  status: "valid";
  validation: CampaignValidation;
  usage: GenerationUsage;
  artifacts: readonly ArtifactDescriptor[];
}>;

export type TraceManifest = Readonly<{
  generator: "punch";
  traceSchemaVersion: string;
  redactionPolicyVersion: string;
  status: "valid";
  promptVersions: CampaignTrace["promptVersions"];
  artifacts: readonly ArtifactDescriptor[];
}>;

export type OutputBundle = Readonly<{
  artifacts: readonly OutputArtifact[];
  result: GenerateCampaignResult;
}>;
