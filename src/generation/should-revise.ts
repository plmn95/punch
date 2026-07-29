import type { CritiqueResult } from "../core/schemas/index.js";

/** Returns whether critique found at least one blocking issue. */
export function shouldRevise(critique: CritiqueResult): boolean {
  return critique.issues.some((issue) => issue.severity === "blocking");
}
