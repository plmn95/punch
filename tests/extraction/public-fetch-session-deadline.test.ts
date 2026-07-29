import { describe, it } from "vitest";

import {
  FakeTransport,
  expectFetchCode,
  rejectOnAbort,
  testSession,
} from "./public-fetch-support.js";

describe("public-fetch session deadline", () => {
  it("distinguishes the total session deadline from a document timeout", async () => {
    const context = testSession({
      limits: {
        sessionTimeoutMs: 20,
        documentTimeoutMs: 200,
      },
      transport: new FakeTransport((input) => rejectOnAbort(input.signal)),
    });

    try {
      await expectFetchCode(
        context.session.fetchHtml("https://shop.example.com"),
        "session-timeout",
      );
    } finally {
      context.session.dispose();
    }
  });
});
