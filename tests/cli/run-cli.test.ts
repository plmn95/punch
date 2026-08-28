import { describe, expect, it } from "vitest";

import { runCli } from "../../src/cli/run-cli.js";

describe("CLI terminal output", () => {
  it("emits exactly one JSON value on stdout for a terminal failure", async () => {
    const stdout: string[] = [];
    const stderr: string[] = [];
    const exitCode = await runCli(
      [
        "generate",
        "--website",
        "https://kiln-and-leaf.example.com",
        "--product",
        "https://kiln-and-leaf.example.com/products/ember-mug",
        "--goal",
        "sales",
        "--output",
        "campaign",
        "--json",
      ],
      {
        stdout: (value) => stdout.push(value),
        stderr: (value) => stderr.push(value),
        env: {},
        signal: new AbortController().signal,
      },
    );

    expect(exitCode).toBe(1);
    expect(stdout).toHaveLength(1);
    expect(stderr).toEqual([]);
    expect(JSON.parse(stdout[0]!)).toEqual({
      ok: false,
      error: {
        code: "missing-arguments",
        message: "ANTHROPIC_API_KEY is required.",
        retryable: false,
      },
    });
  });

  it("shows help without requiring credentials", async () => {
    const stdout: string[] = [];
    const exitCode = await runCli(["--help"], {
      stdout: (value) => stdout.push(value),
      stderr: () => undefined,
      env: {},
      signal: new AbortController().signal,
    });

    expect(exitCode).toBe(0);
    expect(stdout.join("")).toContain("punch generate");
  });
});
