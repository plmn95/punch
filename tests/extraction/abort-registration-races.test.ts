import { describe, expect, it } from "vitest";

import { readBoundedBody } from "../../src/extraction/http/bounded-body.js";
import { NodePublicAddressResolver } from "../../src/extraction/http/dns-resolver.js";
import { PublicFetchError } from "../../src/extraction/http/fetch-error.js";
import { createLinkedDeadline } from "../../src/extraction/http/session-state.js";

/** Aborts immediately before the original listener-registration call. */
function abortBeforeRegistration(controller: AbortController): void {
  const original = controller.signal.addEventListener.bind(controller.signal);
  const intercepted = ((
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions,
  ) => {
    controller.abort();
    original(type, listener, options);
  }) as AbortSignal["addEventListener"];
  Object.defineProperty(controller.signal, "addEventListener", {
    value: intercepted,
  });
}

describe("fetch abort-listener registration races", () => {
  it("cancels DNS before a query starts", async () => {
    const controller = new AbortController();
    abortBeforeRegistration(controller);

    await expect(
      new NodePublicAddressResolver().resolve(
        "fictional-shop.example.com",
        controller.signal,
      ),
    ).rejects.toMatchObject({ code: "cancelled" });
  });

  it("cancels a linked document deadline during listener registration", () => {
    const controller = new AbortController();
    abortBeforeRegistration(controller);
    const deadline = createLinkedDeadline(controller.signal, 1_000);

    expect(deadline.signal.reason).toMatchObject({ code: "cancelled" });
    deadline.dispose();
  });

  it("cancels bounded body reading before iteration starts", async () => {
    const controller = new AbortController();
    abortBeforeRegistration(controller);

    await expect(
      readBoundedBody({
        source: (async function* () {
          yield new Uint8Array([1]);
        })(),
        encoding: "identity",
        compressedLimit: 8,
        decompressedLimit: 8,
        budget: {
          consumeCompressed() {},
          consumeDecompressed() {},
        },
        signal: controller.signal,
      }),
    ).rejects.toBeInstanceOf(PublicFetchError);
  });
});
