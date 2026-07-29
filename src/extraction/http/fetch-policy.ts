/** Fixed resource limits for one public extraction session. */
export type PublicFetchLimits = Readonly<{
  sessionTimeoutMs: number;
  documentTimeoutMs: number;
  idleTimeoutMs: number;
  maxRedirects: number;
  maxDocuments: number;
  maxConcurrent: number;
  maxDnsAnswers: number;
  maxHeaderBytes: number;
  maxHeaderCount: number;
  htmlCompressedBytes: number;
  htmlDecompressedBytes: number;
  stylesheetCompressedBytes: number;
  stylesheetDecompressedBytes: number;
  aggregateCompressedBytes: number;
  aggregateDecompressedBytes: number;
}>;

/** Conservative non-configurable production limits. */
export const PUBLIC_FETCH_LIMITS: PublicFetchLimits = Object.freeze({
  sessionTimeoutMs: 45_000,
  documentTimeoutMs: 10_000,
  idleTimeoutMs: 5_000,
  maxRedirects: 5,
  maxDocuments: 15,
  maxConcurrent: 3,
  maxDnsAnswers: 16,
  maxHeaderBytes: 16 * 1_024,
  maxHeaderCount: 64,
  htmlCompressedBytes: 2 * 1_024 * 1_024,
  htmlDecompressedBytes: 4 * 1_024 * 1_024,
  stylesheetCompressedBytes: 512 * 1_024,
  stylesheetDecompressedBytes: 1_024 * 1_024,
  aggregateCompressedBytes: 8 * 1_024 * 1_024,
  aggregateDecompressedBytes: 24 * 1_024 * 1_024,
});

/** Reports the per-response byte limits for one resource kind. */
export function responseByteLimits(
  limits: PublicFetchLimits,
  kind: "html" | "stylesheet",
): Readonly<{ compressed: number; decompressed: number }> {
  return kind === "html"
    ? {
        compressed: limits.htmlCompressedBytes,
        decompressed: limits.htmlDecompressedBytes,
      }
    : {
        compressed: limits.stylesheetCompressedBytes,
        decompressed: limits.stylesheetDecompressedBytes,
      };
}
