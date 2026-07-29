import { expect, it } from "vitest";

import { collectProductBlockBindings } from "../../src/core/product-bindings.js";
import { productIdFromIndex } from "../../src/core/schemas/index.js";
import { runCampaignPipeline } from "../../src/core/run-campaign-pipeline.js";
import type {
  FetchedResource,
  PublicFetchSession,
} from "../../src/extraction/http/index.js";
import { renderCampaignHtml } from "../../src/rendering/render-campaign-html.js";
import {
  modelResponse,
  QueuedTextModel,
} from "../support/queued-text-model.js";

const WEBSITE_URL = "https://ordered-atelier.example.com/";

/** Creates one bounded fictional fetched HTML document. */
function resource(url: string, html: string): FetchedResource {
  const body = new TextEncoder().encode(html);
  return {
    requestedUrl: url,
    finalUrl: url,
    mediaType: "text/html",
    charset: "utf-8",
    body,
    compressedBytes: body.byteLength,
    decompressedBytes: body.byteLength,
    redirectCount: 0,
  };
}

/** Creates a product document whose requests complete in reverse input order. */
function sourceSession(productUrls: readonly string[]): PublicFetchSession {
  return {
    async fetchHtml(url) {
      if (url === WEBSITE_URL) {
        return resource(
          url,
          '<meta property="og:site_name" content="Ordered Atelier">',
        );
      }
      const index = productUrls.indexOf(url);
      await new Promise((resolve) =>
        setTimeout(resolve, (productUrls.length - index) * 2),
      );
      return resource(
        url,
        `<script type="application/ld+json">${JSON.stringify({
          "@type": "Product",
          url,
          name: `Atelier Vessel ${index + 1}`,
          image: `${WEBSITE_URL}images/vessel-${index + 1}.jpg`,
          offers: {
            price: String(40 + index),
            priceCurrency: "EUR",
          },
        })}</script>`,
      );
    },
    fetchStylesheet: () =>
      Promise.reject(new Error("No fictional stylesheet was requested.")),
    dispose() {},
  };
}

/** Creates one model-authored product presentation for a canonical ID. */
function productPresentation(index: number, productUrl: string) {
  const sequence = index + 1;
  return {
    productId: productIdFromIndex(index),
    name: `Atelier Vessel ${sequence}`,
    price: { amount: String(40 + index), currency: "EUR" },
    image: {
      url: `${WEBSITE_URL}images/vessel-${sequence}.jpg`,
      alt: `Atelier Vessel ${sequence}`,
    },
    cta: { label: "View vessel", href: productUrl },
  };
}

/** Creates one single- or six-product semantic model response. */
function campaignPayload(productUrls: readonly string[]) {
  const products = productUrls.map((productUrl, index) =>
    productPresentation(index, productUrl),
  );
  return {
    schemaVersion: "0.1.0",
    goal: "sales",
    subject: "A considered vessel selection",
    preheader: "Explore the fictional Ordered Atelier collection.",
    blocks: [
      {
        type: "header-standard",
        brandName: "Ordered Atelier",
        homeUrl: WEBSITE_URL,
      },
      {
        type: "product-feature",
        ...products[0],
      },
      ...(products.length === 1
        ? []
        : [
            {
              type: "product-grid",
              columns: 3,
              items: products.slice(1),
            },
          ]),
    ],
  };
}

/** Reads product ownership markers from standalone HTML in render order. */
function renderedProductIds(html: string): string[] {
  return [...html.matchAll(/data-punch-product-id="(product-0[1-6])"/gu)].map(
    (match) => match[1]!,
  );
}

it.each([1, 6])(
  "grounds and renders %s input-order product presentations",
  async (productCount) => {
    const productUrls = Array.from(
      { length: productCount },
      (_, index) => `${WEBSITE_URL}products/vessel-${index + 1}`,
    );
    const expectedIds = productUrls.map((_, index) =>
      productIdFromIndex(index),
    );
    const model = new QueuedTextModel([
      modelResponse(JSON.stringify(campaignPayload(productUrls))),
      modelResponse(JSON.stringify({ issues: [] })),
    ]);

    const result = await runCampaignPipeline(
      { website: WEBSITE_URL, products: productUrls, goal: "sales" },
      {
        model,
        fetchSession: sourceSession(productUrls),
      },
    );
    const html = await renderCampaignHtml(result.generation.finalCampaign);

    expect(
      result.extraction.context.products.map((product) => product.productId),
    ).toEqual(expectedIds);
    expect(
      collectProductBlockBindings(result.generation.finalCampaign).map(
        (binding) => binding.productId,
      ),
    ).toEqual(expectedIds);
    expect(result.generation.grounding).toEqual({ valid: true, issues: [] });
    expect(renderedProductIds(html)).toEqual(expectedIds);
    for (const request of model.requests) {
      for (const productId of expectedIds) {
        expect(request.user).toContain(`"productId":"${productId}"`);
      }
    }
  },
);
