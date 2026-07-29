import { PublicFetchError } from "./fetch-error.js";
import { urlLiteralAddress } from "./public-address.js";
import type { TransportResponse } from "./node-transport.js";
import { singleHeader } from "./response-policy.js";

const SPECIAL_HOST_SUFFIXES = [
  ".localhost",
  ".local",
  ".internal",
  ".home.arpa",
  ".test",
  ".invalid",
  ".example",
];

/** Parses one URL and rejects local or unsupported address forms. */
export function parsePermittedUrl(value: string): URL {
  if (value.length === 0 || value.length > 2_048) {
    throw new PublicFetchError("invalid-url");
  }
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new PublicFetchError("invalid-url");
  }
  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.hostname.endsWith(".") ||
    isSpecialHostname(url.hostname)
  ) {
    throw new PublicFetchError("invalid-url");
  }
  url.hash = "";
  return url;
}

/** Enforces the exact website-final-origin stylesheet boundary. */
export function enforceRequiredOrigin(
  url: URL,
  requiredOrigin: string | undefined,
): void {
  if (requiredOrigin !== undefined && url.origin !== requiredOrigin) {
    throw new PublicFetchError("redirect-policy");
  }
}

/** Parses and applies redirect invariants before another network operation. */
export function nextRedirect(
  current: URL,
  response: TransportResponse,
  requiredOrigin: string | undefined,
  visited: Set<string>,
): URL {
  const location = singleHeader(response, "location", true);
  let next: URL;
  try {
    next = parsePermittedUrl(new URL(location, current).href);
  } catch {
    throw new PublicFetchError("redirect-policy");
  }
  if (
    (current.protocol === "https:" && next.protocol !== "https:") ||
    (requiredOrigin !== undefined && next.origin !== requiredOrigin) ||
    visited.has(next.href)
  ) {
    throw new PublicFetchError("redirect-policy");
  }
  visited.add(next.href);
  return next;
}

/** Reports whether a hostname is an explicitly local or special-use name. */
function isSpecialHostname(hostname: string): boolean {
  const lower = hostname.toLowerCase();
  if (urlLiteralAddress(lower)) {
    return false;
  }
  return (
    !lower.includes(".") ||
    lower === "localhost" ||
    SPECIAL_HOST_SUFFIXES.some(
      (suffix) => lower === suffix.slice(1) || lower.endsWith(suffix),
    )
  );
}
