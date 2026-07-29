import {
  AvailabilitySchema,
  MoneySchema,
  type Availability,
  type EvidenceRef,
  type Money,
} from "../core/schemas/index.js";
import type { ProductSource } from "./contracts.js";
import { type FactCandidate, resolveCriticalFact } from "./fact-candidates.js";
import { metadataValues, type HtmlDocument } from "./html-document.js";
import { jsonRecords, jsonString, type JsonRecord } from "./structured-data.js";

/** Extracts atomic price/currency candidates from one source group. */
export function extractProductPrice(
  source: ProductSource,
  document: HtmlDocument,
  record: JsonRecord | undefined,
  prefix: string | undefined,
) {
  const offers = record ? jsonRecords(record, "offers") : [];
  const jsonCandidates = offers.flatMap((offer, index) =>
    moneyCandidates(
      offer,
      productEvidenceRef(
        source,
        `${prefix ?? "jsonld.product"}.offer-${ordinal(index)}.price`,
      ),
    ),
  );
  return resolveCriticalFact([
    ...jsonCandidates,
    ...metadataPriceCandidates(source, document),
  ]);
}

/** Builds one complete metadata price without cross-source pairing. */
function metadataPriceCandidates(
  source: ProductSource,
  document: HtmlDocument,
): FactCandidate<Money>[] {
  const amounts = metadataValues(document, "property", "product:price:amount");
  const currencies = metadataValues(
    document,
    "property",
    "product:price:currency",
  );
  if (amounts.length !== 1 || currencies.length !== 1) {
    return [];
  }
  return createMoneyCandidate(
    amounts[0]!,
    currencies[0]!,
    productEvidenceRef(source, "meta.product-price"),
  );
}

/** Extracts availability without inferring inventory state. */
export function extractProductAvailability(
  source: ProductSource,
  document: HtmlDocument,
  record: JsonRecord | undefined,
  prefix: string | undefined,
) {
  const offers = record ? jsonRecords(record, "offers") : [];
  return resolveCriticalFact([
    ...availabilityCandidatesFromOffers(source, offers, prefix),
    ...availabilityCandidatesFromMetadata(source, document),
  ]);
}

/** Builds availability candidates from complete JSON-LD offers. */
function availabilityCandidatesFromOffers(
  source: ProductSource,
  offers: readonly JsonRecord[],
  prefix: string | undefined,
): FactCandidate<Availability>[] {
  return offers.flatMap((offer, index) => {
    const value = parseAvailability(jsonString(offer, "availability"));
    return value
      ? [
          productFactCandidate(
            value,
            productEvidenceRef(
              source,
              `${prefix ?? "jsonld.product"}.offer-${ordinal(
                index,
              )}.availability`,
            ),
            value,
          ),
        ]
      : [];
  });
}

/** Builds availability candidates from matching product metadata. */
function availabilityCandidatesFromMetadata(
  source: ProductSource,
  document: HtmlDocument,
): FactCandidate<Availability>[] {
  return metadataValues(document, "property", "product:availability").flatMap(
    (raw) => {
      const value = parseAvailability(raw);
      return value
        ? [
            productFactCandidate(
              value,
              productEvidenceRef(source, "meta.product-availability"),
              value,
            ),
          ]
        : [];
    },
  );
}

/** Converts observed availability labels to the closed enum. */
export function parseAvailability(
  value: string | undefined,
): Availability | undefined {
  const token = value
    ?.split("/")
    .at(-1)
    ?.replace(/[^A-Za-z]/gu, "")
    .toLowerCase();
  const mapped: Readonly<Record<string, Availability>> = {
    backorder: "backorder",
    discontinued: "discontinued",
    instock: "in-stock",
    outofstock: "out-of-stock",
    preorder: "preorder",
  };
  const result = token ? mapped[token] : undefined;
  return result && AvailabilitySchema.safeParse(result).success
    ? result
    : undefined;
}

/** Builds complete money candidates without cross-source pairing. */
function moneyCandidates(
  offer: JsonRecord,
  evidence: EvidenceRef,
): FactCandidate<Money>[] {
  const amount = jsonScalarString(offer, "price");
  const currency = jsonScalarString(offer, "priceCurrency");
  const direct =
    amount && currency ? createMoneyCandidate(amount, currency, evidence) : [];
  const low = jsonScalarString(offer, "lowPrice");
  const high = jsonScalarString(offer, "highPrice");
  return [
    ...direct,
    ...(low && currency ? createMoneyCandidate(low, currency, evidence) : []),
    ...(high && currency ? createMoneyCandidate(high, currency, evidence) : []),
  ];
}

/** Reads bounded JSON strings or finite numbers without coercing other types. */
function jsonScalarString(record: JsonRecord, key: string): string | undefined {
  const value = record[key];
  if (typeof value === "string") {
    return value;
  }
  return typeof value === "number" && Number.isFinite(value)
    ? String(value)
    : undefined;
}

/** Creates one schema-valid atomic money candidate. */
function createMoneyCandidate(
  amount: string,
  currency: string,
  evidence: EvidenceRef,
): FactCandidate<Money>[] {
  const parsed = MoneySchema.safeParse({
    amount: amount.trim(),
    currency: currency.trim().toUpperCase(),
  });
  return parsed.success
    ? [productFactCandidate(parsed.data, evidence, moneyKey(parsed.data))]
    : [];
}

/** Returns one product-scoped evidence reference. */
export function productEvidenceRef(
  source: ProductSource,
  field: string,
): EvidenceRef {
  return {
    source: "product",
    productId: source.productId,
    url: source.finalUrl,
    field,
  };
}

/** Creates one typed product candidate with a caller-owned semantic key. */
export function productFactCandidate<T>(
  value: T,
  evidence: EvidenceRef,
  key: string,
): FactCandidate<T> {
  return { value, evidence: [evidence], key };
}

/** Returns a stable one-based structured-data ordinal. */
function ordinal(index: number): string {
  return String(index + 1).padStart(2, "0");
}

/** Returns a money key that ignores non-semantic display differences. */
function moneyKey(money: Money): string {
  return `${decimalKey(money.amount)}\u0000${money.currency}`;
}

/** Canonicalises a schema-valid decimal for equality without changing output. */
function decimalKey(amount: string): string {
  if (!amount.includes(".")) {
    return amount;
  }
  const trimmed = amount.replace(/0+$/u, "").replace(/\.$/u, "");
  return trimmed.length > 0 ? trimmed : "0";
}
