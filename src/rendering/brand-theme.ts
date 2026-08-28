import { contrastRatio, readableInk, tint } from "../brand/colour.js";
import {
  DEFAULT_BRAND_SETTINGS,
  type CompleteBrandSettings,
} from "../brand/settings.js";
import { EMAIL_THEME } from "./render-theme.js";

export type RenderTheme = {
  colours: { [K in keyof typeof EMAIL_THEME.colours]: string } & {
    link: string;
  };
  fonts: { body: string; display: string };
  geometry: typeof EMAIL_THEME.geometry;
  typography: typeof EMAIL_THEME.typography;
};

/** Builds an inert font stack without downloading or embedding font files. */
function fontStack(family: string): string {
  if (family === "Arial") return EMAIL_THEME.fonts.body;
  if (family === "Georgia") return EMAIL_THEME.fonts.display;
  if (/^(serif|sans-serif|monospace)$/u.test(family)) return family;
  const fallback =
    /(?:serif|times|georgia)/iu.test(family) && !/sans/iu.test(family)
      ? 'Georgia, "Times New Roman", serif'
      : 'Arial, "Helvetica Neue", Helvetica, sans-serif';
  return `"${family}", ${/courier|mono/iu.test(family) ? '"Courier New", monospace' : fallback}`;
}

/** Derives safe supporting surfaces while retaining the selected primary/background/ink. */
function brandColours(settings: CompleteBrandSettings): RenderTheme["colours"] {
  const {
    primaryColour: accent,
    backgroundColour: canvas,
    textColour: ink,
  } = settings;
  if (
    accent === DEFAULT_BRAND_SETTINGS.primaryColour &&
    canvas === DEFAULT_BRAND_SETTINGS.backgroundColour &&
    ink === DEFAULT_BRAND_SETTINGS.textColour
  ) {
    return { ...EMAIL_THEME.colours, link: EMAIL_THEME.colours.accent };
  }
  const surface = (amount: number): string => {
    const candidate = tint(canvas, accent, amount);
    return (contrastRatio(ink, candidate) ?? 0) >= 4.5 ? candidate : canvas;
  };
  const card = surface(0.04);
  const promotion = surface(0.08);
  const link = [canvas, card, promotion].every(
    (bg) => (contrastRatio(accent, bg) ?? 0) >= 4.5,
  )
    ? accent
    : ink;
  return {
    accent,
    link,
    canvas,
    card,
    promotion,
    code: canvas,
    primary: ink,
    body: ink,
    compliance: ink,
    page: tint(canvas, ink, 0.05),
    border: tint(canvas, ink, 0.18),
    promotionBorder: tint(canvas, accent, 0.3),
    buttonText: readableInk(accent),
  };
}

/** Creates an isolated render theme; no global style state is changed. */
export function createBrandTheme(settings: CompleteBrandSettings): RenderTheme {
  return {
    colours: brandColours(settings),
    fonts: {
      body: fontStack(settings.bodyFont),
      display: fontStack(settings.headingFont),
    },
    geometry: EMAIL_THEME.geometry,
    typography: EMAIL_THEME.typography,
  };
}
