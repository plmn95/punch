import { z } from "zod";

import { CampaignGoalSchema, HttpUrlSchema } from "../core/schemas/index.js";
import {
  LongTextSchema,
  ShortTextSchema,
  CodeTextSchema,
} from "../core/schemas/primitives.js";
import { flagValue, type CliFlags } from "./flags.js";
import { ask, type CliIo } from "./io.js";

/** Fills one missing flag through its canonical schema, retrying invalid answers. */
export async function promptField(
  io: CliIo,
  flags: CliFlags,
  flag: string,
  label: string,
  schema: z.ZodType<string>,
  fallback = "",
  optional = false,
): Promise<void> {
  const existing = flagValue(flags, flag);
  if (existing !== undefined) {
    schema.parse(existing);
    return;
  }
  for (;;) {
    const answer =
      (await ask(io, `${label}${fallback ? ` [${fallback}]` : ""}: `)) ||
      fallback;
    if (!answer && optional) return;
    const parsed = schema.safeParse(answer);
    if (parsed.success) {
      flags.values.set(flag, [parsed.data]);
      return;
    }
    io.stderr("That value is not valid. Please try again.\n");
  }
}

/** Collects an ordered, unique product list with explicit add/remove controls. */
export async function promptProducts(
  io: CliIo,
  flags: CliFlags,
): Promise<void> {
  const products = (flags.values.get("--product") ?? []).map((url) =>
    HttpUrlSchema.parse(url),
  );
  for (;;) {
    io.stderr(
      products.length
        ? `Products:\n${products.map((url, index) => `  ${index + 1}. ${url}`).join("\n")}\n`
        : "Add at least one product page.\n",
    );
    const answer = await ask(
      io,
      "Product URL, 'remove 1', or Enter to continue: ",
    );
    if (
      !answer &&
      products.length >= 1 &&
      products.length <= 6 &&
      new Set(products).size === products.length
    )
      break;
    const remove = /^remove ([1-6])$/u.exec(answer);
    if (remove) {
      products.splice(Number(remove[1]) - 1, 1);
      continue;
    }
    const parsed = HttpUrlSchema.safeParse(answer);
    if (
      !parsed.success ||
      products.length >= 6 ||
      products.includes(parsed.data)
    ) {
      io.stderr(
        "Use one to six unique HTTP(S) product URLs. Remove a product to correct the list.\n",
      );
      continue;
    }
    products.push(parsed.data);
  }
  flags.values.set("--product", products);
}

/** Collects the campaign safety policy and its optional human brief. */
export async function promptBrief(io: CliIo, flags: CliFlags): Promise<void> {
  io.stderr(
    "\n2. Campaign brief\n  sales: sell existing products\n  product-launch: introduce products\n  promotion: promote an explicit offer\n",
  );
  await promptField(io, flags, "--goal", "Goal", CampaignGoalSchema, "sales");
  if (flagValue(flags, "--goal") === "promotion") {
    await promptField(
      io,
      flags,
      "--offer",
      "Offer description",
      ShortTextSchema,
    );
    await promptField(
      io,
      flags,
      "--discount-code",
      "Discount code (optional)",
      CodeTextSchema,
      "",
      true,
    );
    await promptField(
      io,
      flags,
      "--offer-ends-at",
      "Expiry with timezone (optional)",
      z.iso.datetime({ offset: true }),
      "",
      true,
    );
  }
  await promptField(
    io,
    flags,
    "--instructions",
    "Campaign direction (optional)",
    LongTextSchema,
    "",
    true,
  );
}
