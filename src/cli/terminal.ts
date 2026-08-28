import { spawn } from "node:child_process";
import { createInterface, type Interface } from "node:readline/promises";
import { pathToFileURL } from "node:url";

/** Lazily owns readline only when the CLI has selected interactive mode. */
export function createTerminalPrompts(controller: AbortController) {
  let readline: Interface | undefined;
  let pending = false;
  return {
    ask: async (question: string): Promise<string> => {
      if (!readline) {
        readline = createInterface({
          input: process.stdin,
          output: process.stderr,
          terminal: Boolean(process.stdin.isTTY && process.stderr.isTTY),
        });
        readline.on("SIGINT", () => controller.abort());
        readline.on("close", () => {
          if (pending) controller.abort();
        });
      }
      pending = true;
      try {
        return await readline.question(question, { signal: controller.signal });
      } finally {
        pending = false;
      }
    },
    close: (): void => readline?.close(),
  };
}

/** Opens only a caller-requested, generated preview using arguments rather than a shell. */
export async function openPreview(path: string): Promise<void> {
  const command =
    process.platform === "darwin"
      ? "open"
      : process.platform === "win32"
        ? "explorer.exe"
        : "xdg-open";
  await new Promise<void>((resolve, reject) => {
    const child = spawn(command, [pathToFileURL(path).href], {
      shell: false,
      stdio: "ignore",
    });
    child.once("error", reject);
    child.once("exit", (code) =>
      code === 0 ? resolve() : reject(new Error("Preview opener failed.")),
    );
  });
}
