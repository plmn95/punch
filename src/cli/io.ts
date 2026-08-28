import { ExtractionError } from "../extraction/extraction-error.js";

export type CliIo = Readonly<{
  stdout: (value: string) => void;
  stderr: (value: string) => void;
  env: Readonly<Record<string, string | undefined>>;
  signal: AbortSignal;
  stdinIsTTY?: boolean;
  stdoutIsTTY?: boolean;
  ask?: (question: string) => Promise<string>;
  openPreview?: (path: string) => Promise<void>;
}>;

/** Reads one bounded answer and converts EOF, interruption and cancellation to a safe failure. */
export async function ask(io: CliIo, question: string): Promise<string> {
  if (io.signal.aborted || !io.ask)
    throw new ExtractionError("cancelled", false);
  let answer: string;
  try {
    answer = await io.ask(question);
  } catch {
    throw new ExtractionError("cancelled", false);
  }
  if (io.signal.aborted) throw new ExtractionError("cancelled", false);
  if (
    answer.length > 4096 ||
    /[\u0000-\u0008\u000b-\u001f\u007f]/u.test(answer)
  ) {
    io.stderr("Please enter a shorter value without control characters.\n");
    return ask(io, question);
  }
  return answer.trim();
}

/** Requires explicit agreement before paid generation or final publication. */
export async function confirm(io: CliIo, question: string): Promise<void> {
  const answer = await ask(io, `${question} [y/N] `);
  if (!/^y(?:es)?$/iu.test(answer))
    throw new ExtractionError("cancelled", false);
}

/** Allows guided input only in a real interactive terminal, never automation. */
export function interactiveAllowed(
  argv: readonly string[],
  io: CliIo,
): boolean {
  const ci = [
    "CI",
    "CONTINUOUS_INTEGRATION",
    "GITHUB_ACTIONS",
    "BUILD_NUMBER",
  ].some((key) => Boolean(io.env[key]));
  return Boolean(
    io.stdinIsTTY &&
    io.stdoutIsTTY &&
    io.ask &&
    !ci &&
    !argv.includes("--json") &&
    !argv.includes("--no-interactive"),
  );
}
