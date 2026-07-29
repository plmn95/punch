export type ExtractionErrorCode =
  | "cancelled"
  | "decode-failed"
  | "insufficient-product-evidence"
  | "invalid-input"
  | "invalid-source"
  | "model-failed";

const SAFE_MESSAGES: Readonly<Record<ExtractionErrorCode, string>> = {
  cancelled: "Extraction was cancelled.",
  "decode-failed": "A fetched document could not be decoded.",
  "insufficient-product-evidence":
    "A required product does not have enough observed evidence.",
  "invalid-input": "The extraction input is invalid.",
  "invalid-source": "A fetched document could not be extracted safely.",
  "model-failed": "The extraction fallback could not be completed.",
};

/** Safe extraction failure that never retains source or model text. */
export class ExtractionError extends Error {
  readonly code: ExtractionErrorCode;
  readonly retryable: boolean;

  constructor(code: ExtractionErrorCode, retryable: boolean) {
    super(SAFE_MESSAGES[code]);
    this.name = "ExtractionError";
    this.code = code;
    this.retryable = retryable;
  }
}

/** Stops extraction promptly when the shared caller signal is aborted. */
export function assertExtractionNotAborted(signal: AbortSignal): void {
  if (signal.aborted) {
    throw new ExtractionError("cancelled", false);
  }
}
