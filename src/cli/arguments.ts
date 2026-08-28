import {
  GenerateCampaignInputSchema,
  type GenerateCampaignInput,
} from "../core/schemas/index.js";
import type { BrandSettings } from "../brand/settings.js";
import { CliArgumentError } from "./cli-error.js";
import { brandFlags, flagValue, readFlags, type CliFlags } from "./flags.js";
import { localPath } from "./local-files.js";

export { CliArgumentError } from "./cli-error.js";
export type { CliArgumentErrorCode } from "./cli-error.js";

export type CommonCommand = Readonly<{
  output: string;
  json: boolean;
  force: boolean;
  brandPath?: string;
  saveBrandPath?: string;
}>;
export type GenerateCommand = CommonCommand &
  Readonly<{
    kind: "generate";
    input: GenerateCampaignInput;
    trace: boolean;
  }>;
export type RenderCommand = CommonCommand &
  Readonly<{
    kind: "render";
    campaignPath: string;
    brand: BrandSettings;
  }>;
export type CliCommand =
  | GenerateCommand
  | RenderCommand
  | Readonly<{ kind: "help" }>
  | Readonly<{ kind: "version" }>;

/** Parses explicit invocations without reading files, credentials or terminal state. */
export function parseCliArguments(argv: readonly string[]): CliCommand {
  if (argv.length === 0 || argv.includes("--help") || argv.includes("-h"))
    return { kind: "help" };
  if (argv[0] === "--version" || argv[0] === "-v") return { kind: "version" };
  if (argv[0] !== "generate" && argv[0] !== "render")
    throw new CliArgumentError(
      "unknown-command",
      "Unknown command. Use punch --help.",
    );
  const flags = readFlags(argv.slice(1));
  return argv[0] === "render" ? parseRender(flags) : parseGenerate(flags);
}

/** Collects shared options while refusing unsafe local path spellings. */
function commonCommand(flags: CliFlags): CommonCommand {
  const output = flagValue(flags, "--output");
  if (!output)
    throw new CliArgumentError(
      "missing-arguments",
      "Choose an --output directory.",
    );
  localPath(output);
  const brandPath = flagValue(flags, "--brand");
  const saveBrandPath = flagValue(flags, "--save-brand");
  return {
    output,
    json: flags.booleans.has("--json"),
    force: flags.booleans.has("--force"),
    ...(brandPath ? { brandPath: localPath(brandPath) } : {}),
    ...(saveBrandPath ? { saveBrandPath: localPath(saveBrandPath) } : {}),
  };
}

/** Validates generation flags through the canonical public input contract. */
function parseGenerate(flags: CliFlags): GenerateCommand {
  if (flags.values.has("--campaign"))
    throw new CliArgumentError(
      "invalid-arguments",
      "--campaign belongs to punch render.",
    );
  const website = flagValue(flags, "--website");
  const goal = flagValue(flags, "--goal");
  const products = flags.values.get("--product") ?? [];
  if (!website || !goal || products.length === 0)
    throw new CliArgumentError(
      "missing-arguments",
      "Generate requires --website, --product, --goal and --output.",
    );
  const offer = offerFlags(flags, goal);
  const instructions = flagValue(flags, "--instructions");
  const brand = brandFlags(flags);
  const input = GenerateCampaignInputSchema.parse({
    website,
    products,
    goal,
    ...(instructions ? { instructions } : {}),
    ...(Object.keys(brand).length ? { brand } : {}),
    ...(offer ? { offer } : {}),
  });
  return {
    ...commonCommand(flags),
    kind: "generate",
    input,
    trace: flags.booleans.has("--trace"),
  };
}

/** Keeps offer requirements identical in explicit and guided generation. */
function offerFlags(flags: CliFlags, goal: string) {
  const description = flagValue(flags, "--offer");
  const code = flagValue(flags, "--discount-code");
  const endsAt = flagValue(flags, "--offer-ends-at");
  if (goal !== "promotion" && (description || code || endsAt))
    throw new CliArgumentError(
      "invalid-arguments",
      "Offer flags require --goal promotion.",
    );
  if (goal === "promotion" && !description)
    throw new CliArgumentError(
      "missing-arguments",
      "Promotion requires --offer.",
    );
  return goal === "promotion"
    ? { description, ...(code ? { code } : {}), ...(endsAt ? { endsAt } : {}) }
    : undefined;
}

/** Parses a render-only invocation that never requires an API key. */
function parseRender(flags: CliFlags): RenderCommand {
  const allowed = new Set([
    "--campaign",
    "--output",
    "--brand",
    "--save-brand",
    "--primary-colour",
    "--background-colour",
    "--text-colour",
    "--heading-font",
    "--body-font",
  ]);
  if (
    [...flags.values.keys()].some((key) => !allowed.has(key)) ||
    flags.booleans.has("--trace")
  )
    throw new CliArgumentError(
      "invalid-arguments",
      "Generation-only flags cannot be used with punch render.",
    );
  const campaignPath = flagValue(flags, "--campaign");
  if (!campaignPath)
    throw new CliArgumentError(
      "missing-arguments",
      "Render requires --campaign and --output.",
    );
  return {
    ...commonCommand(flags),
    kind: "render",
    campaignPath: localPath(campaignPath),
    brand: brandFlags(flags),
  };
}
