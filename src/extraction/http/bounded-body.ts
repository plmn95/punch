import { Readable, type Transform } from "node:stream";
import { createBrotliDecompress, createGunzip, createInflate } from "node:zlib";

import {
  abortFailure,
  PublicFetchError,
  throwIfFetchAborted,
} from "./fetch-error.js";

export type BodyBudget = Readonly<{
  consumeCompressed(bytes: number): void;
  consumeDecompressed(bytes: number): void;
}>;

export type BoundedBodyResult = Readonly<{
  body: Uint8Array;
  compressedBytes: number;
  decompressedBytes: number;
}>;

/** Reads, decodes, and accounts for one bounded response body. */
export async function readBoundedBody(options: {
  source: AsyncIterable<Uint8Array>;
  encoding: string;
  compressedLimit: number;
  decompressedLimit: number;
  budget: BodyBudget;
  signal: AbortSignal;
}): Promise<BoundedBodyResult> {
  const compressed = await collectChunks({
    source: options.source,
    limit: options.compressedLimit,
    consume: options.budget.consumeCompressed,
    signal: options.signal,
    failureCode: "network",
  });
  const decodedSource = createDecodedSource(compressed.body, options.encoding);
  const decompressed = await collectChunks({
    source: decodedSource,
    limit: options.decompressedLimit,
    consume: options.budget.consumeDecompressed,
    signal: options.signal,
    failureCode: "encoding",
  });
  return {
    body: decompressed.body,
    compressedBytes: compressed.bytes,
    decompressedBytes: decompressed.bytes,
  };
}

/** Collects a byte stream while enforcing local and aggregate counters. */
async function collectChunks(options: {
  source: AsyncIterable<Uint8Array>;
  limit: number;
  consume(bytes: number): void;
  signal: AbortSignal;
  failureCode: "network" | "encoding";
}): Promise<Readonly<{ body: Uint8Array; bytes: number }>> {
  const chunks: Uint8Array[] = [];
  let bytes = 0;
  throwIfFetchAborted(options.signal);
  const abort = () =>
    destroySource(options.source, abortFailure(options.signal));
  options.signal.addEventListener("abort", abort, { once: true });
  try {
    if (options.signal.aborted) {
      abort();
      throwIfFetchAborted(options.signal);
    }
    for await (const chunk of options.source) {
      throwIfFetchAborted(options.signal);
      bytes += chunk.byteLength;
      if (bytes > options.limit) {
        throw new PublicFetchError("response-too-large");
      }
      options.consume(chunk.byteLength);
      chunks.push(chunk);
    }
    throwIfFetchAborted(options.signal);
    return { body: Buffer.concat(chunks, bytes), bytes };
  } catch (error) {
    if (options.signal.aborted) {
      throw abortFailure(options.signal);
    }
    if (error instanceof PublicFetchError) {
      throw error;
    }
    throw new PublicFetchError(options.failureCode);
  } finally {
    options.signal.removeEventListener("abort", abort);
  }
}

/** Creates a byte stream for identity or one supported decoding layer. */
function createDecodedSource(
  body: Uint8Array,
  encoding: string,
): AsyncIterable<Uint8Array> {
  if (encoding === "identity") {
    return Readable.from([body], { objectMode: false });
  }
  const decoder = createDecoder(encoding);
  return Readable.from([body], { objectMode: false }).pipe(decoder);
}

/** Creates the only supported content decoders. */
function createDecoder(encoding: string): Transform {
  switch (encoding) {
    case "gzip":
      return createGunzip();
    case "br":
      return createBrotliDecompress();
    case "deflate":
      return createInflate();
    default:
      throw new PublicFetchError("encoding");
  }
}

/** Destroys an active Node-style byte stream when cancellation wins. */
function destroySource(source: unknown, error: PublicFetchError): void {
  if (
    typeof source === "object" &&
    source !== null &&
    "destroy" in source &&
    typeof source.destroy === "function"
  ) {
    source.destroy(error);
  }
}
