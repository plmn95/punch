import { describe, expect, it } from "vitest";

import type { CampaignDraftPayload } from "../../src/core/schemas/index.js";
import { runGeneration } from "../../src/generation/run-generation.js";
import {
  createCritiquePayload,
  createGenerationContext,
  createProductEvidence,
} from "../factories.js";
import {
  modelResponse,
  QueuedTextModel,
} from "../support/queued-text-model.js";

/** Creates one fictional single-product campaign payload. */
function singleProductCampaign(
  productId: "product-01" | "product-02",
): CampaignDraftPayload {
  const product = createProductEvidence(productId === "product-01" ? 1 : 2);
  if (
    product.name.state !== "observed" ||
    product.canonicalUrl.state !== "observed"
  ) {
    throw new Error("The fictional product identity must be observed.");
  }
  return {
    schemaVersion: "0.1.0",
    goal: "sales",
    subject: "A cup for quieter mornings",
    preheader: "Meet the fictional Ember Mug.",
    blocks: [
      {
        type: "product-feature",
        productId,
        name: product.name.value,
        cta: {
          label: "View product",
          href: product.canonicalUrl.value,
        },
      },
    ],
  };
}

/** Creates one two-item grid with a selectable second identity. */
function gridCampaign(
  secondProductId: "product-02" | "product-03",
): CampaignDraftPayload {
  const first = singleProductCampaign("product-01").blocks[0];
  const second = singleProductCampaign("product-02").blocks[0];
  if (first?.type !== "product-feature" || second?.type !== "product-feature") {
    throw new Error("The fictional product blocks must be features.");
  }
  return {
    schemaVersion: "0.1.0",
    goal: "sales",
    subject: "Two cups for quieter mornings",
    preheader: "Meet two fictional cups.",
    blocks: [
      {
        type: "product-grid",
        columns: 2,
        items: [
          {
            productId: first.productId,
            name: first.name,
            cta: first.cta,
          },
          {
            productId: secondProductId,
            name: second.name,
            cta: second.cta,
          },
        ],
      },
    ],
  };
}

/** Serialises one fictional structured provider result. */
function response(value: unknown) {
  return modelResponse(JSON.stringify(value));
}

/** Creates one blocking critique without an unrelated block reference. */
function blockingCritique() {
  return {
    issues: [
      {
        severity: "blocking",
        code: "product-binding",
        summary: "The product reference must remain explicit.",
        instruction: "Preserve the exact product identity.",
        productId: "product-01",
      },
    ],
  };
}

describe("generation product referential identity", () => {
  it("repairs an emit block that references no context product", async () => {
    const model = new QueuedTextModel([
      response(singleProductCampaign("product-02")),
      response(singleProductCampaign("product-01")),
      response(createCritiquePayload()),
    ]);

    const result = await runGeneration(
      createGenerationContext({ productCount: 1 }),
      { model },
    );

    expect(result.finalCampaign.blocks[0]).toMatchObject({
      type: "product-feature",
      productId: "product-01",
    });
    expect(
      model.requests.map((request) => `${request.stage}:${request.attempt}`),
    ).toEqual(["emit:primary", "emit:repair", "critique:primary"]);
    expect(result.promptVersions).toEqual({
      emit: "punch.emit.v3",
      critique: "punch.critique.v3",
      repair: "punch.structured-repair.v1",
    });
  });

  it("repairs a grid item that references no context product", async () => {
    const model = new QueuedTextModel([
      response(gridCampaign("product-03")),
      response(gridCampaign("product-02")),
      response(createCritiquePayload()),
    ]);

    const result = await runGeneration(
      createGenerationContext({ productCount: 2 }),
      { model },
    );

    expect(result.finalCampaign.blocks[0]).toMatchObject({
      type: "product-grid",
      items: [{ productId: "product-01" }, { productId: "product-02" }],
    });
    expect(
      model.requests.map((request) => `${request.stage}:${request.attempt}`),
    ).toEqual(["emit:primary", "emit:repair", "critique:primary"]);
  });

  it("fails closed when repaired output keeps an unknown product", async () => {
    const model = new QueuedTextModel([
      response(singleProductCampaign("product-02")),
      response(singleProductCampaign("product-02")),
    ]);

    await expect(
      runGeneration(createGenerationContext({ productCount: 1 }), { model }),
    ).rejects.toMatchObject({ code: "invalid-model-output" });
    expect(
      model.requests.map((request) => `${request.stage}:${request.attempt}`),
    ).toEqual(["emit:primary", "emit:repair"]);
  });

  it("repairs an unknown product reference introduced by revision", async () => {
    const valid = singleProductCampaign("product-01");
    const model = new QueuedTextModel([
      response(valid),
      response(blockingCritique()),
      response({
        campaign: singleProductCampaign("product-02"),
        addressedIssueIds: ["issue-01"],
      }),
      response({
        campaign: valid,
        addressedIssueIds: ["issue-01"],
      }),
    ]);

    const result = await runGeneration(
      createGenerationContext({ productCount: 1 }),
      { model },
    );

    expect(result.finalCampaign.blocks[0]).toMatchObject({
      type: "product-feature",
      productId: "product-01",
    });
    expect(
      model.requests.map((request) => `${request.stage}:${request.attempt}`),
    ).toEqual([
      "emit:primary",
      "critique:primary",
      "revise:primary",
      "revise:repair",
    ]);
    expect(result.promptVersions).toEqual({
      emit: "punch.emit.v3",
      critique: "punch.critique.v3",
      revise: "punch.revise.v3",
      repair: "punch.structured-repair.v1",
    });
  });
});
