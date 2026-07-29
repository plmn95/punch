import { z } from "zod";

import { OfferInputSchema } from "./input.js";
import {
  HttpUrlSchema,
  LabelTextSchema,
  LongTextSchema,
  MoneySchema,
  ProductIdSchema,
  SchemaVersionSchema,
  ShortTextSchema,
} from "./primitives.js";

const EvidenceFieldSchema = z
  .string()
  .trim()
  .min(1)
  .max(120)
  .regex(/^[a-z][a-z0-9]*(?:[.-][a-z0-9]+)*$/u);

const MAX_GENERATION_CONTEXT_BYTES = 256_000;

/** Returns the UTF-8 size of one serialisable validated value. */
function serialisedByteLength(value: unknown): number {
  return new TextEncoder().encode(JSON.stringify(value)).byteLength;
}

export const EvidenceRefSchema = z.discriminatedUnion("source", [
  z.strictObject({
    source: z.literal("website"),
    url: HttpUrlSchema,
    field: EvidenceFieldSchema,
  }),
  z.strictObject({
    source: z.literal("product"),
    productId: ProductIdSchema,
    url: HttpUrlSchema,
    field: EvidenceFieldSchema,
  }),
  z.strictObject({
    source: z.literal("user"),
    field: z.enum([
      "website",
      "product-url",
      "goal",
      "instructions",
      "offer-description",
      "offer-code",
      "offer-ends-at",
    ]),
  }),
]);

/** Creates one evidence-backed candidate for an observed value. */
function createEvidenceCandidateSchema<T extends z.ZodType>(valueSchema: T) {
  return z.strictObject({
    value: valueSchema,
    evidence: z.array(EvidenceRefSchema).min(1).max(8),
  });
}

/** Reads a candidate value without trusting its runtime shape. */
function readCandidateValue(candidate: unknown): unknown {
  if (
    candidate !== null &&
    typeof candidate === "object" &&
    "value" in candidate
  ) {
    return candidate.value;
  }
  return undefined;
}

/** Reports whether all candidate values are structurally distinct. */
function hasDistinctCandidateValues(candidates: readonly unknown[]): boolean {
  const values = candidates.map((candidate) =>
    JSON.stringify(readCandidateValue(candidate)),
  );
  return new Set(values).size === values.length;
}

/** Creates an observed, conflicted, or unknown critical-fact schema. */
export function createCriticalFactSchema<T extends z.ZodType>(valueSchema: T) {
  const candidateSchema = createEvidenceCandidateSchema(valueSchema);

  return z
    .discriminatedUnion("state", [
      z.strictObject({
        state: z.literal("observed"),
        value: valueSchema,
        evidence: z.array(EvidenceRefSchema).min(1).max(8),
      }),
      z.strictObject({
        state: z.literal("conflicted"),
        candidates: z.array(candidateSchema).min(2).max(6),
      }),
      z.strictObject({
        state: z.literal("unknown"),
      }),
    ])
    .superRefine((fact, context) => {
      if (
        "candidates" in fact &&
        !hasDistinctCandidateValues(fact.candidates)
      ) {
        context.addIssue({
          code: "custom",
          message: "Conflicted evidence must contain distinct candidate values",
          path: ["candidates"],
        });
      }
    });
}

/** Creates a fact schema that additionally permits labelled inference. */
export function createDescriptiveFactSchema<T extends z.ZodType>(
  valueSchema: T,
) {
  const candidateSchema = createEvidenceCandidateSchema(valueSchema);

  return z
    .discriminatedUnion("state", [
      z.strictObject({
        state: z.literal("observed"),
        value: valueSchema,
        evidence: z.array(EvidenceRefSchema).min(1).max(8),
      }),
      z.strictObject({
        state: z.literal("inferred"),
        value: valueSchema,
        evidence: z.array(EvidenceRefSchema).min(1).max(8),
        rationale: ShortTextSchema,
      }),
      z.strictObject({
        state: z.literal("conflicted"),
        candidates: z.array(candidateSchema).min(2).max(6),
      }),
      z.strictObject({
        state: z.literal("unknown"),
      }),
    ])
    .superRefine((fact, context) => {
      if (
        "candidates" in fact &&
        !hasDistinctCandidateValues(fact.candidates)
      ) {
        context.addIssue({
          code: "custom",
          message: "Conflicted evidence must contain distinct candidate values",
          path: ["candidates"],
        });
      }
    });
}

const HexColourSchema = z
  .string()
  .trim()
  .regex(/^#[0-9A-F]{6}$/iu)
  .transform((value) => value.toUpperCase());

const VoiceSchema = z.strictObject({
  summary: LongTextSchema,
  traits: z.array(LabelTextSchema).min(1).max(6),
});

export const BrandEvidenceSchema = z.strictObject({
  websiteUrl: HttpUrlSchema,
  name: createCriticalFactSchema(ShortTextSchema),
  logoUrl: createCriticalFactSchema(HttpUrlSchema),
  colours: createDescriptiveFactSchema(z.array(HexColourSchema).min(1).max(8)),
  fonts: createDescriptiveFactSchema(z.array(ShortTextSchema).min(1).max(8)),
  voice: createDescriptiveFactSchema(VoiceSchema),
});

export const AvailabilitySchema = z.enum([
  "in-stock",
  "out-of-stock",
  "preorder",
  "backorder",
  "discontinued",
]);

export const ProductEvidenceSchema = z.strictObject({
  productId: ProductIdSchema,
  suppliedUrl: HttpUrlSchema,
  canonicalUrl: createCriticalFactSchema(HttpUrlSchema),
  name: createCriticalFactSchema(ShortTextSchema),
  price: createCriticalFactSchema(MoneySchema),
  availability: createCriticalFactSchema(AvailabilitySchema),
  imageUrl: createCriticalFactSchema(HttpUrlSchema),
  description: createDescriptiveFactSchema(LongTextSchema),
});

const generationContextBase = {
  schemaVersion: SchemaVersionSchema,
  brand: BrandEvidenceSchema,
  products: z.array(ProductEvidenceSchema).min(1).max(6),
  instructions: LongTextSchema.optional(),
};

const generationContextUnion = z.discriminatedUnion("goal", [
  z.strictObject({
    ...generationContextBase,
    goal: z.literal("sales"),
  }),
  z.strictObject({
    ...generationContextBase,
    goal: z.literal("product-launch"),
  }),
  z.strictObject({
    ...generationContextBase,
    goal: z.literal("promotion"),
    offer: OfferInputSchema,
  }),
]);

export const GenerationContextSchema = generationContextUnion.superRefine(
  (generationContext, context) => {
    const productIds = generationContext.products.map(
      (product) => product.productId,
    );
    const suppliedUrls = generationContext.products.map(
      (product) => product.suppliedUrl,
    );

    if (new Set(productIds).size !== productIds.length) {
      context.addIssue({
        code: "custom",
        message: "Product evidence IDs must be unique",
        path: ["products"],
      });
    }

    if (new Set(suppliedUrls).size !== suppliedUrls.length) {
      context.addIssue({
        code: "custom",
        message: "Supplied product URLs must be unique",
        path: ["products"],
      });
    }

    if (
      serialisedByteLength(generationContext) > MAX_GENERATION_CONTEXT_BYTES
    ) {
      context.addIssue({
        code: "custom",
        message: "Generation context exceeds the aggregate byte limit",
        path: [],
      });
    }
  },
);

export type EvidenceRef = z.infer<typeof EvidenceRefSchema>;
export type BrandEvidence = z.infer<typeof BrandEvidenceSchema>;
export type Availability = z.infer<typeof AvailabilitySchema>;
export type ProductEvidence = z.infer<typeof ProductEvidenceSchema>;
export type GenerationContext = z.infer<typeof GenerationContextSchema>;
