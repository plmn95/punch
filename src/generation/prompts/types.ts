import type { GenerationStage } from "../../providers/index.js";

/** Pure prompt-builder result consumed by one structured model call. */
export type ModelPrompt = Readonly<{
  stage: GenerationStage;
  promptVersion: string;
  system: string;
  user: string;
  maxOutputTokens: number;
}>;
