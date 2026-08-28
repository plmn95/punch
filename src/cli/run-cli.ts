import { ZodError } from "zod";

import { generateCampaign } from "../core/generate-campaign.js";
import { ExtractionError } from "../extraction/extraction-error.js";
import { GenerationError } from "../generation/generation-error.js";
import { OutputError, writeCampaignOutput } from "../output/index.js";
import { createAnthropicProvider } from "../providers/anthropic.js";
import { CliArgumentError, parseCliArguments } from "./arguments.js";
import { CLI_HELP } from "./help.js";

export const PUNCH_VERSION = "0.1.0";

export type CliIo = Readonly<{
  stdout: (value: string) => void;
  stderr: (value: string) => void;
  env: Readonly<Record<string, string | undefined>>;
  signal: AbortSignal;
}>;

type CliFailure = Readonly<{
  code: string;
  message: string;
  retryable: boolean;
}>;

/** Runs one complete CLI invocation and returns its process exit code. */
export async function runCli(
  argv: readonly string[],
  io: CliIo,
): Promise<number> {
  let json = argv.includes("--json");
  try {
    const command = parseCliArguments(argv);
    if (command.kind === "help") {
      io.stdout(CLI_HELP);
      return 0;
    }
    if (command.kind === "version") {
      io.stdout(`${PUNCH_VERSION}\n`);
      return 0;
    }
    json = command.json;
    const apiKey = io.env.ANTHROPIC_API_KEY?.trim();
    if (!apiKey) {
      throw new CliArgumentError(
        "missing-arguments",
        "ANTHROPIC_API_KEY is required.",
      );
    }
    const result = await generateCampaign(command.input, {
      provider: createAnthropicProvider({ apiKey }),
      signal: io.signal,
      trace: command.trace,
    });
    const output = await writeCampaignOutput(result, command.output, {
      force: command.force,
    });
    writeSuccess(io, json, output);
    return 0;
  } catch (error) {
    const failure = normaliseCliFailure(error);
    writeFailure(io, json, failure);
    return failure.code === "cancelled" ? 130 : 1;
  }
}

/** Writes one stable success result without mixing stdout modes. */
function writeSuccess(io: CliIo, json: boolean, output: string): void {
  if (json) {
    io.stdout(`${JSON.stringify({ ok: true, status: "valid", output })}\n`);
    return;
  }
  io.stdout(`Generated a validated campaign in ${output}\n`);
}

/** Writes exactly one JSON failure or one plain stderr diagnostic. */
function writeFailure(io: CliIo, json: boolean, failure: CliFailure): void {
  if (json) {
    io.stdout(`${JSON.stringify({ ok: false, error: failure })}\n`);
    return;
  }
  io.stderr(`Punch failed: ${failure.message}\n`);
}

/** Converts all known errors to stable, non-sensitive terminal failures. */
function normaliseCliFailure(error: unknown): CliFailure {
  if (error instanceof CliArgumentError) {
    return { code: error.code, message: error.message, retryable: false };
  }
  if (error instanceof ZodError) {
    return {
      code: "invalid-input",
      message: "Campaign input is invalid. Use punch --help.",
      retryable: false,
    };
  }
  if (error instanceof ExtractionError || error instanceof GenerationError) {
    return {
      code: error.code,
      message: error.message,
      retryable: error.retryable,
    };
  }
  if (error instanceof OutputError) {
    return { code: error.code, message: error.message, retryable: false };
  }
  return {
    code: "unexpected-failure",
    message: "Punch could not complete the campaign.",
    retryable: false,
  };
}
