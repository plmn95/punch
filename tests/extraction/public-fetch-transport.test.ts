import { brotliCompressSync, deflateSync, gzipSync } from "node:zlib";

import { describe, expect, it } from "vitest";

import {
  FakeTransport,
  expectFetchCode as expectCode,
  fakeResponse,
  probePinnedNodeTransport,
  rejectOnAbort,
  testSession,
} from "./public-fetch-support.js";

const HTML = Buffer.from("<html>Fictional shop</html>");

describe("response and byte policy", () => {
  it.each([
    ["text/plain", "html"],
    ["application/json", "html"],
    ["text/html", "stylesheet"],
  ] as const)("rejects %s for a %s resource", async (mediaType, kind) => {
    const context = testSession({
      transport: new FakeTransport((input) =>
        fakeResponse({
          headers: [["Content-Type", mediaType]],
          peerAddress: input.pinned.address,
        }),
      ),
    });
    try {
      const request =
        kind === "html"
          ? context.session.fetchHtml("https://shop.example.com")
          : context.session.fetchStylesheet(
              "https://shop.example.com/site.css",
              "https://shop.example.com",
            );
      await expectCode(request, "mime");
    } finally {
      context.session.dispose();
    }
  });

  it.each([
    [
      ["Content-Type", "text/html"],
      ["Content-Type", "text/html"],
    ],
    [
      ["Content-Type", "text/html"],
      ["Content-Length", "1"],
      ["Transfer-Encoding", "chunked"],
    ],
    [
      ["Content-Type", "text/html"],
      ["Content-Length", "999"],
    ],
  ] as const)(
    "rejects duplicated, contradictory, or oversized headers",
    async (...headers) => {
      const context = testSession({
        transport: new FakeTransport((input) =>
          fakeResponse({ headers, peerAddress: input.pinned.address }),
        ),
      });
      try {
        const expected =
          headers.some(([name]) => name === "Transfer-Encoding") ||
          headers.filter(([name]) => name === "Content-Type").length > 1
            ? "headers"
            : "response-too-large";
        await expectCode(
          context.session.fetchHtml("https://shop.example.com"),
          expected,
        );
      } finally {
        context.session.dispose();
      }
    },
  );

  it.each([
    ["gzip", gzipSync],
    ["br", brotliCompressSync],
    ["deflate", deflateSync],
  ] as const)("decodes one bounded %s layer", async (encoding, compress) => {
    const compressed = compress(HTML);
    const context = testSession({
      transport: new FakeTransport((input) =>
        fakeResponse({
          headers: [
            ["Content-Type", "text/html; charset=utf-8"],
            ["Content-Encoding", encoding],
          ],
          body: compressed,
          peerAddress: input.pinned.address,
        }),
      ),
    });
    try {
      const result = await context.session.fetchHtml(
        "https://shop.example.com",
      );
      expect(Buffer.from(result.body)).toEqual(HTML);
      expect(result.compressedBytes).toBe(compressed.byteLength);
      expect(result.decompressedBytes).toBe(HTML.byteLength);
    } finally {
      context.session.dispose();
    }
  });

  it("rejects unsupported encoding, raw excess, and a decompression bomb", async () => {
    const unsupported = testSession({
      transport: new FakeTransport((input) =>
        fakeResponse({
          headers: [
            ["Content-Type", "text/html"],
            ["Content-Encoding", "gzip, br"],
          ],
          peerAddress: input.pinned.address,
        }),
      ),
    });
    try {
      await expectCode(
        unsupported.session.fetchHtml("https://shop.example.com"),
        "encoding",
      );
    } finally {
      unsupported.session.dispose();
    }
    const raw = testSession({
      transport: new FakeTransport((input) =>
        fakeResponse({
          body: Buffer.alloc(257),
          peerAddress: input.pinned.address,
        }),
      ),
    });
    try {
      await expectCode(
        raw.session.fetchHtml("https://shop.example.com"),
        "response-too-large",
      );
    } finally {
      raw.session.dispose();
    }
    const bomb = testSession({
      limits: { htmlDecompressedBytes: 64 },
      transport: new FakeTransport((input) =>
        fakeResponse({
          headers: [
            ["Content-Type", "text/html"],
            ["Content-Encoding", "gzip"],
          ],
          body: gzipSync(Buffer.alloc(200, "x")),
          peerAddress: input.pinned.address,
        }),
      ),
    });
    try {
      await expectCode(
        bomb.session.fetchHtml("https://shop.example.com"),
        "response-too-large",
      );
    } finally {
      bomb.session.dispose();
    }
  });

  it("enforces aggregate bytes and document count across a session", async () => {
    const aggregate = testSession({
      limits: {
        aggregateCompressedBytes: 40,
        aggregateDecompressedBytes: 100,
      },
      transport: new FakeTransport((input) =>
        fakeResponse({
          body: Buffer.alloc(25, "a"),
          peerAddress: input.pinned.address,
        }),
      ),
    });
    try {
      await aggregate.session.fetchHtml("https://shop.example.com/one");
      await expectCode(
        aggregate.session.fetchHtml("https://shop.example.com/two"),
        "aggregate-limit",
      );
    } finally {
      aggregate.session.dispose();
    }
    const documents = testSession({ limits: { maxDocuments: 1 } });
    try {
      await documents.session.fetchHtml("https://shop.example.com/one");
      await expectCode(
        documents.session.fetchHtml("https://shop.example.com/two"),
        "document-limit",
      );
    } finally {
      documents.session.dispose();
    }
  });
});

describe("deadline, cancellation, and transport cleanup", () => {
  it("maps a document deadline and caller cancellation to fixed codes", async () => {
    const timeout = testSession({
      limits: { documentTimeoutMs: 20 },
      transport: new FakeTransport((input) => rejectOnAbort(input.signal)),
    });
    try {
      await expectCode(
        timeout.session.fetchHtml("https://shop.example.com"),
        "timeout",
      );
    } finally {
      timeout.session.dispose();
    }
    const controller = new AbortController();
    const cancelled = testSession({
      signal: controller.signal,
      transport: new FakeTransport((input) => rejectOnAbort(input.signal)),
    });
    const pending = cancelled.session.fetchHtml("https://shop.example.com");
    controller.abort("fictional-secret-canary");
    await expectCode(pending, "cancelled");
    cancelled.session.dispose();
  });

  it("dispose cancels work and post-response stream failure destroys the response", async () => {
    const pendingContext = testSession({
      transport: new FakeTransport((input) => rejectOnAbort(input.signal)),
    });
    const pending = pendingContext.session.fetchHtml(
      "https://shop.example.com",
    );
    pendingContext.session.dispose();
    await expectCode(pending, "cancelled");
    let destroyed = 0;
    const broken = testSession({
      transport: new FakeTransport((input) =>
        fakeResponse({
          source: (async function* () {
            yield Buffer.from("partial");
            throw new Error("fictional raw stream detail");
          })(),
          peerAddress: input.pinned.address,
          onDestroy: () => {
            destroyed += 1;
          },
        }),
      ),
    });
    try {
      await expectCode(
        broken.session.fetchHtml("https://shop.example.com"),
        "network",
      );
      expect(destroyed).toBe(1);
    } finally {
      broken.session.dispose();
    }
  });

  it("uses a pinned low-level Node request with fixed credential-free headers", async () => {
    const seenHeaders = await probePinnedNodeTransport();
    expect(seenHeaders).toMatchObject({
      host: expect.stringMatching(/^shop\.example\.com:\d+$/u),
      accept: "text/html",
      "accept-encoding": "gzip, br, deflate",
      connection: "close",
    });
    expect(seenHeaders).not.toHaveProperty("cookie");
    expect(seenHeaders).not.toHaveProperty("authorization");
    expect(seenHeaders).not.toHaveProperty("proxy-authorization");
  });

  it("never places raw failure canaries in its safe error message", async () => {
    const context = testSession({
      transport: new FakeTransport(() => {
        throw new Error("fictional-secret-canary@example.com");
      }),
    });
    try {
      await expect(
        context.session.fetchHtml(
          "https://shop.example.com/?token=fictional-secret-canary",
        ),
      ).rejects.toMatchObject({
        code: "network",
        message: "The resource request failed.",
      });
    } finally {
      context.session.dispose();
    }
  });
});
