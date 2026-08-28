import { z } from "zod";

import { HttpUrlSchema } from "../core/schemas/primitives.js";

export const BRAND_KEYS = [
  "primaryColour",
  "backgroundColour",
  "textColour",
  "headingFont",
  "bodyFont",
] as const;

export const HexColourSchema = z
  .string()
  .trim()
  .regex(/^#[\da-f]{6}$/iu, "Use a six-digit hex colour, for example #2563EB")
  .transform((value) => value.toUpperCase());

export const FontFamilySchema = z
  .string()
  .trim()
  .min(1)
  .max(80)
  .regex(/^[a-z][a-z\d -]*$/iu, "Use a single font family name, without CSS")
  .refine(
    (value) =>
      !["inherit", "initial", "unset", "revert", "revert-layer"].includes(
        value.toLowerCase(),
      ),
  );

export const CompleteBrandSettingsSchema = z.strictObject({
  primaryColour: HexColourSchema,
  backgroundColour: HexColourSchema,
  textColour: HexColourSchema,
  headingFont: FontFamilySchema,
  bodyFont: FontFamilySchema,
});
export const BrandSettingsSchema = CompleteBrandSettingsSchema.partial();
export const BrandProfileSchema = z.strictObject({
  version: z.literal("1"),
  settings: BrandSettingsSchema,
});
export const BrandStyleEvidenceSchema = z.partialRecord(
  z.enum(BRAND_KEYS),
  z.strictObject({
    value: z.string().max(80),
    confidence: z.enum(["explicit", "semantic"]),
    evidence: z.strictObject({
      url: HttpUrlSchema,
      field: z.string().max(120),
    }),
  }),
);
export const ResolvedBrandSchema = z.strictObject({
  settings: CompleteBrandSettingsSchema,
  sources: z.record(
    z.enum(BRAND_KEYS),
    z.enum(["manual", "website", "fallback"]),
  ),
  warnings: z
    .array(
      z.enum([
        "text-contrast-fallback",
        "accessible-link-colour",
        "font-fallbacks",
      ]),
    )
    .max(3),
});

export type BrandSettings = z.infer<typeof BrandSettingsSchema>;
export type CompleteBrandSettings = z.infer<typeof CompleteBrandSettingsSchema>;
export type BrandSettingKey = (typeof BRAND_KEYS)[number];
export type BrandStyleEvidence = z.infer<typeof BrandStyleEvidenceSchema>;
export type ResolvedBrand = z.infer<typeof ResolvedBrandSchema>;
export type BrandReviewer = (brand: ResolvedBrand) => Promise<BrandSettings>;

export const DEFAULT_BRAND_SETTINGS: Readonly<CompleteBrandSettings> =
  Object.freeze({
    primaryColour: "#9A5137",
    backgroundColour: "#FFFDF9",
    textColour: "#2F251F",
    headingFont: "Georgia",
    bodyFont: "Arial",
  });

/** Safe brand failure that never echoes untrusted CSS or file contents. */
export class BrandStyleError extends Error {
  readonly code = "invalid-brand";
  readonly retryable = false;

  constructor(
    message = "Brand settings are invalid. Check hex colours and font family names.",
  ) {
    super(message);
    this.name = "BrandStyleError";
  }
}

/** Validates caller-owned overrides without retaining unsafe input in errors. */
export function parseBrandSettings(value: unknown): BrandSettings {
  const parsed = BrandSettingsSchema.safeParse(value);
  if (!parsed.success) throw new BrandStyleError();
  return parsed.data;
}
