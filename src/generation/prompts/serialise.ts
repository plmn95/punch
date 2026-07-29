import { z } from "zod";

/** Serialises validated data while neutralising prompt-delimiter characters. */
export function serialisePromptData(value: unknown): string {
  const serialised = JSON.stringify(value);
  if (serialised === undefined) {
    throw new TypeError("Prompt data must be JSON serialisable.");
  }
  return escapePromptDelimiters(serialised);
}

/** Serialises a Zod output contract for a model without executable behaviour. */
export function serialiseOutputSchema(schema: z.ZodType): string {
  const jsonSchema = z.toJSONSchema(schema, {
    io: "input",
    unrepresentable: "any",
  });
  return serialisePromptData(jsonSchema);
}

/** Escapes characters that could close an engine-owned prompt data section. */
function escapePromptDelimiters(value: string): string {
  return value
    .replaceAll("&", "\\u0026")
    .replaceAll("<", "\\u003c")
    .replaceAll(">", "\\u003e");
}
