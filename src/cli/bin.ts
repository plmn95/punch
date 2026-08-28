#!/usr/bin/env node

import { runCli } from "./run-cli.js";
import { createTerminalPrompts, openPreview } from "./terminal.js";

const controller = new AbortController();
const cancel = (): void => controller.abort();
process.once("SIGINT", cancel);
process.once("SIGTERM", cancel);
const prompts = createTerminalPrompts(controller);

const exitCode = await runCli(process.argv.slice(2), {
  stdout: (value) => process.stdout.write(value),
  stderr: (value) => process.stderr.write(value),
  env: process.env,
  signal: controller.signal,
  stdinIsTTY: Boolean(process.stdin.isTTY),
  stdoutIsTTY: Boolean(process.stdout.isTTY),
  ask: prompts.ask,
  openPreview,
});

prompts.close();

process.removeListener("SIGINT", cancel);
process.removeListener("SIGTERM", cancel);
process.exitCode = exitCode;
