/** Manually versioned, newly authored Punch generation prompts. */
export const PROMPT_VERSIONS = Object.freeze({
  emit: "punch.emit.v1",
  critique: "punch.critique.v1",
  revise: "punch.revise.v1",
  repair: "punch.structured-repair.v1",
});

/** Fixed stage output bounds owned by the generation engine. */
export const STAGE_OUTPUT_TOKENS = Object.freeze({
  emit: 16_000,
  critique: 6_000,
  revise: 16_000,
});
