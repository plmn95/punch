import { request as requestHttp } from "node:http";
import type { IncomingMessage, RequestOptions } from "node:http";
import { request as requestHttps } from "node:https";
import { isIP } from "node:net";

import {
  abortFailure,
  PublicFetchError,
  throwIfFetchAborted,
} from "./fetch-error.js";
import type { PublicFetchLimits } from "./fetch-policy.js";
import type { ResolvedAddress } from "./public-address.js";

export type TransportRequest = Readonly<{
  url: URL;
  pinned: ResolvedAddress;
  accept: string;
  signal: AbortSignal;
  limits: PublicFetchLimits;
}>;

export type TransportResponse = Readonly<{
  statusCode: number;
  headers: readonly (readonly [string, string])[];
  peerAddress: string | undefined;
  body: AsyncIterable<Uint8Array>;
  destroy: () => void;
}>;

/** Low-level transport seam; public policy is enforced by its only caller. */
export interface PinnedHttpTransport {
  request(input: TransportRequest): Promise<TransportResponse>;
}

/** Connects directly to one pinned address without ambient proxy or cookies. */
export class NodePinnedHttpTransport implements PinnedHttpTransport {
  async request(input: TransportRequest): Promise<TransportResponse> {
    throwIfFetchAborted(input.signal);
    return new Promise((resolve, reject) => {
      const request = createRequest(input);
      const fail = (error: unknown) =>
        reject(normaliseTransportFailure(error, input.signal));

      request.once("error", fail);
      request.setTimeout(input.limits.idleTimeoutMs, () => {
        request.destroy(new PublicFetchError("timeout"));
      });
      request.once("response", (response) => {
        request.removeListener("error", fail);
        request.setTimeout(0);
        const failAfterHeaders = (error: unknown) => {
          response.destroy(normaliseTransportFailure(error, input.signal));
        };
        request.once("error", failAfterHeaders);
        request.once("close", () => {
          request.removeListener("error", failAfterHeaders);
        });
        resolve(createTransportResponse(response, input.limits));
      });
      request.end();
    });
  }
}

/** Creates one non-pooled request whose socket target is the pinned address. */
function createRequest(input: TransportRequest) {
  const hostname = stripIpv6Brackets(input.url.hostname);
  const requestOptions: RequestOptions = {
    protocol: input.url.protocol,
    hostname: input.pinned.address,
    family: input.pinned.family,
    port: input.url.port || undefined,
    method: "GET",
    path: `${input.url.pathname}${input.url.search}`,
    agent: false,
    setHost: false,
    signal: input.signal,
    maxHeaderSize: input.limits.maxHeaderBytes,
    headers: {
      Host: input.url.host,
      Accept: input.accept,
      "Accept-Encoding": "gzip, br, deflate",
      "User-Agent": "Punch/0.1 public-email-extraction",
      Connection: "close",
    },
    ...(input.url.protocol === "https:" && isIP(hostname) === 0
      ? { servername: hostname }
      : {}),
  };
  const request =
    input.url.protocol === "https:"
      ? requestHttps({ ...requestOptions, rejectUnauthorized: true })
      : requestHttp(requestOptions);
  request.maxHeadersCount = input.limits.maxHeaderCount + 1;
  return request;
}

/** Converts an incoming response to the transport-neutral streaming shape. */
function createTransportResponse(
  response: IncomingMessage,
  limits: PublicFetchLimits,
): TransportResponse {
  response.setTimeout(limits.idleTimeoutMs, () => {
    response.destroy(new PublicFetchError("timeout"));
  });
  return {
    statusCode: response.statusCode ?? 0,
    headers: pairHeaders(response.rawHeaders),
    peerAddress: response.socket.remoteAddress,
    body: response,
    destroy: () => {
      response.setTimeout(0);
      response.destroy();
    },
  };
}

/** Pairs Node's alternating raw header array without joining duplicates. */
function pairHeaders(
  rawHeaders: readonly string[],
): readonly (readonly [string, string])[] {
  const headers: Array<readonly [string, string]> = [];
  for (let index = 0; index < rawHeaders.length; index += 2) {
    headers.push([rawHeaders[index] ?? "", rawHeaders[index + 1] ?? ""]);
  }
  return headers;
}

/** Removes URL display brackets before TLS hostname handling. */
function stripIpv6Brackets(hostname: string): string {
  return hostname.startsWith("[") && hostname.endsWith("]")
    ? hostname.slice(1, -1)
    : hostname;
}

/** Converts all transport failures to fixed messages and categories. */
function normaliseTransportFailure(
  error: unknown,
  signal: AbortSignal,
): PublicFetchError {
  if (signal.aborted) {
    return abortFailure(signal);
  }
  return error instanceof PublicFetchError
    ? error
    : new PublicFetchError("network");
}
