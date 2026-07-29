import { expect, it } from "vitest";

import {
  createLinkedDeadline,
  throwIfModelAborted,
} from "../../src/providers/index.js";

it("cancels a model deadline across the listener-registration race", () => {
  const controller = new AbortController();
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

  const deadline = createLinkedDeadline(controller.signal, 1_000, "call");
  expect(() => throwIfModelAborted(deadline.signal, "emit", "primary")).toThrow(
    expect.objectContaining({ code: "cancelled" }),
  );
  deadline.dispose();
});
