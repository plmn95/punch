import { describe, expect, it, vi } from "vitest";
import { resolveInvocation } from "../../src/cli/guide-command.js";
import { editBrand } from "../../src/cli/guide-brand.js";
import { interactiveAllowed, type CliIo } from "../../src/cli/io.js";
import { resolveBrand } from "../../src/brand/resolve-brand.js";

const complete = [
  "generate",
  "--website",
  "https://grove.example.com",
  "--product",
  "https://grove.example.com/mug",
  "--goal",
  "sales",
  "--output",
  "campaign",
];

/** Creates a finite terminal script that fails on any unexpected extra prompt. */
function terminal(answers: string[] = [], extra: Partial<CliIo> = {}) {
  const questions: string[] = [];
  const io: CliIo = {
    stdinIsTTY: true,
    stdoutIsTTY: true,
    env: { NO_COLOR: "1" },
    signal: new AbortController().signal,
    stdout: vi.fn(),
    stderr: vi.fn(),
    ask: vi.fn(async (question) => {
      questions.push(question);
      const answer = answers.shift();
      if (answer === undefined) throw new Error("Unexpected prompt");
      return answer;
    }),
    ...extra,
  };
  return { io, questions };
}

describe("terminal-only guided input", () => {
  it.each([
    { stdinIsTTY: false },
    { stdoutIsTTY: false },
    { env: { CI: "true" } },
    { env: { GITHUB_ACTIONS: "true" } },
  ])("does not guide unsafe terminal state %j", async (state) => {
    const { io } = terminal([], state);
    expect(interactiveAllowed([], io)).toBe(false);
    await expect(resolveInvocation(["generate"], io)).rejects.toThrow();
    expect(io.ask).not.toHaveBeenCalled();
  });

  it.each(["--json", "--no-interactive"])(
    "never prompts with %s even when interactive was requested",
    async (flag) => {
      const { io } = terminal();
      const invocation = await resolveInvocation(
        [...complete, "--interactive", flag],
        io,
      );
      expect(invocation.guided).toBe(false);
      expect(io.ask).not.toHaveBeenCalled();
    },
  );

  it("leaves complete commands prompt-free and rejects typos before questions", async () => {
    const { io } = terminal();
    expect((await resolveInvocation(complete, io)).guided).toBe(false);
    await expect(
      resolveInvocation(
        ["generate", "--webiste", "https://grove.example.com"],
        io,
      ),
    ).rejects.toThrow("Unknown");
    expect(io.ask).not.toHaveBeenCalled();
  });

  it("guides a bare invocation, retries a URL, and supports product removal", async () => {
    const { io, questions } = terminal([
      "bad-url",
      "https://grove.example.com",
      "https://grove.example.com/mug",
      "https://grove.example.com/bowl",
      "remove 1",
      "",
      "",
      "A gift campaign",
      "",
      "",
      "y",
    ]);
    const result = await resolveInvocation([], io);
    expect(result.guided).toBe(true);
    expect(result.command).toMatchObject({
      kind: "generate",
      input: {
        products: ["https://grove.example.com/bowl"],
        instructions: "A gift campaign",
        goal: "sales",
      },
    });
    expect(
      questions.filter((question) => question.startsWith("Brand website")),
    ).toHaveLength(2);
  });

  it("edits hex colours with an explicit contrast repair and supports reset", async () => {
    const { io } = terminal([
      "1",
      "red",
      "1",
      "#2563eb",
      "2",
      "#111111",
      "y",
      "",
    ]);
    const changed = await editBrand(io, resolveBrand());
    expect(changed).toEqual({
      primaryColour: "#2563EB",
      backgroundColour: "#111111",
      textColour: "#FFFFFF",
    });
    expect(
      await editBrand(terminal(["1", "#2563eb", "r", ""]).io, resolveBrand()),
    ).toEqual({});
  });

  it("treats EOF and abort as cancellation without retries", async () => {
    await expect(resolveInvocation([], terminal().io)).rejects.toMatchObject({
      code: "cancelled",
    });
    const controller = new AbortController();
    controller.abort();
    const { io } = terminal([], { signal: controller.signal });
    await expect(resolveInvocation([], io)).rejects.toMatchObject({
      code: "cancelled",
    });
    expect(io.ask).not.toHaveBeenCalled();
  });
});
