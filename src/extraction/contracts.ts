import type {
  BrandEvidence,
  GenerationContext,
  ProductId,
  ProductEvidence,
} from "../core/schemas/index.js";
import type { ModelUsage, TextModel } from "../providers/index.js";
import type { PublicFetchSession } from "./http/index.js";

export type ExtractionModelCall = Readonly<{
  stage: "extract-brand";
  usage: ModelUsage;
}>;

export type ExtractionUsage = Readonly<{
  total: ModelUsage;
  calls: readonly ExtractionModelCall[];
}>;

export type ExtractionResult = Readonly<{
  context: GenerationContext;
  usage: ExtractionUsage;
}>;

export type ExtractionOptions = Readonly<{
  model?: TextModel;
  signal?: AbortSignal;
  fetchSession?: PublicFetchSession;
}>;

export type SourceSegment = Readonly<{
  id: string;
  field: string;
  text: string;
}>;

export type HtmlSource = Readonly<{
  finalUrl: string;
  html: string;
}>;

export type ProductSource = HtmlSource &
  Readonly<{
    productId: ProductId;
    suppliedUrl: string;
  }>;

export type CssSource = Readonly<{
  url: string;
  css: string;
  field: string;
}>;

export type DeterministicBrandExtraction = Readonly<{
  evidence: BrandEvidence;
  segments: readonly SourceSegment[];
  stylesheetUrls: readonly string[];
}>;

export type DeterministicProductExtraction = Readonly<{
  evidence: ProductEvidence;
}>;
