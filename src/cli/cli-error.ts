export type CliArgumentErrorCode =
  | "invalid-arguments"
  | "missing-arguments"
  | "unknown-command"
  | "invalid-file"
  | "cancelled";

/** Stable usage failure without echoing untrusted input or filesystem contents. */
export class CliArgumentError extends Error {
  readonly code: CliArgumentErrorCode;
  constructor(code: CliArgumentErrorCode, message: string) {
    super(message);
    this.name = "CliArgumentError";
    this.code = code;
  }
}
