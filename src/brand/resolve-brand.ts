import { contrastRatio, readableInk } from "./colour.js";
import {
  BRAND_KEYS,
  BrandStyleEvidenceSchema,
  BrandStyleError,
  CompleteBrandSettingsSchema,
  DEFAULT_BRAND_SETTINGS,
  parseBrandSettings,
  ResolvedBrandSchema,
  type BrandStyleEvidence,
  type CompleteBrandSettings,
  type ResolvedBrand,
} from "./settings.js";

/** Resolves role-aware website evidence and explicit overrides independently per run. */
export function resolveBrand(
  evidence: BrandStyleEvidence = {},
  overrides: unknown = {},
): ResolvedBrand {
  const facts = BrandStyleEvidenceSchema.parse(evidence);
  const manual = parseBrandSettings(overrides);
  const settings = { ...DEFAULT_BRAND_SETTINGS };
  const sources = Object.fromEntries(
    BRAND_KEYS.map((key) => [key, "fallback"]),
  ) as ResolvedBrand["sources"];
  for (const key of BRAND_KEYS) {
    const candidate = CompleteBrandSettingsSchema.shape[key].safeParse(
      facts[key]?.value,
    );
    if (candidate.success) {
      settings[key] = candidate.data;
      sources[key] = "website";
    }
    if (manual[key] !== undefined) {
      settings[key] = manual[key];
      sources[key] = "manual";
    }
  }
  const warnings: ResolvedBrand["warnings"] = [];
  if (
    (contrastRatio(settings.textColour, settings.backgroundColour) ?? 0) < 4.5
  ) {
    if (manual.textColour !== undefined) {
      throw new BrandStyleError(
        `Text and background need at least 4.5:1 contrast. Suggested text: ${readableInk(settings.backgroundColour)}.`,
      );
    }
    settings.textColour = readableInk(settings.backgroundColour);
    sources.textColour = "fallback";
    warnings.push("text-contrast-fallback");
  }
  warnings.push(...styleWarnings(settings));
  return ResolvedBrandSchema.parse({ settings, sources, warnings });
}

/** Explains safe link/font substitutions without changing caller-owned settings. */
function styleWarnings(
  settings: CompleteBrandSettings,
): ResolvedBrand["warnings"] {
  const warnings: ResolvedBrand["warnings"] = [];
  if (
    (contrastRatio(settings.primaryColour, settings.backgroundColour) ?? 0) <
    4.5
  )
    warnings.push("accessible-link-colour");
  if (
    [settings.bodyFont, settings.headingFont].some(
      (font) =>
        !/^(Arial|Georgia|Helvetica|Verdana|Tahoma|Times New Roman|Courier New|Trebuchet MS|serif|sans-serif|monospace)$/iu.test(
          font,
        ),
    )
  )
    warnings.push("font-fallbacks");
  return warnings;
}
