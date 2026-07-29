import { expect, it } from "vitest";

import { runCampaignPipeline } from "../../src/core/run-campaign-pipeline.js";
import type {
  FetchedResource,
  PublicFetchSession,
} from "../../src/extraction/http/index.js";
import {
  modelResponse,
  QueuedTextModel,
} from "../support/queued-text-model.js";

const WEBSITE_URL = "https://steady-signal.example.com/";
const PRODUCT_URL = `${WEBSITE_URL}products/signal-lamp`;

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

/** Creates the fictional website/product source session for integration. */
function sourceSession(onDispose: () => void): PublicFetchSession {
  const product = {
    "@type": "Product",
    url: PRODUCT_URL,
    name: "Signal Lamp",
    description: "A compact powder-coated desk lamp with a pivoting shade.",
    image: `${WEBSITE_URL}images/signal-lamp.jpg`,
    offers: {
      price: "84.00",
      priceCurrency: "EUR",
      availability: "https://schema.org/InStock",
    },
  };
  return {
    fetchHtml: (url) =>
      Promise.resolve(
        url === WEBSITE_URL
          ? resource(
              url,
              '<meta property="og:site_name" content="Steady Signal">',
            )
          : resource(
              url,
              `<script type="application/ld+json">${JSON.stringify(
                product,
              )}</script>`,
            ),
      ),
    fetchStylesheet: () =>
      Promise.reject(new Error("No stylesheet was discovered.")),
    dispose: onDispose,
  };
}

it("connects explicit sources to the existing generation engine", async () => {
  let disposed = false;
  const draft = {
    schemaVersion: "0.1.0",
    goal: "sales",
    subject: "A focused light for your desk",
    preheader: "Meet the compact Signal Lamp.",
    blocks: [
      {
        type: "header-standard",
        brandName: "Steady Signal",
        homeUrl: WEBSITE_URL,
      },
      {
        type: "product-feature",
        productId: "product-01",
        name: "Signal Lamp",
        description: "A compact powder-coated desk lamp with a pivoting shade.",
        price: { amount: "84.00", currency: "EUR" },
        image: {
          url: `${WEBSITE_URL}images/signal-lamp.jpg`,
          alt: "Signal Lamp",
        },
        cta: { label: "View Signal Lamp", href: PRODUCT_URL },
      },
    ],
  };
  const model = new QueuedTextModel([
    modelResponse(JSON.stringify(draft)),
    modelResponse(JSON.stringify({ issues: [] })),
  ]);

  const result = await runCampaignPipeline(
    { website: WEBSITE_URL, products: [PRODUCT_URL], goal: "sales" },
    {
      model,
      fetchSession: sourceSession(() => {
        disposed = true;
      }),
    },
  );

  expect(disposed).toBe(true);
  expect(result.extraction.context.products[0]).toMatchObject({
    productId: "product-01",
    suppliedUrl: PRODUCT_URL,
    name: { state: "observed", value: "Signal Lamp" },
    price: {
      state: "observed",
      value: { amount: "84.00", currency: "EUR" },
    },
  });
  expect(result.generation.finalCampaign.blocks[1]).toMatchObject({
    type: "product-feature",
    productId: "product-01",
    name: "Signal Lamp",
  });
  expect(model.requests.map((request) => request.stage)).toEqual([
    "emit",
    "critique",
  ]);
  expect(model.requests[0]?.user).toContain('"productId":"product-01"');
  expect(model.requests[0]?.user).toContain(PRODUCT_URL);
  expect(model.requests[1]?.user).toContain('"name":"Signal Lamp"');
  expect(model.requests[1]?.user).toContain(PRODUCT_URL);
});
