import {
  GenerateCampaignInputSchema,
  GenerationContextSchema,
  SCHEMA_VERSION,
  type BrandEvidence,
  type GenerateCampaignInput,
  type ProductEvidence,
  type ProductId,
  productIdFromIndex,
} from "../core/schemas/index.js";
import {
  addModelUsage,
  zeroModelUsage,
  type ModelUsage,
} from "../providers/index.js";
import type {
  DeterministicBrandExtraction,
  DeterministicProductExtraction,
  ExtractionModelCall,
  ExtractionOptions,
  ExtractionResult,
} from "./contracts.js";
import {
  assertExtractionNotAborted,
  ExtractionError,
} from "./extraction-error.js";
import { extractBrand } from "./extract-brand.js";
import { extractProduct } from "./extract-product.js";
import {
  decodeResource,
  fetchRequiredSources,
  fetchStylesheets,
} from "./fetch-extraction-sources.js";
import {
  createPublicFetchSession,
  PublicFetchError,
  type PublicFetchSession,
} from "./http/index.js";
import { applyBrandFallback } from "./model-fallback.js";

type ProductSlot = Readonly<{
  productId: ProductId;
  suppliedUrl: string;
}>;

type DeterministicSources = Readonly<{
  brand: DeterministicBrandExtraction;
  products: readonly DeterministicProductExtraction[];
}>;

/** Extracts validated brand/product evidence and preserves explicit URL order. */
export async function extractGenerationContext(
  input: unknown,
  options: ExtractionOptions = {},
): Promise<ExtractionResult> {
  const parsed = parseInput(input);
  const signal = options.signal ?? new AbortController().signal;
  assertExtractionNotAborted(signal);
  const session = options.fetchSession ?? createPublicFetchSession({ signal });
  try {
    return await runExtraction(parsed, options, session, signal);
  } catch (error) {
    if (error instanceof ExtractionError || error instanceof PublicFetchError) {
      throw error;
    }
    throw new ExtractionError("invalid-source", false);
  } finally {
    session.dispose();
  }
}

/** Runs the extraction stages under one owned fetch-session lifetime. */
async function runExtraction(
  parsed: GenerateCampaignInput,
  options: ExtractionOptions,
  session: PublicFetchSession,
  signal: AbortSignal,
): Promise<ExtractionResult> {
  const deterministic = await extractDeterministicSources(
    parsed,
    session,
    signal,
  );
  const productEvidence = deterministic.products.map(
    (extraction) => extraction.evidence,
  );
  assertMinimumProductEvidence(productEvidence);
  const calls: ExtractionModelCall[] = [];
  const brand = await applyBrandFallback(
    deterministic.brand.evidence,
    deterministic.brand.segments,
    options.model,
    signal,
    calls,
  );
  const context = parseContext(parsed, brand, productEvidence);
  return { context, usage: { total: aggregateUsage(calls), calls } };
}

/** Fetches and parses all deterministic brand and product evidence. */
async function extractDeterministicSources(
  input: GenerateCampaignInput,
  session: PublicFetchSession,
  signal: AbortSignal,
): Promise<DeterministicSources> {
  const slots = createProductSlots(input);
  const [website, products] = await fetchRequiredSources(
    input.website,
    slots.map((slot) => slot.suppliedUrl),
    session,
  );
  const websiteSource = {
    finalUrl: website.finalUrl,
    html: decodeResource(website),
  };
  const initialBrand = extractBrand(websiteSource);
  const styles = await fetchStylesheets(
    initialBrand.stylesheetUrls,
    website.finalUrl,
    session,
    signal,
  );
  return {
    brand: extractBrand(websiteSource, styles),
    products: products.map((resource, index) =>
      extractProduct({
        ...slots[index]!,
        finalUrl: resource.finalUrl,
        html: decodeResource(resource),
      }),
    ),
  };
}

/** Parses canonical public input without exposing Zod issue details. */
function parseInput(input: unknown): GenerateCampaignInput {
  const parsed = GenerateCampaignInputSchema.safeParse(input);
  if (!parsed.success) {
    throw new ExtractionError("invalid-input", false);
  }
  return parsed.data;
}

/** Assigns stable IDs before any concurrent network work begins. */
function createProductSlots(input: GenerateCampaignInput): ProductSlot[] {
  return input.products.map((suppliedUrl, index) => ({
    productId: productIdFromIndex(index),
    suppliedUrl,
  }));
}

/** Builds the one canonical generation context from owned input fields. */
function parseContext(
  input: GenerateCampaignInput,
  brand: BrandEvidence,
  products: readonly ProductEvidence[],
) {
  const base = {
    schemaVersion: SCHEMA_VERSION,
    brand,
    products,
    goal: input.goal,
    ...(input.instructions ? { instructions: input.instructions } : {}),
  };
  const candidate =
    input.goal === "promotion" ? { ...base, offer: input.offer } : base;
  const parsed = GenerationContextSchema.safeParse(candidate);
  if (!parsed.success) {
    throw new ExtractionError("invalid-source", false);
  }
  return parsed.data;
}

/** Requires the minimum observed identity needed for grounded generation. */
function assertMinimumProductEvidence(
  products: readonly ProductEvidence[],
): void {
  if (
    products.some(
      (product) =>
        product.canonicalUrl.state !== "observed" ||
        product.name.state !== "observed",
    )
  ) {
    throw new ExtractionError("insufficient-product-evidence", false);
  }
}

/** Aggregates extraction usage without mixing generation stage accounting. */
function aggregateUsage(calls: readonly ExtractionModelCall[]): ModelUsage {
  return calls.reduce(
    (usage, call) => addModelUsage(usage, call.usage),
    zeroModelUsage(),
  );
}
