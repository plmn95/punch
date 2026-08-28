import {
  parseBrandSettings,
  type BrandSettings,
  type BrandSettingKey,
} from "../brand/settings.js";
import { CliArgumentError } from "./cli-error.js";

export const BRAND_FLAGS: Readonly<Record<string, BrandSettingKey>> = {
  "--primary-colour": "primaryColour",
  "--background-colour": "backgroundColour",
  "--text-colour": "textColour",
  "--heading-font": "headingFont",
  "--body-font": "bodyFont",
};
const VALUE_FLAGS = new Set([
  "--website",
  "--product",
  "--goal",
  "--output",
  "--instructions",
  "--offer",
  "--discount-code",
  "--offer-ends-at",
  "--brand",
  "--save-brand",
  "--campaign",
  ...Object.keys(BRAND_FLAGS),
]);
const BOOLEAN_FLAGS = new Set([
  "--trace",
  "--json",
  "--force",
  "--no-interactive",
  "--interactive",
]);
export type CliFlags = { values: Map<string, string[]>; booleans: Set<string> };

/** Parses flags first, so unknown flags and duplicate scalars fail before prompting. */
export function readFlags(argv: readonly string[]): CliFlags {
  const values = new Map<string, string[]>();
  const booleans = new Set<string>();
  for (let index = 0; index < argv.length; index += 1) {
    const flag = argv[index]!;
    if (BOOLEAN_FLAGS.has(flag)) {
      booleans.add(flag);
      continue;
    }
    if (!VALUE_FLAGS.has(flag))
      throw new CliArgumentError(
        "invalid-arguments",
        "Unknown or misplaced flag.",
      );
    const value = argv[++index];
    if (value === undefined || value.startsWith("--"))
      throw new CliArgumentError(
        "invalid-arguments",
        "A flag is missing its value.",
      );
    if (flag !== "--product" && values.has(flag))
      throw new CliArgumentError(
        "invalid-arguments",
        "A scalar flag was supplied more than once.",
      );
    values.set(flag, [...(values.get(flag) ?? []), value]);
  }
  return { values, booleans };
}

/** Reads a single already-checked flag value. */
export function flagValue(flags: CliFlags, flag: string): string | undefined {
  return flags.values.get(flag)?.[0];
}

/** Parses overrides through the same schema used by the engine and wizard. */
export function brandFlags(flags: CliFlags): BrandSettings {
  return parseBrandSettings(
    Object.fromEntries(
      Object.entries(BRAND_FLAGS).flatMap(([flag, key]) => {
        const value = flagValue(flags, flag);
        return value === undefined ? [] : [[key, value]];
      }),
    ),
  );
}

/** Serialises a draft back through the canonical explicit parser. */
export function flagsToArgv(flags: CliFlags): string[] {
  return [...flags.values]
    .flatMap(([key, values]) => values.flatMap((value) => [key, value]))
    .concat([...flags.booleans]);
}
