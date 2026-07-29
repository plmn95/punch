import { describe, expect, it } from "vitest";

import { runGeneration } from "../../src/generation/run-generation.js";
import {
  createCampaignPayload,
  createCritiquePayload,
  createGenerationContext,
  createRevisionPayload,
} from "../factories.js";
import {
  modelResponse,
  QueuedTextModel,
} from "../support/queued-text-model.js";

/** Serialises one fictional structured provider result. */
function jsonResponse(value: unknown) {
  return modelResponse(JSON.stringify(value));
}

/** Returns the stage-attempt sequence captured by a fake model. */
function requestSequence(model: QueuedTextModel): string[] {
  return model.requests.map((request) => `${request.stage}:${request.attempt}`);
}

describe("generation orchestration", () => {
  it.each([undefined, "advisory"] as const)(
    "accepts a draft after %s critique without revision",
    async (severity) => {
      const model = new QueuedTextModel([
        jsonResponse(createCampaignPayload()),
        jsonResponse(createCritiquePayload(severity)),
      ]);

      const run = await runGeneration(createGenerationContext(), { model });

      expect(run.finalCampaign).toEqual(run.draft);
      expect(run.revisedCampaign).toBeUndefined();
      expect(run.critique.issues[0]?.severity).toBe(severity);
      expect(requestSequence(model)).toEqual([
        "emit:primary",
        "critique:primary",
      ]);
      expect(run.usage.calls).toHaveLength(2);
      expect(run.promptVersions).toEqual({
        emit: "punch.emit.v3",
        critique: "punch.critique.v3",
      });
    },
  );

  it("runs exactly one revision for blocking critique", async () => {
    const model = new QueuedTextModel([
      jsonResponse(createCampaignPayload()),
      jsonResponse(createCritiquePayload("blocking")),
      jsonResponse(createRevisionPayload()),
    ]);

    const run = await runGeneration(createGenerationContext(), { model });

    expect(run.finalCampaign.subject).toBe("Find your everyday cup");
    expect(run.revisedCampaign).toEqual(run.finalCampaign);
    expect(run.addressedIssueIds).toEqual(["issue-01"]);
    expect(requestSequence(model)).toEqual([
      "emit:primary",
      "critique:primary",
      "revise:primary",
    ]);
    expect(model.remaining).toBe(0);
  });

  it("makes one revision for multiple blocking issues", async () => {
    const firstIssue = createCritiquePayload("blocking").issues[0];
    const critique = {
      issues: [
        firstIssue,
        {
          ...firstIssue,
          code: "product-binding",
          summary: "The second fictional product needs a clearer link.",
          productId: "product-02",
        },
      ],
    };
    const revision = {
      ...createRevisionPayload(),
      addressedIssueIds: ["issue-01", "issue-02"],
    };
    const model = new QueuedTextModel([
      jsonResponse(createCampaignPayload()),
      jsonResponse(critique),
      jsonResponse(revision),
    ]);

    const run = await runGeneration(createGenerationContext(), { model });

    expect(run.critique.issues).toHaveLength(2);
    expect(run.addressedIssueIds).toEqual(["issue-01", "issue-02"]);
    expect(
      model.requests.filter((request) => request.stage === "revise"),
    ).toHaveLength(1);
    expect(
      model.requests.filter((request) => request.stage === "critique"),
    ).toHaveLength(1);
  });

  it("repairs caller-owned goal changes before continuing", async () => {
    const model = new QueuedTextModel([
      jsonResponse(createCampaignPayload("product-launch")),
      jsonResponse(createCampaignPayload("sales")),
      jsonResponse(createCritiquePayload()),
    ]);

    const run = await runGeneration(createGenerationContext(), { model });

    expect(run.finalCampaign.goal).toBe("sales");
    expect(requestSequence(model)).toEqual([
      "emit:primary",
      "emit:repair",
      "critique:primary",
    ]);
    expect(run.promptVersions.repair).toBe("punch.structured-repair.v1");
  });

  it("repairs invented or mismatched promotion codes and deadlines", async () => {
    const invalid = createCampaignPayload("promotion");
    const invalidBlocks = invalid.blocks.map((block) =>
      block.type === "discount-code"
        ? { ...block, code: "INVENTED", endsAt: "2028-01-01T00:00:00Z" }
        : block,
    );
    const model = new QueuedTextModel([
      jsonResponse({ ...invalid, blocks: invalidBlocks }),
      jsonResponse(createCampaignPayload("promotion")),
      jsonResponse(createCritiquePayload()),
    ]);

    const run = await runGeneration(
      createGenerationContext({ goal: "promotion" }),
      { model },
    );

    expect(run.finalCampaign.goal).toBe("promotion");
    expect(requestSequence(model)[1]).toBe("emit:repair");
  });

  it("rejects a discount-code block when no offer code was supplied", async () => {
    const context = createGenerationContext({ goal: "promotion" });
    if (context.goal !== "promotion") {
      throw new Error("The fictional context must be a promotion.");
    }
    const contextWithoutCode = {
      ...context,
      offer: {
        description: context.offer.description,
        ...(context.offer.endsAt ? { endsAt: context.offer.endsAt } : {}),
      },
    };
    const invalid = createCampaignPayload("promotion");
    const repaired = {
      ...invalid,
      blocks: invalid.blocks.filter((block) => block.type !== "discount-code"),
    };
    const model = new QueuedTextModel([
      jsonResponse(invalid),
      jsonResponse(repaired),
      jsonResponse(createCritiquePayload()),
    ]);

    const run = await runGeneration(contextWithoutCode, { model });

    expect(
      run.finalCampaign.blocks.some((block) => block.type === "discount-code"),
    ).toBe(false);
    expect(requestSequence(model)[1]).toBe("emit:repair");
  });

  it("repairs unknown critique references before revision decisions", async () => {
    const invalidCritique = createCritiquePayload("blocking");
    const issue = invalidCritique.issues[0];
    const model = new QueuedTextModel([
      jsonResponse(createCampaignPayload()),
      jsonResponse({
        issues: [{ ...issue, productId: "product-03" }],
      }),
      jsonResponse(createCritiquePayload()),
    ]);

    const run = await runGeneration(createGenerationContext(), { model });

    expect(run.critique.issues).toHaveLength(0);
    expect(requestSequence(model)).toEqual([
      "emit:primary",
      "critique:primary",
      "critique:repair",
    ]);
  });

  it("repairs unknown addressed IDs and requires every blocking ID", async () => {
    const invalidRevision = {
      ...createRevisionPayload(),
      addressedIssueIds: ["issue-02"],
    };
    const model = new QueuedTextModel([
      jsonResponse(createCampaignPayload()),
      jsonResponse(createCritiquePayload("blocking")),
      jsonResponse(invalidRevision),
      jsonResponse(createRevisionPayload()),
    ]);

    const run = await runGeneration(createGenerationContext(), { model });

    expect(run.addressedIssueIds).toEqual(["issue-01"]);
    expect(requestSequence(model).slice(-2)).toEqual([
      "revise:primary",
      "revise:repair",
    ]);
  });

  it.each([
    {
      name: "emit",
      responses: [modelResponse("invalid"), modelResponse("still invalid")],
      expected: ["emit:primary", "emit:repair"],
    },
    {
      name: "critique",
      responses: [
        jsonResponse(createCampaignPayload()),
        modelResponse("invalid"),
        modelResponse("still invalid"),
      ],
      expected: ["emit:primary", "critique:primary", "critique:repair"],
    },
    {
      name: "revise",
      responses: [
        jsonResponse(createCampaignPayload()),
        jsonResponse(createCritiquePayload("blocking")),
        modelResponse("invalid"),
        modelResponse("still invalid"),
      ],
      expected: [
        "emit:primary",
        "critique:primary",
        "revise:primary",
        "revise:repair",
      ],
    },
  ])(
    "fails closed after an invalid $name repair",
    async ({ responses, expected }) => {
      const model = new QueuedTextModel(responses);

      await expect(
        runGeneration(createGenerationContext(), { model }),
      ).rejects.toMatchObject({ code: "invalid-model-output" });
      expect(requestSequence(model)).toEqual(expected);
    },
  );
});
