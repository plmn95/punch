import type { CssSource } from "./contracts.js";
import {
  assertExtractionNotAborted,
  ExtractionError,
} from "./extraction-error.js";
import {
  type FetchedResource,
  PublicFetchError,
  type PublicFetchSession,
} from "./http/index.js";

/** Fetches required website/product pages while retaining supplied URL order. */
export async function fetchRequiredSources(
  websiteUrl: string,
  productUrls: readonly string[],
  session: PublicFetchSession,
): Promise<[FetchedResource, FetchedResource[]]> {
  const website = session.fetchHtml(websiteUrl);
  const products = Promise.all(
    productUrls.map((productUrl) => session.fetchHtml(productUrl)),
  );
  return Promise.all([website, products]);
}

/** Fetches optional exact-origin styles without hiding session-wide failures. */
export async function fetchStylesheets(
  urls: readonly string[],
  websiteFinalUrl: string,
  session: PublicFetchSession,
  signal: AbortSignal,
): Promise<CssSource[]> {
  const settled = await Promise.allSettled(
    urls.map((url) => session.fetchStylesheet(url, websiteFinalUrl)),
  );
  assertExtractionNotAborted(signal);
  const sources: CssSource[] = [];
  for (const [index, result] of settled.entries()) {
    appendStylesheetSource(sources, result, index);
  }
  return sources;
}

/** Adds one usable stylesheet or propagates its session-owned failure. */
function appendStylesheetSource(
  sources: CssSource[],
  result: PromiseSettledResult<FetchedResource>,
  index: number,
): void {
  if (result.status === "rejected") {
    throwIfSessionFailure(result.reason);
    return;
  }
  const decoded = decodeOptionalStylesheet(result.value);
  if (decoded !== undefined) {
    sources.push({
      url: result.value.finalUrl,
      css: decoded,
      field: `styles.external-${String(index + 1).padStart(2, "0")}`,
    });
  }
}

/** Omits a stylesheet that cannot be decoded by the conservative charset set. */
function decodeOptionalStylesheet(
  resource: FetchedResource,
): string | undefined {
  try {
    return decodeResource(resource);
  } catch (error) {
    if (error instanceof ExtractionError && error.code === "decode-failed") {
      return undefined;
    }
    throw error;
  }
}

/** Propagates failures owned by the shared session rather than one stylesheet. */
function throwIfSessionFailure(error: unknown): void {
  if (
    error instanceof PublicFetchError &&
    [
      "aggregate-limit",
      "document-limit",
      "session-timeout",
      "cancelled",
    ].includes(error.code)
  ) {
    throw error;
  }
}

/** Decodes one bounded fetched body using a conservative charset set. */
export function decodeResource(resource: FetchedResource): string {
  const charset = (resource.charset ?? "utf-8").trim().toLowerCase();
  const label =
    charset === "utf8" || charset === "us-ascii" ? "utf-8" : charset;
  if (!["utf-8", "iso-8859-1", "windows-1252"].includes(label)) {
    throw new ExtractionError("decode-failed", false);
  }
  try {
    return new TextDecoder(label, { fatal: true }).decode(resource.body);
  } catch {
    throw new ExtractionError("decode-failed", false);
  }
}
