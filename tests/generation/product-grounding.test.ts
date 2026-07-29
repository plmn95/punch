import { describe, expect, it } from "vitest";

import {
  GenerationContextSchema,
  type CampaignDraftPayload,
  type GenerationContext,
} from "../../src/core/schemas/index.js";
import { runGeneration } from "../../src/generation/run-generation.js";
import {
  createGroundedCampaign,
  createGroundedPresentation,
  createGroundingContext,
  mapCampaignPresentation,
} from "../support/grounding-fixtures.js";
import {
  modelResponse,
  QueuedTextModel,
} from "../support/queued-text-model.js";

/** Serialises one fictional structured provider result. */
function response(value: unknown) {
  return modelResponse(JSON.stringify(value));
}

/** Returns one campaign with product-one facts bound to product two. */
function swappedCampaign(context: GenerationContext): CampaignDraftPayload {
  const other = createGroundedPresentation(context.products[1]!);
  return mapCampaignPresentation(
    createGroundedCampaign(context),
    "product-01",
    (product) => ({
      ...product,
      name: other.name,
      price: other.price,
      description: other.description,
      image: other.image,
      cta: other.cta,
    }),
  );
}

/** Returns the model's exact stage and attempt sequence. */
function requestSequence(model: QueuedTextModel): string[] {
  return model.requests.map((request) => `${request.stage}:${request.attempt}`);
}

/** Creates one deterministic blocking product issue. */
function blockingCritique() {
  return {
    issues: [
      {
        severity: "blocking",
        code: "product-binding",
        summary: "The product hierarchy needs correction.",
        instruction: "Keep every product bound to its exact evidence.",
        productId: "product-01",
      },
    ],
  };
}

describe("generation grounding enforcement", () => {
  it("repairs a cross-product emit before critique", async () => {
    const context = createGroundingContext(2);
    const model = new QueuedTextModel([
      response(swappedCampaign(context)),
      response(createGroundedCampaign(context)),
      response({ issues: [] }),
    ]);

    const result = await runGeneration(context, { model });

    expect(result.grounding).toEqual({ valid: true, issues: [] });
    expect(requestSequence(model)).toEqual([
      "emit:primary",
      "emit:repair",
      "critique:primary",
    ]);
  });

  it("fails closed before critique when emit repair remains ungrounded", async () => {
    const context = createGroundingContext(2);
    const invalid = swappedCampaign(context);
    const model = new QueuedTextModel([
      response(invalid),
      response(invalid),
      response({ issues: [] }),
    ]);

    await expect(runGeneration(context, { model })).rejects.toMatchObject({
      code: "invalid-model-output",
    });
    expect(requestSequence(model)).toEqual(["emit:primary", "emit:repair"]);
  });

  it("repairs an ungrounded revision without a second semantic revision", async () => {
    const context = createGroundingContext(2);
    const valid = createGroundedCampaign(context);
    const model = new QueuedTextModel([
      response(valid),
      response(blockingCritique()),
      response({
        campaign: swappedCampaign(context),
        addressedIssueIds: ["issue-01"],
      }),
      response({
        campaign: valid,
        addressedIssueIds: ["issue-01"],
      }),
    ]);

    const result = await runGeneration(context, { model });

    expect(result.grounding.valid).toBe(true);
    expect(requestSequence(model)).toEqual([
      "emit:primary",
      "critique:primary",
      "revise:primary",
      "revise:repair",
    ]);
    expect(
      model.requests.filter((request) => request.stage === "critique"),
    ).toHaveLength(1);
  });

  it.each(["name", "canonicalUrl"] as const)(
    "rejects unavailable required %s evidence before any model call",
    async (field) => {
      const context = createGroundingContext(1);
      const invalid = GenerationContextSchema.parse({
        ...context,
        products: [{ ...context.products[0]!, [field]: { state: "unknown" } }],
      });
      const model = new QueuedTextModel([]);

      await expect(runGeneration(invalid, { model })).rejects.toMatchObject({
        code: "invalid-context",
      });
      expect(model.requests).toHaveLength(0);
    },
  );

  it("rejects cross-product evidence references before any model call", async () => {
    const context = createGroundingContext(2);
    const first = context.products[0]!;
    const name = first.name;
    const second = context.products[1]!;
    if (name.state !== "observed" || second.canonicalUrl.state !== "observed") {
      throw new Error("The grounding evidence must begin observed.");
    }
    const invalid = GenerationContextSchema.parse({
      ...context,
      products: [
        {
          ...first,
          name: {
            ...name,
            evidence: [
              {
                source: "product",
                productId: "product-02",
                url: second.canonicalUrl.value,
                field: "name",
              },
            ],
          },
        },
        second,
      ],
    });
    const model = new QueuedTextModel([]);

    await expect(runGeneration(invalid, { model })).rejects.toMatchObject({
      code: "invalid-context",
    });
    expect(model.requests).toHaveLength(0);
  });
});
