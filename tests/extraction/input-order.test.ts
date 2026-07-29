import { describe, expect, it } from "vitest";

import { extractGenerationContext } from "../../src/extraction/index.js";
import type {
  FetchedResource,
  PublicFetchSession,
} from "../../src/extraction/http/index.js";
import { PublicFetchError } from "../../src/extraction/http/fetch-error.js";
import {
  modelResponse,
  QueuedTextModel,
} from "../support/queued-text-model.js";

const WEBSITE_URL = "https://ordered-orbit.example.com/";

/** Creates one bounded fictional fetched HTML resource. */
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

/** Creates a session whose product requests finish in reverse order. */
function orderedSession(productUrls: readonly string[]): PublicFetchSession {
  return {
    async fetchHtml(url) {
      if (url === WEBSITE_URL) {
        return resource(
          url,
          `<meta property="og:site_name" content="Ordered Orbit">`,
        );
      }
      const index = productUrls.indexOf(url);
      await new Promise((resolve) =>
        setTimeout(resolve, (productUrls.length - index) * 2),
      );
      return resource(url, `<h1>Ordered Product ${index + 1}</h1>`);
    },
    async fetchStylesheet() {
      throw new Error("No fictional stylesheet was requested.");
    },
    dispose() {},
  };
}

describe("input-order extraction", () => {
  it.each([1, 6])(
    "preserves stable IDs and supplied URL order for %s products",
    async (count) => {
      const products = Array.from(
        { length: count },
        (_, index) => `${WEBSITE_URL}products/item-${index + 1}`,
      );

      const result = await extractGenerationContext(
        { website: WEBSITE_URL, products, goal: "sales" },
        { fetchSession: orderedSession(products) },
      );

      expect(
        result.context.products.map((product) => product.productId),
      ).toEqual(
        products.map(
          (_, index) => `product-${String(index + 1).padStart(2, "0")}`,
        ),
      );
      expect(
        result.context.products.map((product) => product.suppliedUrl),
      ).toEqual(products);
      expect(
        result.context.products.map((product) =>
          product.name.state === "observed" ? product.name.value : "unknown",
        ),
      ).toEqual(products.map((_, index) => `Ordered Product ${index + 1}`));
      expect(result.usage.calls).toEqual([]);
    },
  );

  it("fails the whole extraction when one required product cannot be fetched", async () => {
    const products = [
      `${WEBSITE_URL}products/item-1`,
      `${WEBSITE_URL}products/item-2`,
    ];
    const session = orderedSession(products);
    const failing: PublicFetchSession = {
      ...session,
      fetchHtml: (url) =>
        url === products[1]
          ? Promise.reject(new Error("fictional fetch failure"))
          : session.fetchHtml(url),
    };

    await expect(
      extractGenerationContext(
        { website: WEBSITE_URL, products, goal: "sales" },
        { fetchSession: failing },
      ),
    ).rejects.toMatchObject({ code: "invalid-source" });
  });

  it("fails safely when a required product name remains unknown", async () => {
    const product = `${WEBSITE_URL}products/unnamed`;
    const session: PublicFetchSession = {
      fetchHtml: (url) =>
        Promise.resolve(
          resource(
            url,
            url === WEBSITE_URL
              ? `<meta property="og:site_name" content="Ordered Orbit">`
              : `<main><p>Only a vague product description.</p></main>`,
          ),
        ),
      fetchStylesheet: () =>
        Promise.reject(new Error("No stylesheet expected.")),
      dispose() {},
    };

    await expect(
      extractGenerationContext(
        { website: WEBSITE_URL, products: [product], goal: "sales" },
        { fetchSession: session },
      ),
    ).rejects.toMatchObject({ code: "insufficient-product-evidence" });
  });

  it("omits an undecodable optional stylesheet and disposes the session", async () => {
    const product = `${WEBSITE_URL}products/item-1`;
    let disposed = false;
    const session: PublicFetchSession = {
      fetchHtml: (url) =>
        Promise.resolve(
          resource(
            url,
            url === WEBSITE_URL
              ? `<link rel="stylesheet" href="/styles/brand.css">`
              : `<h1>Ordered Product</h1>`,
          ),
        ),
      fetchStylesheet: (url) => {
        const body = new TextEncoder().encode(".brand{color:#123456}");
        return Promise.resolve({
          requestedUrl: url,
          finalUrl: url,
          mediaType: "text/css",
          charset: "utf-16",
          body,
          compressedBytes: body.byteLength,
          decompressedBytes: body.byteLength,
          redirectCount: 0,
        });
      },
      dispose: () => {
        disposed = true;
      },
    };

    const result = await extractGenerationContext(
      { website: WEBSITE_URL, products: [product], goal: "sales" },
      { fetchSession: session },
    );

    expect(result.context.brand.colours).toEqual({ state: "unknown" });
    expect(disposed).toBe(true);
  });

  it("omits a per-document timeout for one optional stylesheet", async () => {
    const product = `${WEBSITE_URL}products/item-1`;
    const session: PublicFetchSession = {
      fetchHtml: (url) =>
        Promise.resolve(
          resource(
            url,
            url === WEBSITE_URL
              ? `<link rel="stylesheet" href="/styles/brand.css">`
              : `<h1>Ordered Product</h1>`,
          ),
        ),
      fetchStylesheet: () => Promise.reject(new PublicFetchError("timeout")),
      dispose() {},
    };

    const result = await extractGenerationContext(
      { website: WEBSITE_URL, products: [product], goal: "sales" },
      { fetchSession: session },
    );

    expect(result.context.brand.colours).toEqual({ state: "unknown" });
  });

  it("propagates the total fetch timeout before any model call", async () => {
    const product = `${WEBSITE_URL}products/item-1`;
    const model = new QueuedTextModel([
      modelResponse(
        '{"voice":{"traits":["warm"],"segmentIds":["segment-01"]}}',
      ),
    ]);
    const session: PublicFetchSession = {
      fetchHtml: (url) =>
        Promise.resolve(
          resource(
            url,
            url === WEBSITE_URL
              ? `<link rel="stylesheet" href="/styles/brand.css">
                 <p>Considered objects for calm daily rituals.</p>`
              : `<h1>Ordered Product</h1>`,
          ),
        ),
      fetchStylesheet: () =>
        Promise.reject(new PublicFetchError("session-timeout")),
      dispose() {},
    };

    await expect(
      extractGenerationContext(
        { website: WEBSITE_URL, products: [product], goal: "sales" },
        { fetchSession: session, model },
      ),
    ).rejects.toMatchObject({ code: "session-timeout" });
    expect(model.requests).toEqual([]);
  });
});
