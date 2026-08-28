export type OutputErrorCode =
  | "destination-exists"
  | "force-unsupported"
  | "invalid-output-path"
  | "unsafe-output-path"
  | "write-failed";

const MESSAGES: Readonly<Record<OutputErrorCode, string>> = {
  "destination-exists":
    "The output directory already exists. Choose a new directory.",
  "force-unsupported":
    "Safe atomic replacement is unavailable. Choose a new output directory.",
  "invalid-output-path": "The output path is invalid.",
  "unsafe-output-path": "The output path contains an unsafe filesystem entry.",
  "write-failed": "Punch could not publish the output artifacts.",
};

/** Stable output failure that never retains filesystem contents. */
export class OutputError extends Error {
  readonly code: OutputErrorCode;

  constructor(code: OutputErrorCode) {
    super(MESSAGES[code]);
    this.name = "OutputError";
    this.code = code;
  }
}
