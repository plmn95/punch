import { ZodError } from "zod";

import { ExtractionError } from "../extraction/extraction-error.js";
import { GenerationError } from "../generation/generation-error.js";
import { OutputError } from "../output/index.js";
import { BrandStyleError } from "../brand/settings.js";
import { PublicFetchError } from "../extraction/http/index.js";
import { CliArgumentError } from "./arguments.js";
import { resolveInvocation } from "./guide-command.js";
import { executeCommand } from "./execute-command.js";
import type { CliIo } from "./io.js";
export type { CliIo } from "./io.js";
import { CLI_HELP } from "./help.js";

export const PUNCH_VERSION = "0.1.0";

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
    const { command, guided } = await resolveInvocation(argv, io);
    if (command.kind === "help") {
      io.stdout(CLI_HELP);
      return 0;
    }
    if (command.kind === "version") {
      io.stdout(`${PUNCH_VERSION}\n`);
      return 0;
    }
    json = command.json;
    const output = await executeCommand(command, io, guided);
    writeSuccess(io, json, output, command.kind);
    return 0;
  } catch (error) {
    const failure = normaliseCliFailure(error);
    writeFailure(io, json, failure);
    return failure.code === "cancelled" ? 130 : 1;
  }
}

/** Writes one stable success result without mixing stdout modes. */
function writeSuccess(
  io: CliIo,
  json: boolean,
  output: string,
  kind: "generate" | "render",
): void {
  if (json) {
    io.stdout(
      `${JSON.stringify({ ok: true, status: "valid", output, validationScope: kind === "render" ? "render-only" : "generation-and-render" })}\n`,
    );
    return;
  }
  io.stdout(
    `${kind === "render" ? "Rendered" : "Generated"} a validated campaign in ${output}\n`,
  );
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
  if (
    error instanceof ExtractionError ||
    error instanceof GenerationError ||
    error instanceof BrandStyleError ||
    error instanceof PublicFetchError
  ) {
    return {
      code: error.code,
      message: error.message,
      retryable:
        "retryable" in error
          ? error.retryable
          : ["network", "timeout", "dns-failure"].includes(error.code),
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
