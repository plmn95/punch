import { isIP, isIPv4 } from "node:net";

import { PublicFetchError } from "./fetch-error.js";

export type ResolvedAddress = Readonly<{
  address: string;
  family: 4 | 6;
}>;

const PRIVATE_IPV4_PREFIXES = [
  ["0.0.0.0", 8],
  ["10.0.0.0", 8],
  ["100.64.0.0", 10],
  ["127.0.0.0", 8],
  ["169.254.0.0", 16],
  ["172.16.0.0", 12],
  ["192.0.0.0", 24],
  ["192.0.2.0", 24],
  ["192.88.99.0", 24],
  ["192.168.0.0", 16],
  ["198.18.0.0", 15],
  ["198.51.100.0", 24],
  ["203.0.113.0", 24],
  ["224.0.0.0", 4],
  ["240.0.0.0", 4],
] as const;

const PRIVATE_IPV6_PREFIXES = [
  ["2001::", 23],
  ["2001:db8::", 32],
  ["2002::", 16],
  ["3ffe::", 16],
  ["3fff::", 20],
] as const;

/** Reports whether an address is conservative public unicast. */
export function isPublicAddress(address: string): boolean {
  const version = isIP(address);
  if (version === 4) {
    const bytes = parseIpv4(address);
    return !PRIVATE_IPV4_PREFIXES.some(([network, bits]) =>
      matchesPrefix(bytes, parseIpv4(network), bits),
    );
  }
  if (version !== 6) {
    return false;
  }
  const bytes = parseIpv6(address);
  return (
    bytes !== undefined &&
    (bytes[0] ?? 0) >>> 5 === 1 &&
    !isMappedIpv4(bytes) &&
    !PRIVATE_IPV6_PREFIXES.some(([network, bits]) =>
      matchesPrefix(bytes, requireIpv6(network), bits),
    )
  );
}

/** Validates every answer and returns a deterministic pinned address. */
export function selectPinnedAddress(
  answers: readonly ResolvedAddress[],
  maximumAnswers: number,
): ResolvedAddress {
  if (answers.length === 0 || answers.length > maximumAnswers) {
    throw new PublicFetchError("dns-failure");
  }
  if (
    answers.some(
      (answer) =>
        answer.family !== isIP(answer.address) ||
        !isPublicAddress(answer.address),
    )
  ) {
    throw new PublicFetchError("blocked-address");
  }
  const unique = [
    ...new Map(answers.map((answer) => [identity(answer), answer])).values(),
  ];
  unique.sort((left, right) => identity(left).localeCompare(identity(right)));
  const selected = unique[0];
  if (!selected) {
    throw new PublicFetchError("dns-failure");
  }
  return selected;
}

/** Reports whether a connected peer is the pinned address. */
export function peerMatches(
  peerAddress: string | undefined,
  pinned: ResolvedAddress,
): boolean {
  if (!peerAddress || isIP(peerAddress) === 0) {
    return false;
  }
  return comparableIdentity(peerAddress) === comparableIdentity(pinned.address);
}

/** Returns an IP literal without URL brackets, or undefined for a hostname. */
export function urlLiteralAddress(hostname: string): string | undefined {
  const unwrapped =
    hostname.startsWith("[") && hostname.endsWith("]")
      ? hostname.slice(1, -1)
      : hostname;
  return isIP(unwrapped) === 0 ? undefined : unwrapped;
}

/** Returns one stable binary identity for sorting and deduplication. */
function identity(answer: ResolvedAddress): string {
  return `${answer.family}:${comparableIdentity(answer.address)}`;
}

/** Returns a comparable identity, normalising mapped IPv4 peers. */
function comparableIdentity(address: string): string {
  if (isIPv4(address)) {
    return `4:${bytesToHex(parseIpv4(address))}`;
  }
  const bytes = parseIpv6(address);
  if (!bytes) {
    return "invalid";
  }
  if (isMappedIpv4(bytes)) {
    return `4:${bytesToHex(bytes.slice(12))}`;
  }
  return `6:${bytesToHex(bytes)}`;
}

/** Parses one canonical IPv4 address to bytes. */
function parseIpv4(address: string): Uint8Array {
  return Uint8Array.from(address.split(".").map((part) => Number(part)));
}

/** Parses one IPv6 address, including an embedded IPv4 suffix. */
function parseIpv6(address: string): Uint8Array | undefined {
  if (address.includes("%") || address.split("::").length > 2) {
    return undefined;
  }
  const expanded = expandEmbeddedIpv4(address);
  if (!expanded) {
    return undefined;
  }
  const [head = "", tail = ""] = expanded.split("::");
  const before = head ? head.split(":") : [];
  const after = tail ? tail.split(":") : [];
  const missing = 8 - before.length - after.length;
  if (
    (expanded.includes("::") && missing < 1) ||
    (!expanded.includes("::") && missing !== 0)
  ) {
    return undefined;
  }
  return ipv6PartsToBytes([
    ...before,
    ...Array<string>(missing).fill("0"),
    ...after,
  ]);
}

/** Rewrites an embedded dotted IPv4 suffix as two hexadecimal groups. */
function expandEmbeddedIpv4(address: string): string | undefined {
  const lastColon = address.lastIndexOf(":");
  const suffix = address.slice(lastColon + 1);
  if (!suffix.includes(".")) {
    return address;
  }
  if (!isIPv4(suffix)) {
    return undefined;
  }
  const bytes = parseIpv4(suffix);
  const high = ((bytes[0] ?? 0) << 8) | (bytes[1] ?? 0);
  const low = ((bytes[2] ?? 0) << 8) | (bytes[3] ?? 0);
  return `${address.slice(0, lastColon + 1)}${high.toString(16)}:${low.toString(16)}`;
}

/** Converts eight hexadecimal IPv6 groups to bytes. */
function ipv6PartsToBytes(parts: readonly string[]): Uint8Array | undefined {
  if (
    parts.length !== 8 ||
    parts.some((part) => !/^[0-9a-f]{1,4}$/iu.test(part))
  ) {
    return undefined;
  }
  const bytes = new Uint8Array(16);
  parts.forEach((part, index) => {
    const value = Number.parseInt(part, 16);
    bytes[index * 2] = value >>> 8;
    bytes[index * 2 + 1] = value & 0xff;
  });
  return bytes;
}

/** Returns a required parsed IPv6 network constant. */
function requireIpv6(address: string): Uint8Array {
  const bytes = parseIpv6(address);
  if (!bytes) {
    throw new Error("Invalid internal IPv6 network.");
  }
  return bytes;
}

/** Reports whether bytes belong to a network prefix. */
function matchesPrefix(
  address: Uint8Array,
  network: Uint8Array,
  bits: number,
): boolean {
  const wholeBytes = Math.floor(bits / 8);
  const remainingBits = bits % 8;
  for (let index = 0; index < wholeBytes; index += 1) {
    if (address[index] !== network[index]) {
      return false;
    }
  }
  if (remainingBits === 0) {
    return true;
  }
  const mask = (0xff << (8 - remainingBits)) & 0xff;
  return (
    ((address[wholeBytes] ?? 0) & mask) === ((network[wholeBytes] ?? 0) & mask)
  );
}

/** Reports whether IPv6 bytes encode an IPv4-mapped address. */
function isMappedIpv4(bytes: Uint8Array): boolean {
  return (
    bytes.slice(0, 10).every((value) => value === 0) &&
    bytes[10] === 0xff &&
    bytes[11] === 0xff
  );
}

/** Encodes bytes without depending on display-form address normalisation. */
function bytesToHex(bytes: Uint8Array): string {
  return [...bytes]
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("");
}
