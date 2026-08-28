import { PublicFetchError } from "./fetch-error.js";
import type { PublicFetchLimits } from "./fetch-policy.js";
import type { TransportResponse } from "./node-transport.js";

export type ResourceKind = "html" | "stylesheet";
export type PermittedMediaType =
  "text/html" | "application/xhtml+xml" | "text/css";

/** Validates bounded raw headers and contradictory response framing. */
export function validateHeaders(
  response: TransportResponse,
  limits: PublicFetchLimits,
): void {
  const bytes = response.headers.reduce(
    (total, [name, value]) =>
      total +
      Buffer.byteLength(name, "utf8") +
      Buffer.byteLength(value, "utf8") +
      4,
    0,
  );
  if (
    response.headers.length > limits.maxHeaderCount ||
    bytes > limits.maxHeaderBytes ||
    (headerValues(response, "content-length").length > 0 &&
      headerValues(response, "transfer-encoding").length > 0)
  ) {
    throw new PublicFetchError("headers");
  }
}

/** Returns one required or optional non-duplicated header. */
export function singleHeader(
  response: TransportResponse,
  name: string,
  required: boolean,
): string {
  const values = headerValues(response, name);
  if (values.length > 1 || (required && values.length !== 1)) {
    throw new PublicFetchError("headers");
  }
  return values[0] ?? "";
}

/** Parses the only permitted media types and optional charset. */
export function parseContentType(
  value: string,
  kind: ResourceKind,
): Readonly<{
  mediaType: PermittedMediaType;
  charset: string | undefined;
}> {
  if (value.length > 256) {
    throw new PublicFetchError("headers");
  }
  const [rawMediaType = "", ...parameters] = value.split(";");
  const mediaType = rawMediaType.trim().toLowerCase();
  const permitted =
    kind === "html" ? ["text/html", "application/xhtml+xml"] : ["text/css"];
  if (!permitted.includes(mediaType)) {
    throw new PublicFetchError("mime");
  }
  const charsetParameters = parameters.filter((parameter) =>
    /^charset\b/iu.test(parameter.trim()),
  );
  const charsets = charsetParameters.map((parameter) =>
    /^charset\s*=\s*"?([a-z0-9._-]+)"?\s*$/iu.exec(parameter.trim()),
  );
  if (charsets.length > 1 || charsets.some((match) => match === null)) {
    throw new PublicFetchError("headers");
  }
  const charsetValues = charsets
    .filter((match): match is RegExpExecArray => match !== null)
    .map((match) => (match[1] ?? "").toLowerCase());
  return {
    mediaType: mediaType as PermittedMediaType,
    charset: charsetValues[0],
  };
}

/** Parses zero or one supported content encoding. */
export function parseEncoding(value: string): string {
  const encoding = value.trim().toLowerCase() || "identity";
  if (!["identity", "gzip", "br", "deflate"].includes(encoding)) {
    throw new PublicFetchError("encoding");
  }
  return encoding;
}

/** Rejects malformed or already-known oversized bodies. */
export function declaredLength(
  response: TransportResponse,
  maximum: number,
): number | undefined {
  const value = singleHeader(response, "content-length", false);
  if (!value) {
    return undefined;
  }
  if (!/^(?:0|[1-9]\d*)$/u.test(value)) {
    throw new PublicFetchError("headers");
  }
  const length = Number(value);
  if (!Number.isSafeInteger(length)) {
    throw new PublicFetchError("headers");
  }
  if (length > maximum) {
    throw new PublicFetchError("response-too-large");
  }
  return length;
}

/** Returns all raw values of one case-insensitive response header. */
function headerValues(
  response: TransportResponse,
  name: string,
): readonly string[] {
  return response.headers
    .filter(([headerName]) => headerName.toLowerCase() === name)
    .map(([, value]) => value);
}
