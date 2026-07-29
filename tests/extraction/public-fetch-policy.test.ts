import { describe, expect, it } from "vitest";

import type { PublicFetchErrorCode } from "../../src/extraction/http/fetch-error.js";
import { isPublicAddress } from "../../src/extraction/http/public-address.js";
import {
  FakeResolver,
  FakeTransport,
  PUBLIC_V4,
  PUBLIC_V6,
  fakeResponse,
  probeBoundedConcurrency,
  probeGateRegistrationRace,
  probePinnedNodeIdleTimeout,
  testSession,
} from "./public-fetch-support.js";

const HTML = Buffer.from("<html>Fictional shop</html>");

/** Expects one stable fetch code without relying on raw failure text. */
async function expectCode(
  promise: Promise<unknown>,
  code: PublicFetchErrorCode,
): Promise<void> {
  await expect(promise).rejects.toMatchObject({ code });
}

describe("public URL and address policy", () => {
  it("returns canonical bounded HTML and explicit response metadata", async () => {
    const context = testSession({});
    try {
      const result = await context.session.fetchHtml(
        "https://shop.example.com/catalogue?view=all#ignored",
      );
      expect(result).toMatchObject({
        requestedUrl: "https://shop.example.com/catalogue?view=all",
        finalUrl: "https://shop.example.com/catalogue?view=all",
        mediaType: "text/html",
        charset: "utf-8",
        compressedBytes: HTML.byteLength,
        decompressedBytes: HTML.byteLength,
        redirectCount: 0,
      });
      expect(new TextDecoder().decode(result.body)).toBe(HTML.toString());
      expect(context.transport.requests[0]?.pinned.address).toBe(PUBLIC_V4);
    } finally {
      context.session.dispose();
    }
  });

  it.each([
    "file:///private/fixture",
    "ftp://shop.example.com/catalogue",
    "data:text/html,hello",
    "https://user:secret@shop.example.com/catalogue",
    "https://localhost/catalogue",
    "https://shop.local/catalogue",
    "https://shop.example/catalogue",
    "https://singlelabel/catalogue",
    "https://shop.example.com./catalogue",
  ])("rejects a non-public URL form without transport: %s", async (url) => {
    const context = testSession({});
    try {
      await expectCode(context.session.fetchHtml(url), "invalid-url");
      expect(context.transport.requests).toHaveLength(0);
    } finally {
      context.session.dispose();
    }
  });

  it.each([
    "http://2130706433/",
    "http://0x7f000001/",
    "http://0177.0.0.1/",
    "http://127.0.0.1/",
    "http://[::1]/",
    "http://[::ffff:127.0.0.1]/",
  ])("rejects canonical and alternate loopback literals: %s", async (url) => {
    const context = testSession({});
    try {
      await expectCode(context.session.fetchHtml(url), "blocked-address");
      expect(context.resolver.calls).toHaveLength(0);
      expect(context.transport.requests).toHaveLength(0);
    } finally {
      context.session.dispose();
    }
  });

  it.each([
    "0.0.0.0",
    "10.2.3.4",
    "100.64.0.1",
    "169.254.1.1",
    "172.31.4.5",
    "192.168.1.2",
    "198.18.0.1",
    "203.0.113.9",
    "224.0.0.1",
    "::",
    "::1",
    "fc00::1",
    "fe80::1",
    "2001:db8::1",
    "2002:0808:0808::1",
    "3ffe::1",
    "ff02::1",
  ])("classifies a special-use address as non-public: %s", (address) => {
    expect(isPublicAddress(address)).toBe(false);
  });

  it("accepts public unicast addresses but rejects mixed DNS", async () => {
    expect(isPublicAddress(PUBLIC_V4)).toBe(true);
    expect(isPublicAddress(PUBLIC_V6)).toBe(true);
    const resolver = new FakeResolver(() => [
      { address: PUBLIC_V4, family: 4 },
      { address: "127.0.0.1", family: 4 },
    ]);
    const context = testSession({ resolver });
    try {
      await expectCode(
        context.session.fetchHtml("https://shop.example.com"),
        "blocked-address",
      );
      expect(context.transport.requests).toHaveLength(0);
    } finally {
      context.session.dispose();
    }
  });

  it("pins deterministically and rejects a mismatched connected peer", async () => {
    const resolver = new FakeResolver(() => [
      { address: PUBLIC_V6, family: 6 },
      { address: PUBLIC_V4, family: 4 },
    ]);
    const transport = new FakeTransport((input) =>
      fakeResponse({ peerAddress: input.pinned.address }),
    );
    const success = testSession({ resolver, transport });
    try {
      await success.session.fetchHtml("https://shop.example.com");
      expect(transport.requests[0]?.pinned.address).toBe(PUBLIC_V4);
    } finally {
      success.session.dispose();
    }
    const mismatch = testSession({
      transport: new FakeTransport(() =>
        fakeResponse({ peerAddress: "1.1.1.1" }),
      ),
    });
    try {
      await expectCode(
        mismatch.session.fetchHtml("https://shop.example.com"),
        "peer-mismatch",
      );
    } finally {
      mismatch.session.dispose();
    }
  });
});

describe("redirect and exact-origin policy", () => {
  it("closes the request-gate abort-registration race", async () => {
    expect(await probeGateRegistrationRace()).toBe("cancelled");
  });

  it("bounds concurrent requests and aborts an idle response", async () => {
    expect(await probeBoundedConcurrency()).toBe(2);
    expect(await probePinnedNodeIdleTimeout()).toBe("timeout");
  });

  it("re-resolves redirects, destroys each response, and returns the final URL", async () => {
    let destroyed = 0;
    const transport = new FakeTransport((input) =>
      input.url.pathname === "/start"
        ? fakeResponse({
            statusCode: 302,
            headers: [["Location", "/final"]],
            peerAddress: input.pinned.address,
            onDestroy: () => {
              destroyed += 1;
            },
          })
        : fakeResponse({
            peerAddress: input.pinned.address,
            onDestroy: () => {
              destroyed += 1;
            },
          }),
    );
    const context = testSession({ transport });
    try {
      const result = await context.session.fetchHtml(
        "https://shop.example.com/start",
      );
      expect(result.finalUrl).toBe("https://shop.example.com/final");
      expect(result.redirectCount).toBe(1);
      expect(context.resolver.calls).toEqual([
        "shop.example.com",
        "shop.example.com",
      ]);
      expect(destroyed).toBe(2);
    } finally {
      context.session.dispose();
    }
  });

  it("blocks a redirect when repeated DNS changes from public to private", async () => {
    let resolutions = 0;
    const resolver = new FakeResolver(() => {
      resolutions += 1;
      return [
        resolutions === 1
          ? { address: PUBLIC_V4, family: 4 as const }
          : { address: "127.0.0.1", family: 4 as const },
      ];
    });
    const transport = new FakeTransport((input) =>
      fakeResponse({
        statusCode: 302,
        headers: [["Location", "/private-after-rebind"]],
        peerAddress: input.pinned.address,
      }),
    );
    const context = testSession({ resolver, transport });
    try {
      await expectCode(
        context.session.fetchHtml("https://shop.example.com/start"),
        "blocked-address",
      );
      expect(resolutions).toBe(2);
      expect(transport.requests).toHaveLength(1);
    } finally {
      context.session.dispose();
    }
  });

  it.each([
    ["https://shop.example.com/start", "http://shop.example.com/final"],
    ["https://shop.example.com/start", "file:///private/final"],
    ["https://shop.example.com/start", "https://user:pass@shop.example.com/"],
    ["https://shop.example.com/start", "/start"],
  ])("rejects an unsafe redirect from %s", async (start, location) => {
    const context = testSession({
      transport: new FakeTransport((input) =>
        fakeResponse({
          statusCode: 302,
          headers: [["Location", location]],
          peerAddress: input.pinned.address,
        }),
      ),
    });
    try {
      await expectCode(context.session.fetchHtml(start), "redirect-policy");
    } finally {
      context.session.dispose();
    }
  });

  it("enforces the exact final website origin before and during CSS redirects", async () => {
    const context = testSession({});
    try {
      await expectCode(
        context.session.fetchStylesheet(
          "https://assets.example.com/site.css",
          "https://shop.example.com/final",
        ),
        "redirect-policy",
      );
      expect(context.transport.requests).toHaveLength(0);
    } finally {
      context.session.dispose();
    }
    const redirected = testSession({
      transport: new FakeTransport((input) =>
        fakeResponse({
          statusCode: 302,
          headers: [["Location", "https://assets.example.com/site.css"]],
          peerAddress: input.pinned.address,
        }),
      ),
    });
    try {
      await expectCode(
        redirected.session.fetchStylesheet(
          "https://shop.example.com/site.css",
          "https://shop.example.com:443/final",
        ),
        "redirect-policy",
      );
    } finally {
      redirected.session.dispose();
    }
  });
});
