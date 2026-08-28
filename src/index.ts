export {
  AvailabilitySchema,
  BrandEvidenceSchema,
  CampaignBlockSchema,
  CampaignGoalSchema,
  CampaignSchema,
  CtaSchema,
  EvidenceRefSchema,
  GenerateCampaignInputSchema,
  GenerationContextSchema,
  HttpUrlSchema,
  ImageSchema,
  MoneySchema,
  OfferInputSchema,
  ProductEvidenceSchema,
  ProductIdSchema,
  SCHEMA_VERSION,
} from "./core/schemas/index.js";

export type {
  Availability,
  BrandEvidence,
  Campaign,
  CampaignBlock,
  CampaignGoal,
  Cta,
  EvidenceRef,
  GenerateCampaignInput,
  GenerationContext,
  Image,
  Money,
  OfferInput,
  ProductEvidence,
  ProductId,
} from "./core/schemas/index.js";

export {
  generateCampaign,
  type CampaignTrace,
  type CampaignValidation,
  type GenerateCampaignOptions,
  type GenerateCampaignResult,
} from "./core/generate-campaign.js";

export {
  DEFAULT_ANTHROPIC_MODEL,
  createAnthropicProvider,
  type AnthropicProviderOptions,
  type PunchProvider,
} from "./providers/anthropic.js";

export {
  ARTIFACT_SCHEMA_VERSION,
  REDACTION_POLICY_VERSION,
  TRACE_SCHEMA_VERSION,
  OutputError,
  buildOutputBundle,
  writeCampaignOutput,
  type ArtifactDescriptor,
  type CampaignDocument,
  type OutputArtifact,
  type OutputBundle,
  type OutputErrorCode,
  type TraceManifest,
  type ValidationDocument,
  type WriteOutputOptions,
} from "./output/index.js";
