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

export { renderCampaignHtml } from "./rendering/index.js";
export { renderCampaign, restyleCampaign } from "./core/render-campaign.js";
export { resolveBrand } from "./brand/resolve-brand.js";
export {
  BrandSettingsSchema,
  BrandProfileSchema,
  ResolvedBrandSchema,
  BrandStyleError,
  type BrandSettings,
  type CompleteBrandSettings,
  type ResolvedBrand,
} from "./brand/settings.js";

export {
  CAMPAIGN_CLAIM_ISSUE_CODES,
  CAMPAIGN_GROUNDING_ISSUE_CODES,
  validateCampaignClaims,
  validateCampaignGrounding,
  validateProductEvidenceReferences,
  validateRenderedCampaign,
  type CampaignClaimIssue,
  type CampaignClaimIssueCode,
  type CampaignClaimValidation,
  type CampaignGroundingIssue,
  type CampaignGroundingIssueCode,
  type CampaignGroundingValidation,
} from "./validation/index.js";
