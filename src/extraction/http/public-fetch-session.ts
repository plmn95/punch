import { readBoundedBody } from "./bounded-body.js";
import {
  abortFailure,
  isPublicFetchError,
  PublicFetchError,
  throwIfFetchAborted,
} from "./fetch-error.js";
import {
  PUBLIC_FETCH_LIMITS,
  responseByteLimits,
  type PublicFetchLimits,
} from "./fetch-policy.js";
import {
  NodePublicAddressResolver,
  type PublicAddressResolver,
} from "./dns-resolver.js";
import {
  NodePinnedHttpTransport,
  type PinnedHttpTransport,
  type TransportResponse,
} from "./node-transport.js";
import {
  peerMatches,
  selectPinnedAddress,
  urlLiteralAddress,
  type ResolvedAddress,
} from "./public-address.js";
import {
  parseContentType,
  parseEncoding,
  singleHeader,
  declaredLength,
  validateHeaders,
  type PermittedMediaType,
  type ResourceKind,
} from "./response-policy.js";
import {
  createLinkedDeadline,
  RequestGate,
  SessionState,
} from "./session-state.js";
import {
  enforceRequiredOrigin,
  nextRedirect,
  parsePermittedUrl,
} from "./url-policy.js";

export type FetchedResource = Readonly<{
  requestedUrl: string;
  finalUrl: string;
  mediaType: PermittedMediaType;
  charset: string | undefined;
  body: Uint8Array;
  compressedBytes: number;
  decompressedBytes: number;
  redirectCount: number;
}>;

export interface PublicFetchSession {
  fetchHtml(url: string): Promise<FetchedResource>;
  fetchStylesheet(
    url: string,
    websiteFinalUrl: string,
  ): Promise<FetchedResource>;
  dispose(): void;
}

type SessionDependencies = Readonly<{
  resolver: PublicAddressResolver;
  transport: PinnedHttpTransport;
  limits: PublicFetchLimits;
}>;

const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308]);

/** Creates the production public-fetch session with fixed security policy. */
export function createPublicFetchSession(options: {
  signal: AbortSignal;
}): PublicFetchSession {
  return createSession(options.signal, {
    resolver: new NodePublicAddressResolver(),
    transport: new NodePinnedHttpTransport(),
    limits: PUBLIC_FETCH_LIMITS,
  });
}

/** Internal deterministic seam for newly fictional adversarial tests. */
export function createPublicFetchSessionForTest(
  options: Readonly<{ signal: AbortSignal } & SessionDependencies>,
): PublicFetchSession {
  return createSession(options.signal, options);
}

/** Creates methods sharing one deadline, request gate, and byte budget. */
function createSession(
  callerSignal: AbortSignal,
  dependencies: SessionDependencies,
): PublicFetchSession {
  const state = new SessionState(callerSignal, dependencies.limits);
  const gate = new RequestGate(dependencies.limits.maxConcurrent);
  return {
    fetchHtml: (url) =>
      fetchResource(url, "html", undefined, state, gate, dependencies),
    fetchStylesheet: (url, websiteFinalUrl) =>
      fetchResource(
        url,
        "stylesheet",
        parsePermittedUrl(websiteFinalUrl).origin,
        state,
        gate,
        dependencies,
      ),
    dispose: () => state.dispose(),
  };
}

/** Performs one logical resource request through every redirect. */
async function fetchResource(
  inputUrl: string,
  kind: ResourceKind,
  requiredOrigin: string | undefined,
  state: SessionState,
  gate: RequestGate,
  dependencies: SessionDependencies,
): Promise<FetchedResource> {
  state.startDocument();
  const requested = parsePermittedUrl(inputUrl);
  enforceRequiredOrigin(requested, requiredOrigin);
  const deadline = createLinkedDeadline(
    state.signal,
    dependencies.limits.documentTimeoutMs,
  );
  let release: (() => void) | undefined;
  try {
    release = await gate.acquire(deadline.signal);
    return await followResource(
      requested,
      kind,
      requiredOrigin,
      state,
      dependencies,
      deadline.signal,
    );
  } finally {
    release?.();
    deadline.dispose();
  }
}

/** Follows a bounded redirect chain and returns one validated response. */
async function followResource(
  requested: URL,
  kind: ResourceKind,
  requiredOrigin: string | undefined,
  state: SessionState,
  dependencies: SessionDependencies,
  signal: AbortSignal,
): Promise<FetchedResource> {
  const visited = new Set([requested.href]);
  let current = requested;
  let redirects = 0;
  while (true) {
    throwIfFetchAborted(signal);
    const pinned = await resolvePinned(current, dependencies, signal);
    const response = await requestOne(
      current,
      kind,
      pinned,
      dependencies,
      signal,
    );
    try {
      validateResponseStart(response, pinned, dependencies.limits);
      if (REDIRECT_STATUSES.has(response.statusCode)) {
        if (redirects >= dependencies.limits.maxRedirects) {
          throw new PublicFetchError("redirect-policy");
        }
        current = nextRedirect(current, response, requiredOrigin, visited);
        redirects += 1;
        continue;
      }
      return await finaliseResponse({
        requested,
        current,
        kind,
        redirects,
        response,
        state,
        limits: dependencies.limits,
        signal,
      });
    } finally {
      response.destroy();
    }
  }
}

/** Resolves a literal or hostname and applies the all-address policy. */
async function resolvePinned(
  url: URL,
  dependencies: SessionDependencies,
  signal: AbortSignal,
): Promise<ResolvedAddress> {
  const literal = urlLiteralAddress(url.hostname);
  const answers = literal
    ? [{ address: literal, family: literal.includes(":") ? 6 : 4 } as const]
    : await dependencies.resolver.resolve(url.hostname, signal);
  return selectPinnedAddress(answers, dependencies.limits.maxDnsAnswers);
}

/** Requests one pinned response with fixed safe request headers. */
async function requestOne(
  url: URL,
  kind: ResourceKind,
  pinned: ResolvedAddress,
  dependencies: SessionDependencies,
  signal: AbortSignal,
): Promise<TransportResponse> {
  try {
    return await dependencies.transport.request({
      url,
      pinned,
      accept: kind === "html" ? "text/html, application/xhtml+xml" : "text/css",
      signal,
      limits: dependencies.limits,
    });
  } catch (error) {
    if (signal.aborted) {
      throw abortFailure(signal);
    }
    throw isPublicFetchError(error) ? error : new PublicFetchError("network");
  }
}

/** Validates peer and bounded headers before any body is accepted. */
function validateResponseStart(
  response: TransportResponse,
  pinned: ResolvedAddress,
  limits: PublicFetchLimits,
): void {
  if (!peerMatches(response.peerAddress, pinned)) {
    throw new PublicFetchError("peer-mismatch");
  }
  validateHeaders(response, limits);
}

/** Validates and reads one terminal 200 response. */
async function finaliseResponse(options: {
  requested: URL;
  current: URL;
  kind: ResourceKind;
  redirects: number;
  response: TransportResponse;
  state: SessionState;
  limits: PublicFetchLimits;
  signal: AbortSignal;
}): Promise<FetchedResource> {
  if (options.response.statusCode !== 200) {
    throw new PublicFetchError("status");
  }
  const contentType = parseContentType(
    singleHeader(options.response, "content-type", true),
    options.kind,
  );
  const encoding = parseEncoding(
    singleHeader(options.response, "content-encoding", false),
  );
  const byteLimits = responseByteLimits(options.limits, options.kind);
  const expectedLength = declaredLength(
    options.response,
    byteLimits.compressed,
  );
  const body = await readBoundedBody({
    source: options.response.body,
    encoding,
    compressedLimit: byteLimits.compressed,
    decompressedLimit: byteLimits.decompressed,
    budget: options.state.budget,
    signal: options.signal,
  });
  if (expectedLength !== undefined && expectedLength !== body.compressedBytes) {
    throw new PublicFetchError("headers");
  }
  return {
    requestedUrl: options.requested.href,
    finalUrl: options.current.href,
    mediaType: contentType.mediaType,
    charset: contentType.charset,
    body: body.body,
    compressedBytes: body.compressedBytes,
    decompressedBytes: body.decompressedBytes,
    redirectCount: options.redirects,
  };
}
