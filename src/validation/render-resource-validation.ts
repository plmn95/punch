import type { Campaign } from "../core/schemas/index.js";
import { HttpUrlSchema } from "../core/schemas/primitives.js";
import {
  PHYSICAL_ADDRESS_PLACEHOLDER,
  UNSUBSCRIBE_PLACEHOLDER,
} from "../rendering/render-contract.js";
import {
  collectStartTags,
  exactAttribute,
  type GeneratedStartTag,
} from "./generated-html.js";

/** Counts exact literal appearances without treating the value as a pattern. */
function countOccurrences(value: string, expected: string): number {
  return value.split(expected).length - 1;
}

/** Reports whether one generated URL retains its canonical allowed value. */
function isAllowedUrl(value: string): boolean {
  if (value === UNSUBSCRIBE_PLACEHOLDER) {
    return true;
  }
  const parsed = HttpUrlSchema.safeParse(value);
  return parsed.success && parsed.data === value;
}

/** Checks CSS resource indirection only inside generated CSS surfaces. */
function cssResourcesPass(html: string, tags: GeneratedStartTag[]): boolean {
  const styleAttributes = tags.flatMap((tag) => {
    const style = exactAttribute(tag, "style");
    return style === undefined ? [] : [style];
  });
  const styleBlocks = [
    ...html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/giu),
  ].flatMap((match) => (match[1] === undefined ? [] : [match[1]]));
  return [...styleAttributes, ...styleBlocks].every(
    (style) => !/url\s*\(/iu.test(style),
  );
}

/** Checks all generated href/src attributes and closed CSS resource surfaces. */
export function resourceUrlsPass(html: string): boolean {
  const tags = collectStartTags(html);
  const resources: Array<readonly [GeneratedStartTag, "href" | "src"]> = [];
  for (const tag of tags) {
    if (tag.name === "a") {
      resources.push([tag, "href"]);
    }
    if (tag.name === "img") {
      resources.push([tag, "src"]);
    }
  }
  return (
    cssResourcesPass(html, tags) &&
    resources.every(([tag, attribute]) => {
      const value = exactAttribute(tag, attribute);
      return value !== undefined && isAllowedUrl(value);
    })
  );
}

/** Checks exact renderer-owned compliance literals and final ordering. */
export function compliancePasses(campaign: Campaign, html: string): boolean {
  const tags = collectStartTags(html);
  const complianceTags = tags.filter(
    (tag) => exactAttribute(tag, "data-punch-compliance") !== undefined,
  );
  const lastBlock = campaign.blocks.at(-1);
  const lastBlockIndex = tags.find(
    (tag) =>
      lastBlock !== undefined &&
      exactAttribute(tag, "data-punch-block-id") === lastBlock.id,
  )?.index;
  const complianceIndex = complianceTags[0]?.index;
  const complianceTag = complianceTags[0];
  const scope =
    complianceIndex === undefined ? "" : html.slice(complianceIndex);
  return (
    complianceTags.length === 1 &&
    complianceTag !== undefined &&
    exactAttribute(complianceTag, "data-punch-compliance") === "v1" &&
    countOccurrences(html, PHYSICAL_ADDRESS_PLACEHOLDER) === 1 &&
    countOccurrences(html, UNSUBSCRIBE_PLACEHOLDER) === 1 &&
    scope.includes(PHYSICAL_ADDRESS_PLACEHOLDER) &&
    scope.includes(`href="${UNSUBSCRIBE_PLACEHOLDER}"`) &&
    lastBlockIndex !== undefined &&
    complianceIndex !== undefined &&
    complianceIndex > lastBlockIndex
  );
}
