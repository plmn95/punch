import type { HtmlDocument } from "./html-document.js";
import { jsonLdValues, resolveObservedUrl } from "./html-document.js";
import { ExtractionError } from "./extraction-error.js";

export type JsonRecord = Readonly<Record<string, unknown>>;

export type SelectedJsonRecord = Readonly<{
  record: JsonRecord;
  index: number;
}>;

const MAX_JSON_RECORDS = 64;
const MAX_JSON_VISITS = 256;

/** Selects one isolated JSON-LD node without combining sibling records. */
export function selectJsonRecord(
  document: HtmlDocument,
  types: readonly string[],
  finalUrl: string,
  match: "exact-url" | "origin",
): SelectedJsonRecord | undefined {
  const records = flattenJsonRecords(jsonLdValues(document));
  const candidates = records
    .map((record, index) => ({ record, index }))
    .filter(({ record }) => hasJsonType(record, types));
  const matched = candidates.filter(({ record }) =>
    recordMatchesUrl(record, finalUrl, match),
  );

  if (matched.length === 1) {
    return matched[0];
  }
  const soleCandidate = candidates.length === 1 ? candidates[0] : undefined;
  return matched.length === 0 &&
    soleCandidate &&
    !hasDeclaredIdentity(soleCandidate.record)
    ? soleCandidate
    : undefined;
}

/** Reads one non-empty string property from a JSON-LD record. */
export function jsonString(
  record: JsonRecord,
  property: string,
): string | undefined {
  const value = record[property];
  return typeof value === "string" && value.trim() ? value : undefined;
}

/** Returns record values from an object-or-array JSON-LD property. */
export function jsonRecords(
  record: JsonRecord,
  property: string,
): JsonRecord[] {
  const value = record[property];
  const values = Array.isArray(value) ? value : [value];
  return values.filter(isJsonRecord);
}

/** Returns string and object URL values from a JSON-LD property. */
export function jsonUrlValues(record: JsonRecord, property: string): string[] {
  const value = record[property];
  const values = Array.isArray(value) ? value : [value];
  return values.flatMap((entry) => {
    if (typeof entry === "string") {
      return [entry];
    }
    if (isJsonRecord(entry)) {
      return [jsonString(entry, "url"), jsonString(entry, "@id")].filter(
        (candidate): candidate is string => Boolean(candidate),
      );
    }
    return [];
  });
}

/** Flattens bounded top-level arrays and @graph containers without recursion. */
function flattenJsonRecords(values: readonly unknown[]): JsonRecord[] {
  const records: JsonRecord[] = [];
  const pending: unknown[] = [];
  let truncated = pushPending(values, pending, MAX_JSON_VISITS);
  let visits = 0;
  while (
    pending.length > 0 &&
    records.length < MAX_JSON_RECORDS &&
    visits < MAX_JSON_VISITS
  ) {
    const value = pending.pop();
    visits += 1;
    if (Array.isArray(value)) {
      truncated =
        pushPending(value, pending, MAX_JSON_VISITS - visits) || truncated;
      continue;
    }
    if (!isJsonRecord(value)) {
      continue;
    }
    records.push(value);
    const graph = value["@graph"];
    if (Array.isArray(graph)) {
      truncated =
        pushPending(graph, pending, MAX_JSON_VISITS - visits) || truncated;
    }
  }
  if (truncated || pending.length > 0) {
    throw new ExtractionError("invalid-source", false);
  }
  return records;
}

/** Pushes the first bounded values in reverse for stable stack traversal. */
function pushPending(
  values: readonly unknown[],
  pending: unknown[],
  remainingVisits: number,
): boolean {
  const count = Math.min(
    values.length,
    Math.max(0, remainingVisits - pending.length),
  );
  for (let index = count - 1; index >= 0; index -= 1) {
    pending.push(values[index]);
  }
  return count < values.length;
}

/** Reports whether an unknown value is a plain JSON object. */
function isJsonRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Reports whether a record declares one of the requested schema types. */
function hasJsonType(record: JsonRecord, types: readonly string[]): boolean {
  const raw = record["@type"];
  const declared = (Array.isArray(raw) ? raw : [raw])
    .filter((value): value is string => typeof value === "string")
    .map((value) => value.toLowerCase());
  return types.some((type) => declared.includes(type.toLowerCase()));
}

/** Reports whether a record has one URL matching the fetched page. */
function recordMatchesUrl(
  record: JsonRecord,
  finalUrl: string,
  match: "exact-url" | "origin",
): boolean {
  const values = [
    ...jsonUrlValues(record, "url"),
    ...jsonUrlValues(record, "@id"),
    ...jsonUrlValues(record, "mainEntityOfPage"),
  ];
  return values.some((value) => {
    const resolved = resolveObservedUrl(value, finalUrl);
    if (!resolved) {
      return false;
    }
    return match === "exact-url"
      ? resolved === finalUrl
      : new URL(resolved).origin === new URL(finalUrl).origin;
  });
}

/** Reports whether a record declares any non-empty identity property. */
function hasDeclaredIdentity(record: JsonRecord): boolean {
  return ["url", "@id", "mainEntityOfPage"].some((property) =>
    isNonEmptyIdentityValue(record[property]),
  );
}

/** Conservatively classifies invalid identity values as declared identities. */
function isNonEmptyIdentityValue(value: unknown): boolean {
  if (value === undefined || value === null) {
    return false;
  }
  if (typeof value === "string") {
    return value.trim().length > 0;
  }
  if (Array.isArray(value)) {
    return value.length > 0;
  }
  if (isJsonRecord(value)) {
    return Object.keys(value).length > 0;
  }
  return true;
}
