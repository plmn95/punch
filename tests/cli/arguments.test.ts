import { describe, expect, it } from "vitest";

import {
  CliArgumentError,
  parseCliArguments,
} from "../../src/cli/arguments.js";

describe("explicit CLI arguments", () => {
  it("preserves repeated product order and structured promotion input", () => {
    const command = parseCliArguments([
      "generate",
      "--website",
      "https://kiln-and-leaf.example.com",
      "--product",
      "https://kiln-and-leaf.example.com/products/ember-mug",
      "--product",
      "https://kiln-and-leaf.example.com/products/meadow-cup",
      "--goal",
      "promotion",
      "--offer",
      "Save 15% on the selected cups.",
      "--discount-code",
      "CUP15",
      "--output",
      "campaign",
      "--trace",
      "--json",
      "--no-interactive",
    ]);

    expect(command).toMatchObject({
      kind: "generate",
      output: "campaign",
      trace: true,
      json: true,
      input: {
        goal: "promotion",
        products: [
          "https://kiln-and-leaf.example.com/products/ember-mug",
          "https://kiln-and-leaf.example.com/products/meadow-cup",
        ],
        offer: {
          description: "Save 15% on the selected cups.",
          code: "CUP15",
        },
      },
    });
  });

  it("never prompts and fails immediately for incomplete explicit input", () => {
    expect(() => parseCliArguments(["generate", "--goal", "sales"])).toThrow(
      CliArgumentError,
    );
  });

  it("rejects offer flags outside the promotion goal", () => {
    expect(() =>
      parseCliArguments([
        "generate",
        "--website",
        "https://kiln-and-leaf.example.com",
        "--product",
        "https://kiln-and-leaf.example.com/products/ember-mug",
        "--goal",
        "sales",
        "--offer",
        "Save 15%.",
        "--output",
        "campaign",
      ]),
    ).toThrow("Offer flags require --goal promotion.");
  });
});
