import { describe, expect, it } from "vitest";

import { extractProduct } from "../../src/extraction/extract-product.js";

const PRODUCT_URL = "https://signal-grove.example.com/products/pebble-flask";

/** Extracts one newly fictional product page. */
function extract(html: string) {
  return extractProduct({
    productId: "product-01",
    suppliedUrl: PRODUCT_URL,
    finalUrl: PRODUCT_URL,
    html,
  }).evidence;
}

describe("deterministic product parsing", () => {
  it("selects one URL-matched JSON-LD product without mixing sibling nodes", () => {
    const html = `<!doctype html>
      <html><head>
        <script type="application/ld+json">${JSON.stringify([
          {
            "@type": "Product",
            url: "https://signal-grove.example.com/products/other",
            name: "Wrong Lantern",
            offers: {
              "@type": "Offer",
              price: "900",
              priceCurrency: "USD",
            },
          },
          {
            "@type": "Product",
            url: PRODUCT_URL,
            name: "Pebble Flask",
            image: "/images/pebble-flask.jpg",
            description: "A compact steel flask for everyday walks.",
            offers: {
              "@type": "Offer",
              price: "39",
              priceCurrency: "EUR",
              availability: "https://schema.org/InStock",
            },
          },
        ])}</script>
        <meta property="og:title" content="Social title must not replace the match">
        <meta property="og:image" content="/images/social-image.jpg">
      </head><body><h1>Page fallback must not replace the match</h1></body></html>`;

    const product = extract(html);

    expect(product.name).toMatchObject({
      state: "observed",
      value: "Pebble Flask",
    });
    expect(product.price).toMatchObject({
      state: "observed",
      value: { amount: "39", currency: "EUR" },
    });
    expect(product.imageUrl).toMatchObject({
      state: "observed",
      value: "https://signal-grove.example.com/images/pebble-flask.jpg",
    });
    expect(JSON.stringify(product)).not.toContain("Wrong Lantern");
    expect(JSON.stringify(product)).not.toContain("900");
    expect(JSON.stringify(product)).not.toContain("Social title");
    expect(JSON.stringify(product)).not.toContain("social-image.jpg");
  });

  it("keeps distinct offer amount/currency pairs as an atomic conflict", () => {
    const html = `<script type="application/ld+json">${JSON.stringify({
      "@type": "Product",
      url: PRODUCT_URL,
      name: "Pebble Flask",
      offers: [
        { "@type": "Offer", price: "39", priceCurrency: "EUR" },
        { "@type": "Offer", price: "42", priceCurrency: "USD" },
      ],
    })}</script>`;

    const product = extract(html);

    expect(product.price).toEqual({
      state: "conflicted",
      candidates: [
        {
          value: { amount: "39", currency: "EUR" },
          evidence: [expect.objectContaining({ field: expect.any(String) })],
        },
        {
          value: { amount: "42", currency: "USD" },
          evidence: [expect.objectContaining({ field: expect.any(String) })],
        },
      ],
    });
  });

  it("preserves JSON-LD and metadata commerce conflicts", () => {
    const html = `<head>
      <script type="application/ld+json">${JSON.stringify({
        "@type": "Product",
        url: PRODUCT_URL,
        name: "Pebble Flask",
        offers: {
          price: "39",
          priceCurrency: "EUR",
          availability: "https://schema.org/InStock",
        },
      })}</script>
      <meta property="product:price:amount" content="42">
      <meta property="product:price:currency" content="USD">
      <meta property="product:availability" content="OutOfStock">
    </head>`;

    const product = extract(html);

    expect(product.price.state).toBe("conflicted");
    expect(product.availability.state).toBe("conflicted");
    expect(JSON.stringify(product.price)).toContain('"currency":"EUR"');
    expect(JSON.stringify(product.price)).toContain('"currency":"USD"');
  });

  it("merges semantically equal decimal prices without changing display value", () => {
    const html = `<head>
      <script type="application/ld+json">${JSON.stringify({
        "@type": "Product",
        url: PRODUCT_URL,
        name: "Pebble Flask",
        offers: { price: "39", priceCurrency: "EUR" },
      })}</script>
      <meta property="product:price:amount" content="39.00">
      <meta property="product:price:currency" content="EUR">
    </head>`;

    const product = extract(html);

    expect(product.price).toMatchObject({
      state: "observed",
      value: { amount: "39", currency: "EUR" },
    });
    expect(
      product.price.state === "observed" ? product.price.evidence : [],
    ).toHaveLength(2);
  });

  it("represents sparse product information as explicit unknowns", () => {
    const product = extract(
      `<main><h1>Pebble Flask</h1><p>Built for the everyday carry.</p></main>`,
    );

    expect(product.productId).toBe("product-01");
    expect(product.canonicalUrl).toMatchObject({
      state: "observed",
      value: PRODUCT_URL,
    });
    expect(product.name).toMatchObject({
      state: "observed",
      value: "Pebble Flask",
    });
    expect(product.price).toEqual({ state: "unknown" });
    expect(product.availability).toEqual({ state: "unknown" });
    expect(product.imageUrl).toEqual({ state: "unknown" });
    expect(product.description).toEqual({ state: "unknown" });
  });

  it("ignores hidden headings and executable descendants in visible names", () => {
    const product = extract(`<main>
      <section aria-hidden=" TRUE "><h1>Hidden Product</h1></section>
      <h1>Pebble <script>Injected Product</script> Flask</h1>
    </main>`);

    expect(product.name).toMatchObject({
      state: "observed",
      value: "Pebble Flask",
    });
    expect(JSON.stringify(product)).not.toContain("Hidden Product");
    expect(JSON.stringify(product)).not.toContain("Injected Product");
  });

  it("does not mine ambiguous JSON-LD product nodes", () => {
    const html = `<script type="application/ld+json">${JSON.stringify([
      {
        "@type": "Product",
        name: "First unrelated product",
        offers: { price: "10", priceCurrency: "EUR" },
      },
      {
        "@type": "Product",
        name: "Second unrelated product",
        offers: { price: "99", priceCurrency: "USD" },
      },
    ])}</script>`;

    const product = extract(html);

    expect(product.name).toEqual({ state: "unknown" });
    expect(product.price).toEqual({ state: "unknown" });
  });

  it.each([
    "https://signal-grove.example.com/products/different-flask",
    "javascript:fictional-source-command",
  ])("rejects a sole JSON-LD product with declared identity %s", (identity) => {
    const html = `<script type="application/ld+json">${JSON.stringify({
      "@type": "Product",
      url: identity,
      name: "Different Flask",
      offers: { price: 15, priceCurrency: "USD" },
    })}</script>`;

    const product = extract(html);

    expect(product.name).toEqual({ state: "unknown" });
    expect(product.price).toEqual({ state: "unknown" });
    expect(JSON.stringify(product)).not.toContain("Different Flask");
  });

  it.each([
    [
      "wide",
      JSON.stringify([
        { "@type": "Product", url: PRODUCT_URL, name: "Early Product" },
        ...Array.from({ length: 300 }, (_, index) => ({ index })),
      ]),
    ],
    [
      "deep",
      `${"[".repeat(300)}${JSON.stringify({
        "@type": "Product",
        url: PRODUCT_URL,
        name: "Deep Product",
      })}${"]".repeat(300)}`,
    ],
  ])("fails closed for %s JSON-LD traversal overflow", (_kind, json) => {
    const html = `<script type="application/ld+json">${json}</script>`;

    expect(() => extract(html)).toThrow(
      expect.objectContaining({ code: "invalid-source" }),
    );
  });

  it.each([
    [
      "an additional JSON-LD script",
      Array.from(
        { length: 33 },
        (_, index) =>
          `<script type="application/ld+json">${JSON.stringify(
            index === 0
              ? { "@type": "Product", url: PRODUCT_URL, name: "Early Product" }
              : { "@type": "Thing", name: `Thing ${index}` },
          )}</script>`,
      ).join(""),
    ],
    [
      "an oversized JSON-LD script",
      `<script type="application/ld+json">${" ".repeat(64_001)}</script>
       <script type="application/ld+json">${JSON.stringify({
         "@type": "Product",
         url: PRODUCT_URL,
         name: "Early Product",
       })}</script>`,
    ],
  ])("disables partial JSON-LD intake after %s", (_kind, scripts) => {
    const product = extract(`${scripts}<h1>Visible Fallback Product</h1>`);

    expect(product.name).toMatchObject({
      state: "observed",
      value: "Visible Fallback Product",
    });
    expect(JSON.stringify(product)).not.toContain("Early Product");
  });
});
