import { describe, expect, it, vi } from "vitest";

import { extractGenerationContext } from "../../src/extraction/extract-generation-context.js";
import { ExtractionError } from "../../src/extraction/extraction-error.js";
import type {
  FetchedResource,
  PublicFetchSession,
} from "../../src/extraction/http/index.js";
import {
  QueuedTextModel,
  modelResponse,
} from "../support/queued-text-model.js";

const website = "https://grove.example.com/";
const product = `${website}products/mug`;
const input = { website, products: [product], goal: "sales" };

/** Creates bounded fictional resources without touching a real website. */
function resource(url: string, html: string): FetchedResource {
  const body = new TextEncoder().encode(html);
  return {
    requestedUrl: url,
    finalUrl: url,
    mediaType: "text/html",
    charset: "utf-8",
    body,
    compressedBytes: body.length,
    decompressedBytes: body.length,
    redirectCount: 0,
  };
}

/** Supplies one brand and one observed product to the real extraction path. */
function session(): PublicFetchSession {
  return {
    fetchHtml: async (url) =>
      resource(
        url,
        url === website
          ? "<style>body{background:#fff;color:#111;font-family:Verdana}button{background:#006644}</style><p>Quiet goods for your home.</p>"
          : `<script type="application/ld+json">${JSON.stringify({ "@type": "Product", url: product, name: "Grove Mug" })}</script>`,
      ),
    fetchStylesheet: vi.fn(),
    dispose: vi.fn(),
  };
}

describe("brand review before paid model work", () => {
  it("reviews deterministic styles after disposing fetch resources and before voice inference", async () => {
    const fetchSession = session();
    const model = new QueuedTextModel([modelResponse("{}")]);
    const result = await extractGenerationContext(input, {
      fetchSession,
      model,
      reviewBrand: async (brand) => {
        expect(model.requests).toHaveLength(0);
        expect(fetchSession.dispose).toHaveBeenCalled();
        expect(brand.settings.primaryColour).toBe("#006644");
        return { primaryColour: "#2563EB" };
      },
    });
    expect(result.brand?.settings.primaryColour).toBe("#2563EB");
    expect(result.brand?.sources.primaryColour).toBe("manual");
    expect(result.brand?.sources.bodyFont).toBe("website");
    expect(model.requests).toHaveLength(1);
    expect(JSON.stringify(result.context)).not.toContain("#2563EB");
  });

  it("cancels review without spending tokens or returning a campaign", async () => {
    const model = new QueuedTextModel([]);
    await expect(
      extractGenerationContext(input, {
        fetchSession: session(),
        model,
        reviewBrand: async () => {
          throw new ExtractionError("cancelled", false);
        },
      }),
    ).rejects.toMatchObject({ code: "cancelled" });
    expect(model.requests).toHaveLength(0);
  });
});
