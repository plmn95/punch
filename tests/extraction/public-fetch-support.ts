import { once } from "node:events";
import { createServer } from "node:http";

import { expect } from "vitest";

import type { PublicAddressResolver } from "../../src/extraction/http/dns-resolver.js";
import type { PublicFetchErrorCode } from "../../src/extraction/http/fetch-error.js";
import { PublicFetchError } from "../../src/extraction/http/fetch-error.js";
import type { PublicFetchLimits } from "../../src/extraction/http/fetch-policy.js";
import { PUBLIC_FETCH_LIMITS } from "../../src/extraction/http/fetch-policy.js";
import type {
  PinnedHttpTransport,
  TransportRequest,
  TransportResponse,
} from "../../src/extraction/http/node-transport.js";
import { NodePinnedHttpTransport } from "../../src/extraction/http/node-transport.js";
import type { ResolvedAddress } from "../../src/extraction/http/public-address.js";
import {
  createPublicFetchSessionForTest,
  type PublicFetchSession,
} from "../../src/extraction/http/public-fetch-session.js";
import { RequestGate } from "../../src/extraction/http/session-state.js";

export const PUBLIC_V4 = "8.8.8.8";
export const PUBLIC_V6 = "2606:4700:4700::1111";

export const TEST_LIMITS: PublicFetchLimits = Object.freeze({
  ...PUBLIC_FETCH_LIMITS,
  sessionTimeoutMs: 2_000,
  documentTimeoutMs: 1_000,
  idleTimeoutMs: 250,
  maxRedirects: 2,
  maxDocuments: 6,
  maxConcurrent: 2,
  maxDnsAnswers: 8,
  maxHeaderBytes: 1_024,
  maxHeaderCount: 12,
  htmlCompressedBytes: 256,
  htmlDecompressedBytes: 512,
  stylesheetCompressedBytes: 128,
  stylesheetDecompressedBytes: 256,
  aggregateCompressedBytes: 512,
  aggregateDecompressedBytes: 1_024,
});

type ResolverHandler = (
  hostname: string,
  signal: AbortSignal,
) => Promise<readonly ResolvedAddress[]> | readonly ResolvedAddress[];

/** Deterministic resolver that records every hostname request. */
export class FakeResolver implements PublicAddressResolver {
  readonly calls: string[] = [];

  constructor(
    private readonly handler: ResolverHandler = () => [
      { address: PUBLIC_V4, family: 4 },
    ],
  ) {}

  async resolve(
    hostname: string,
    signal: AbortSignal,
  ): Promise<readonly ResolvedAddress[]> {
    this.calls.push(hostname);
    return this.handler(hostname, signal);
  }
}

type TransportHandler = (
  input: TransportRequest,
) => Promise<TransportResponse> | TransportResponse;

/** Deterministic pinned transport that records every attempted request. */
export class FakeTransport implements PinnedHttpTransport {
  readonly requests: TransportRequest[] = [];

  constructor(private readonly handler: TransportHandler) {}

  async request(input: TransportRequest): Promise<TransportResponse> {
    this.requests.push(input);
    return this.handler(input);
  }
}

/** Creates one fake response with independently observable destruction. */
export function fakeResponse(
  options: {
    statusCode?: number;
    headers?: readonly (readonly [string, string])[];
    peerAddress?: string;
    body?: Uint8Array | readonly Uint8Array[];
    source?: AsyncIterable<Uint8Array>;
    onDestroy?: () => void;
  } = {},
): TransportResponse {
  const chunks =
    options.body instanceof Uint8Array
      ? [options.body]
      : (options.body ?? [Buffer.from("<html>Fictional shop</html>")]);
  return {
    statusCode: options.statusCode ?? 200,
    headers: options.headers ?? [["Content-Type", "text/html; charset=UTF-8"]],
    peerAddress: options.peerAddress ?? PUBLIC_V4,
    body: options.source ?? chunksSource(chunks),
    destroy: options.onDestroy ?? (() => undefined),
  };
}

/** Creates a test session and returns its observable dependencies. */
export function testSession(options: {
  signal?: AbortSignal;
  resolver?: FakeResolver;
  transport?: FakeTransport;
  limits?: Partial<PublicFetchLimits>;
}): Readonly<{
  session: PublicFetchSession;
  resolver: FakeResolver;
  transport: FakeTransport;
}> {
  const resolver = options.resolver ?? new FakeResolver();
  const transport =
    options.transport ?? new FakeTransport(() => fakeResponse());
  const limits = Object.freeze({ ...TEST_LIMITS, ...options.limits });
  return {
    session: createPublicFetchSessionForTest({
      signal: options.signal ?? new AbortController().signal,
      resolver,
      transport,
      limits,
    }),
    resolver,
    transport,
  };
}

/** Returns a stream that yields each supplied byte chunk once. */
export async function* chunksSource(
  chunks: readonly Uint8Array[],
): AsyncIterable<Uint8Array> {
  for (const chunk of chunks) {
    yield chunk;
  }
}

/** Waits until a signal aborts, then rejects with its safe reason. */
export async function rejectOnAbort(signal: AbortSignal): Promise<never> {
  return new Promise((_resolve, reject) => {
    const fail = () => reject(signal.reason);
    signal.addEventListener("abort", fail, { once: true });
    if (signal.aborted) {
      fail();
    }
  });
}

/** Exercises the real pinned transport against a task-owned local server. */
export async function probePinnedNodeTransport(): Promise<
  Record<string, string | string[] | undefined>
> {
  let seenHeaders: Record<string, string | string[] | undefined> = {};
  const server = createServer((request, response) => {
    seenHeaders = request.headers;
    response.writeHead(200, { "Content-Type": "text/html" });
    response.end("fictional");
  });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  if (address === null || typeof address === "string") {
    throw new Error("Expected a local TCP address.");
  }
  const controller = new AbortController();
  try {
    const response = await new NodePinnedHttpTransport().request({
      url: new URL(`http://shop.example.com:${address.port}/catalogue`),
      pinned: { address: "127.0.0.1", family: 4 },
      accept: "text/html",
      signal: controller.signal,
      limits: TEST_LIMITS,
    });
    for await (const chunk of response.body) {
      if (chunk.byteLength === 0) {
        continue;
      }
    }
    response.destroy();
    return seenHeaders;
  } finally {
    controller.abort();
    server.close();
    await once(server, "close");
  }
}

/** Expects one stable fetch code without relying on raw failure text. */
export async function expectFetchCode(
  promise: Promise<unknown>,
  code: PublicFetchErrorCode,
): Promise<void> {
  await expect(promise).rejects.toMatchObject({ code });
}

/** Forces cancellation in the gate's check-to-listener registration window. */
export async function probeGateRegistrationRace(): Promise<
  PublicFetchErrorCode | "unexpected" | undefined
> {
  const gate = new RequestGate(1);
  const release = await gate.acquire(new AbortController().signal);
  const controller = new AbortController();
  const original = controller.signal.addEventListener.bind(controller.signal);
  const intercepted = ((
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions,
  ) => {
    controller.abort();
    original(type, listener, options);
  }) as AbortSignal["addEventListener"];
  Object.defineProperty(controller.signal, "addEventListener", {
    value: intercepted,
  });
  try {
    await gate.acquire(controller.signal);
    return undefined;
  } catch (error) {
    return error instanceof PublicFetchError ? error.code : "unexpected";
  } finally {
    release();
  }
}

/** Measures the session's maximum simultaneous transport calls. */
export async function probeBoundedConcurrency(): Promise<number> {
  let active = 0;
  let maximum = 0;
  const transport = new FakeTransport(async (input) => {
    active += 1;
    maximum = Math.max(maximum, active);
    await new Promise((resolve) => setTimeout(resolve, 15));
    active -= 1;
    return fakeResponse({ peerAddress: input.pinned.address });
  });
  const context = testSession({
    transport,
    limits: { maxConcurrent: 2, documentTimeoutMs: 500 },
  });
  try {
    await Promise.all(
      [1, 2, 3, 4].map((index) =>
        context.session.fetchHtml(`https://shop.example.com/${index}`),
      ),
    );
    return maximum;
  } finally {
    context.session.dispose();
  }
}

/** Proves the real transport aborts a response that stops making progress. */
export async function probePinnedNodeIdleTimeout(): Promise<
  PublicFetchErrorCode | "unexpected" | undefined
> {
  const server = createServer((_request, response) => {
    response.writeHead(200, { "Content-Type": "text/html" });
    response.write("partial");
  });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  if (address === null || typeof address === "string") {
    throw new Error("Expected a local TCP address.");
  }
  const controller = new AbortController();
  try {
    const response = await new NodePinnedHttpTransport().request({
      url: new URL(`http://shop.example.com:${address.port}/slow`),
      pinned: { address: "127.0.0.1", family: 4 },
      accept: "text/html",
      signal: controller.signal,
      limits: { ...TEST_LIMITS, idleTimeoutMs: 20 },
    });
    for await (const chunk of response.body) {
      if (chunk.byteLength === 0) {
        continue;
      }
    }
    return undefined;
  } catch (error) {
    return error instanceof PublicFetchError ? error.code : "unexpected";
  } finally {
    controller.abort();
    server.closeAllConnections();
    server.close();
    await once(server, "close");
  }
}
