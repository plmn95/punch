/** Stable failures produced by the hardened public fetch boundary. */
export type PublicFetchErrorCode =
  | "invalid-url"
  | "blocked-address"
  | "dns-failure"
  | "peer-mismatch"
  | "redirect-policy"
  | "status"
  | "mime"
  | "encoding"
  | "headers"
  | "response-too-large"
  | "aggregate-limit"
  | "document-limit"
  | "timeout"
  | "session-timeout"
  | "cancelled"
  | "network";

const SAFE_MESSAGES: Readonly<Record<PublicFetchErrorCode, string>> = {
  "invalid-url": "The resource URL is not permitted.",
  "blocked-address": "The resource address is not public.",
  "dns-failure": "The resource hostname could not be resolved safely.",
  "peer-mismatch": "The connected peer did not match the pinned address.",
  "redirect-policy": "The resource redirect is not permitted.",
  status: "The resource returned an unsupported status.",
  mime: "The resource returned an unsupported media type.",
  encoding: "The resource returned an unsupported content encoding.",
  headers: "The resource returned invalid response headers.",
  "response-too-large": "The resource exceeds its byte limit.",
  "aggregate-limit": "The extraction exceeds its aggregate byte limit.",
  "document-limit": "The extraction exceeds its document limit.",
  timeout: "The resource did not finish before the deadline.",
  "session-timeout": "The extraction did not finish before the deadline.",
  cancelled: "The resource request was cancelled.",
  network: "The resource request failed.",
};

/** Safe network error that never retains URLs, headers, bodies, or raw causes. */
export class PublicFetchError extends Error {
  readonly code: PublicFetchErrorCode;

  constructor(code: PublicFetchErrorCode) {
    super(SAFE_MESSAGES[code]);
    this.name = "PublicFetchError";
    this.code = code;
  }
}

/** Reports whether an unknown failure is already a safe fetch error. */
export function isPublicFetchError(error: unknown): error is PublicFetchError {
  return error instanceof PublicFetchError;
}

/** Returns the safe failure represented by an aborted signal. */
export function abortFailure(signal: AbortSignal): PublicFetchError {
  return isPublicFetchError(signal.reason)
    ? signal.reason
    : new PublicFetchError("cancelled");
}

/** Throws the safe failure represented by an aborted signal. */
export function throwIfFetchAborted(signal: AbortSignal): void {
  if (signal.aborted) {
    throw abortFailure(signal);
  }
}
