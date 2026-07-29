import type { SourceSegment } from "./contracts.js";
import type { HtmlDocument } from "./html-document.js";
import {
  elementName,
  isHiddenNode,
  visibleNodeText,
  walkElements,
} from "./html-document.js";
import { sanitiseSourceText } from "./text-normalisation.js";

const MAX_SEGMENTS = 24;
const MAX_SEGMENT_BYTES = 1_000;
const MAX_SEGMENT_TOTAL_BYTES = 20_000;
const SOURCE_ELEMENTS = new Set(["dd", "dt", "h1", "h2", "h3", "li", "p"]);
export { sanitiseSourceText } from "./text-normalisation.js";

/** Extracts stable visible source segments without executing page content. */
export function buildSourceSegments(document: HtmlDocument): SourceSegment[] {
  const segments: SourceSegment[] = [];
  const seen = new Set<string>();
  let totalBytes = 0;

  walkElements(document, (element) => {
    if (
      segments.length >= MAX_SEGMENTS ||
      !SOURCE_ELEMENTS.has(elementName(element)) ||
      isHiddenNode(element)
    ) {
      return;
    }
    const text = truncateUtf8(sanitiseSourceText(visibleNodeText(element)));
    const bytes = byteLength(text);
    if (
      text.length < 2 ||
      seen.has(text) ||
      totalBytes + bytes > MAX_SEGMENT_TOTAL_BYTES
    ) {
      return;
    }
    const number = String(segments.length + 1).padStart(2, "0");
    segments.push({
      id: `segment-${number}`,
      field: `text.segment-${number}`,
      text,
    });
    seen.add(text);
    totalBytes += bytes;
  });
  return segments;
}

/** Reports whether a segment ID belongs to the bounded source set. */
export function findSourceSegment(
  segments: readonly SourceSegment[],
  id: string,
): SourceSegment | undefined {
  return segments.find((segment) => segment.id === id);
}

/** Truncates a source segment without splitting a UTF-8 sequence. */
function truncateUtf8(value: string): string {
  if (byteLength(value) <= MAX_SEGMENT_BYTES) {
    return value;
  }
  let result = "";
  for (const character of value) {
    if (byteLength(result + character) > MAX_SEGMENT_BYTES) {
      break;
    }
    result += character;
  }
  return result.trim();
}

/** Returns the exact UTF-8 size of a string. */
function byteLength(value: string): number {
  return new TextEncoder().encode(value).byteLength;
}
