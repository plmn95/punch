import {
  GenerateCampaignInputSchema,
  type GenerateCampaignInput,
} from "../core/schemas/index.js";

const VALUE_FLAGS = new Set([
  "--website",
  "--product",
  "--goal",
  "--output",
  "--instructions",
  "--offer",
  "--discount-code",
  "--offer-ends-at",
]);
const BOOLEAN_FLAGS = new Set([
  "--trace",
  "--json",
  "--force",
  "--no-interactive",
]);

export type GenerateCommand = Readonly<{
  kind: "generate";
  input: GenerateCampaignInput;
  output: string;
  trace: boolean;
  json: boolean;
  force: boolean;
}>;

export type CliCommand =
  | GenerateCommand
  | Readonly<{ kind: "help" }>
  | Readonly<{ kind: "version" }>;

export type CliArgumentErrorCode =
  | "invalid-arguments"
  | "missing-arguments"
  | "unknown-command";

/** Stable usage error without echoing user-supplied values. */
export class CliArgumentError extends Error {
  readonly code: CliArgumentErrorCode;

  constructor(code: CliArgumentErrorCode, message: string) {
    super(message);
    this.name = "CliArgumentError";
    this.code = code;
  }
}

/** Parses the canonical non-interactive Punch command. */
export function parseCliArguments(argv: readonly string[]): CliCommand {
  if (argv.length === 0 || argv[0] === "--help" || argv[0] === "-h") {
    return { kind: "help" };
  }
  if (argv[0] === "--version" || argv[0] === "-v") {
    return { kind: "version" };
  }
  if (argv[0] !== "generate") {
    throw new CliArgumentError(
      "unknown-command",
      "Unknown command. Use punch --help.",
    );
  }
  return parseGenerate(argv.slice(1));
}

/** Parses generate flags without prompting or accepting positional input. */
function parseGenerate(argv: readonly string[]): GenerateCommand {
  const values = new Map<string, string[]>();
  const booleans = new Set<string>();
  for (let index = 0; index < argv.length; index += 1) {
    const flag = argv[index]!;
    if (BOOLEAN_FLAGS.has(flag)) {
      booleans.add(flag);
      continue;
    }
    if (!VALUE_FLAGS.has(flag)) {
      throw new CliArgumentError(
        "invalid-arguments",
        "Unknown or misplaced generate flag.",
      );
    }
    const value = argv[index + 1];
    if (value === undefined || value.startsWith("--")) {
      throw new CliArgumentError(
        "missing-arguments",
        "A generate flag is missing its value.",
      );
    }
    values.set(flag, [...(values.get(flag) ?? []), value]);
    index += 1;
  }
  return buildGenerateCommand(values, booleans);
}

/** Validates multiplicity and builds the public campaign input. */
function buildGenerateCommand(
  values: ReadonlyMap<string, readonly string[]>,
  booleans: ReadonlySet<string>,
): GenerateCommand {
  const website = singleValue(values, "--website");
  const goal = singleValue(values, "--goal");
  const output = singleValue(values, "--output");
  const products = values.get("--product") ?? [];
  if (!website || !goal || !output || products.length === 0) {
    throw new CliArgumentError(
      "missing-arguments",
      "Generate requires --website, --product, --goal and --output.",
    );
  }
  const input = campaignInput(values, website, products, goal);
  return {
    kind: "generate",
    input: GenerateCampaignInputSchema.parse(input),
    output,
    trace: booleans.has("--trace"),
    json: booleans.has("--json"),
    force: booleans.has("--force"),
  };
}

/** Returns one scalar flag and rejects accidental duplicates. */
function singleValue(
  values: ReadonlyMap<string, readonly string[]>,
  flag: string,
): string | undefined {
  const entries = values.get(flag);
  if (entries && entries.length > 1) {
    throw new CliArgumentError(
      "invalid-arguments",
      "A scalar flag was supplied more than once.",
    );
  }
  return entries?.[0];
}

/** Maps CLI offer flags to the discriminated public input schema. */
function campaignInput(
  values: ReadonlyMap<string, readonly string[]>,
  website: string,
  products: readonly string[],
  goal: string,
): unknown {
  const instructions = singleValue(values, "--instructions");
  const offerDescription = singleValue(values, "--offer");
  const code = singleValue(values, "--discount-code");
  const endsAt = singleValue(values, "--offer-ends-at");
  const base = {
    website,
    products,
    goal,
    ...(instructions ? { instructions } : {}),
  };
  if (goal !== "promotion") {
    if (offerDescription || code || endsAt) {
      throw new CliArgumentError(
        "invalid-arguments",
        "Offer flags require --goal promotion.",
      );
    }
    return base;
  }
  if (!offerDescription) {
    throw new CliArgumentError(
      "missing-arguments",
      "Promotion requires --offer.",
    );
  }
  return {
    ...base,
    offer: {
      description: offerDescription,
      ...(code ? { code } : {}),
      ...(endsAt ? { endsAt } : {}),
    },
  };
}
