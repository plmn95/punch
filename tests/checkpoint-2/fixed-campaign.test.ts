import { describe, expect, it } from "vitest";

import {
  CampaignDraftPayloadSchema,
  CampaignSchema,
  GenerationContextSchema,
  type Campaign,
  type ProductPresentation,
} from "../../src/core/schemas/index.js";
import { runGeneration } from "../../src/generation/run-generation.js";
import campaignFixture from "../fixtures/checkpoint-2/campaign.json" with { type: "json" };
import contextFixture from "../fixtures/checkpoint-2/context.json" with { type: "json" };
import {
  modelResponse,
  QueuedTextModel,
} from "../support/queued-text-model.js";

const EXPECTED_BLOCK_TYPES = [
  "header-standard",
  "hero-stacked",
  "heading",
  "body-paragraph",
  "product-feature",
  "product-grid",
  "discount-code",
  "cta-block",
] as const;

const context = GenerationContextSchema.parse(contextFixture);
const expectedCampaign = CampaignSchema.parse(campaignFixture);

/** Removes engine-owned IDs from the canonical campaign for the emit response. */
function createEmitPayload(campaign: Campaign) {
  return CampaignDraftPayloadSchema.parse({
    ...campaign,
    blocks: campaign.blocks.map((block) =>
      Object.fromEntries(
        Object.entries(block).filter(([property]) => property !== "id"),
      ),
    ),
  });
}

/** Collects the fixture's feature and grid presentations in campaign order. */
function collectPresentations(campaign: Campaign): ProductPresentation[] {
  const presentations: ProductPresentation[] = [];

  for (const block of campaign.blocks) {
    if (block.type === "product-feature") {
      presentations.push(block);
    }
    if (block.type === "product-grid") {
      presentations.push(...block.items);
    }
  }

  return presentations;
}

/** Builds the two deterministic model responses used by this checkpoint. */
function createFixtureModel(): QueuedTextModel {
  return new QueuedTextModel([
    modelResponse(JSON.stringify(createEmitPayload(expectedCampaign))),
    modelResponse(JSON.stringify({ issues: [] })),
  ]);
}

/** Serialises canonical campaign JSON with stable indentation and newline. */
function serialiseCampaign(campaign: Campaign): string {
  return `${JSON.stringify(campaign, null, 2)}\n`;
}

/** Mirrors the deliberate delimiter escaping used for prompt evidence text. */
function promptEvidence(value: string): string {
  return value
    .replaceAll("&", "\\u0026")
    .replaceAll("<", "\\u003c")
    .replaceAll(">", "\\u003e");
}

/** Checks that one model request receives every exact fixed evidence value. */
function expectFixtureEvidence(user: string): void {
  if (
    context.brand.name.state !== "observed" ||
    context.instructions === undefined
  ) {
    throw new Error("The fixed brand evidence must remain observed.");
  }
  expect(user).toContain(promptEvidence(context.brand.name.value));
  expect(user).toContain(promptEvidence(context.instructions));

  if (
    context.goal !== "promotion" ||
    context.offer.code === undefined ||
    context.offer.endsAt === undefined
  ) {
    throw new Error("The fixed campaign must remain a promotion.");
  }
  expect(user).toContain(promptEvidence(context.offer.description));
  expect(user).toContain(promptEvidence(context.offer.code));
  expect(user).toContain(promptEvidence(context.offer.endsAt));

  for (const product of context.products) {
    if (
      product.name.state !== "observed" ||
      product.price.state !== "observed" ||
      product.imageUrl.state !== "observed" ||
      product.canonicalUrl.state !== "observed" ||
      product.description.state !== "observed"
    ) {
      throw new Error("The fixed product evidence must remain observed.");
    }

    expect(user).toContain(promptEvidence(product.productId));
    expect(user).toContain(promptEvidence(product.name.value));
    expect(user).toContain(promptEvidence(product.price.value.amount));
    expect(user).toContain(promptEvidence(product.price.value.currency));
    expect(user).toContain(promptEvidence(product.imageUrl.value));
    expect(user).toContain(promptEvidence(product.canonicalUrl.value));
    expect(user).toContain(promptEvidence(product.description.value));
  }
}

describe("checkpoint 2 fixed campaign JSON", () => {
  it("is schema-valid and preserves every fixture product by construction", () => {
    const presentations = collectPresentations(expectedCampaign);

    expect(expectedCampaign.blocks.map((block) => block.type)).toEqual(
      EXPECTED_BLOCK_TYPES,
    );
    expect(expectedCampaign.blocks.map((block) => block.id)).toEqual(
      EXPECTED_BLOCK_TYPES.map(
        (_, index) => `block-${String(index + 1).padStart(2, "0")}`,
      ),
    );
    expect(presentations.map((item) => item.productId)).toEqual(
      context.products.map((product) => product.productId),
    );

    for (const product of context.products) {
      const presentation = presentations.find(
        (item) => item.productId === product.productId,
      );

      expect(presentation).toBeDefined();
      if (
        !presentation ||
        product.name.state !== "observed" ||
        product.price.state !== "observed" ||
        product.imageUrl.state !== "observed" ||
        product.canonicalUrl.state !== "observed" ||
        product.description.state !== "observed"
      ) {
        throw new Error("The fixed product evidence must remain observed.");
      }

      expect(presentation.name).toBe(product.name.value);
      expect(presentation.price).toEqual(product.price.value);
      expect(presentation.image?.url).toBe(product.imageUrl.value);
      expect(presentation.cta.href).toBe(product.canonicalUrl.value);
      expect(presentation.description).toBe(product.description.value);
    }

    if (context.goal !== "promotion") {
      throw new Error("The fixed campaign must remain a promotion.");
    }
    const discount = expectedCampaign.blocks.find(
      (block) => block.type === "discount-code",
    );
    expect(discount).toMatchObject({
      description: context.offer.description,
      code: context.offer.code,
      endsAt: context.offer.endsAt,
    });
  });

  it("runs the fixed context through emit and critique into exact campaign JSON", async () => {
    const model = createFixtureModel();

    const run = await runGeneration(context, { model });

    expect(run.finalCampaign).toEqual(expectedCampaign);
    expect(run.revisedCampaign).toBeUndefined();
    expect(
      model.requests.map(({ stage, attempt }) => `${stage}:${attempt}`),
    ).toEqual(["emit:primary", "critique:primary"]);
    expect(model.remaining).toBe(0);
    for (const request of model.requests) {
      expectFixtureEvidence(request.user);
    }
  });

  it("serialises deterministically and reparses as a canonical campaign", async () => {
    const first = await runGeneration(context, { model: createFixtureModel() });
    const second = await runGeneration(context, {
      model: createFixtureModel(),
    });
    const firstJson = serialiseCampaign(first.finalCampaign);
    const secondJson = serialiseCampaign(second.finalCampaign);

    expect(firstJson).toBe(secondJson);
    await expect(firstJson).toMatchFileSnapshot(
      "../fixtures/checkpoint-2/campaign.json",
    );
    expect(CampaignSchema.parse(JSON.parse(firstJson))).toEqual(
      expectedCampaign,
    );
  });
});
