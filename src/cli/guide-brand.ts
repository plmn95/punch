import { readableInk } from "../brand/colour.js";
import { resolveBrand } from "../brand/resolve-brand.js";
import {
  BRAND_KEYS,
  BrandStyleError,
  CompleteBrandSettingsSchema,
  type BrandSettings,
  type ResolvedBrand,
} from "../brand/settings.js";
import { ask, type CliIo } from "./io.js";

const LABELS = [
  "Primary colour",
  "Background",
  "Text colour",
  "Heading font",
  "Body font",
];
const WARNINGS = {
  "text-contrast-fallback":
    "Detected text was unreadable on the background; a readable fallback is shown.",
  "accessible-link-colour":
    "The primary colour stays on buttons; links use readable ink.",
  "font-fallbacks":
    "Custom fonts are named, not downloaded. Email-safe fallback fonts are included.",
};

/** Displays validated settings and their origins, with optional terminal swatches. */
function showBrand(io: CliIo, brand: ResolvedBrand): void {
  io.stderr("\n3. Review branding — Enter keeps these settings\n");
  BRAND_KEYS.forEach((key, index) => {
    const value = brand.settings[key];
    const swatch =
      key.endsWith("Colour") && io.stdoutIsTTY && !io.env.NO_COLOR
        ? colourSwatch(value)
        : "";
    io.stderr(
      `  ${index + 1}. ${LABELS[index]}: ${swatch}${value} (${brand.sources[key]})\n`,
    );
  });
  brand.warnings.forEach((warning) =>
    io.stderr(`  Note: ${WARNINGS[warning]}\n`),
  );
}

/** Produces a colour swatch only from a validated six-digit hexadecimal value. */
function colourSwatch(hex: string): string {
  const channels = [1, 3, 5].map((offset) =>
    Number.parseInt(hex.slice(offset, offset + 2), 16),
  );
  return `\u001b[48;2;${channels.join(";")}m  \u001b[0m `;
}

/** Lets the user correct individual slots while retaining untouched detection provenance. */
export async function editBrand(
  io: CliIo,
  initial: ResolvedBrand,
): Promise<BrandSettings> {
  let changes: BrandSettings = {};
  let current = initial;
  for (;;) {
    showBrand(io, current);
    const choice = await ask(
      io,
      "Change 1–5, reset changes (r), or Enter to continue: ",
    );
    if (!choice) return changes;
    if (choice === "r") {
      changes = {};
      current = initial;
      continue;
    }
    const index = Number(choice) - 1;
    const key = BRAND_KEYS[index];
    if (!key) {
      io.stderr("Choose a number from 1 to 5.\n");
      continue;
    }
    const value = await ask(
      io,
      `${LABELS[index]} (${key.endsWith("Colour") ? "#RRGGBB" : "one font family name"}): `,
    );
    const parsed = CompleteBrandSettingsSchema.shape[key].safeParse(value);
    if (!parsed.success) {
      io.stderr(
        "Use six-digit hex colours or a single plain font family name.\n",
      );
      continue;
    }
    const candidate = { ...changes, [key]: parsed.data };
    const accepted = await validateEdit(io, initial, candidate);
    if (accepted) {
      changes = accepted.changes;
      current = accepted.brand;
    }
  }
}

/** Offers an explicit text correction instead of silently changing a manual colour. */
async function validateEdit(
  io: CliIo,
  initial: ResolvedBrand,
  changes: BrandSettings,
): Promise<{ changes: BrandSettings; brand: ResolvedBrand } | undefined> {
  try {
    const brand = resolveBrand({}, { ...initial.settings, ...changes });
    for (const key of BRAND_KEYS)
      if (changes[key] === undefined) brand.sources[key] = initial.sources[key];
    return { changes, brand };
  } catch (error) {
    if (!(error instanceof BrandStyleError)) throw error;
    const suggested = readableInk(
      changes.backgroundColour ?? initial.settings.backgroundColour,
    );
    io.stderr(
      `That text/background combination is unreadable. Suggested text: ${suggested}.\n`,
    );
    if (
      !/^y(?:es)?$/iu.test(await ask(io, "Apply that text correction? [y/N] "))
    )
      return undefined;
    return validateEdit(io, initial, { ...changes, textColour: suggested });
  }
}
