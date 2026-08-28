import { z } from "zod";
import { HttpUrlSchema } from "../core/schemas/index.js";
import { parseCliArguments, type CliCommand } from "./arguments.js";
import { CliArgumentError } from "./cli-error.js";
import { flagsToArgv, readFlags, type CliFlags } from "./flags.js";
import { promptBrief, promptField, promptProducts } from "./guide-fields.js";
import { confirm, interactiveAllowed, type CliIo } from "./io.js";

const PathSchema = z
  .string()
  .trim()
  .min(1)
  .max(4096)
  .regex(/^[^\u0000-\u001f\u007f]+$/u);

/** Chooses explicit mode or a terminal-only guide, without prompting after unknown flags. */
export async function resolveInvocation(
  argv: readonly string[],
  io: CliIo,
): Promise<{ command: CliCommand; guided: boolean }> {
  if (
    !interactiveAllowed(argv, io) ||
    argv.some((arg) => ["--help", "-h", "--version", "-v"].includes(arg))
  ) {
    return { command: parseCliArguments(argv), guided: false };
  }
  const kind = argv[0] ?? "generate";
  if (kind !== "generate" && kind !== "render")
    return { command: parseCliArguments(argv), guided: false };
  const flags = readFlags(argv.slice(1));
  if (argv.length && !flags.booleans.has("--interactive")) {
    try {
      return { command: parseCliArguments(argv), guided: false };
    } catch (error) {
      if (
        !(error instanceof CliArgumentError) ||
        error.code !== "missing-arguments"
      )
        throw error;
    }
  }
  return { command: await guideCommand(kind, flags, io), guided: true };
}

/** Collects missing inputs then reparses the same flags used by automation. */
async function guideCommand(
  kind: "generate" | "render",
  flags: CliFlags,
  io: CliIo,
): Promise<CliCommand> {
  io.stderr(
    `\nPunch — ${kind === "generate" ? "guided generation" : "restyle an existing campaign"}\n\n1. Sources\n`,
  );
  if (kind === "generate") {
    await promptField(io, flags, "--website", "Brand website", HttpUrlSchema);
    await promptProducts(io, flags);
    await promptBrief(io, flags);
  } else {
    await promptField(
      io,
      flags,
      "--campaign",
      "Existing campaign.json",
      PathSchema,
    );
  }
  await promptField(
    io,
    flags,
    "--brand",
    "Saved brand profile (optional)",
    PathSchema,
    "",
    true,
  );
  await promptField(
    io,
    flags,
    "--output",
    "New output directory",
    PathSchema,
    kind === "render" ? "./campaign-restyled" : "./campaign",
  );
  const command = parseCliArguments([kind, ...flagsToArgv(flags)]);
  if (command.kind === "generate") {
    io.stderr(
      `\nWebsite: ${command.input.website}\nProducts: ${command.input.products.length}\nGoal: ${command.input.goal}\nOutput: ${command.output}\n`,
    );
    await confirm(
      io,
      "Fetch these pages and review the detected branding? No AI call yet.",
    );
  }
  return command;
}
