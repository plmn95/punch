import { z } from "zod";

import {
  CampaignBlockPayloadSchema,
  CampaignBlockSchema,
} from "./campaign-blocks.js";
import { CampaignGoalSchema } from "./input.js";
import { SchemaVersionSchema, ShortTextSchema } from "./primitives.js";

type CampaignSemanticShape = {
  readonly goal: z.infer<typeof CampaignGoalSchema>;
  readonly blocks: ReadonlyArray<{ readonly type: string }>;
};

/** Applies semantic rules that are independent of product binding. */
function addCampaignSemanticIssues(
  campaign: CampaignSemanticShape,
  context: z.RefinementCtx,
): void {
  const hasProductBlock = campaign.blocks.some(
    (block) =>
      block.type === "product-feature" || block.type === "product-grid",
  );

  if (!hasProductBlock) {
    context.addIssue({
      code: "custom",
      message: "Campaign must contain at least one product-bearing block",
      path: ["blocks"],
    });
  }

  campaign.blocks.forEach((block, index) => {
    if (block.type === "discount-code" && campaign.goal !== "promotion") {
      context.addIssue({
        code: "custom",
        message: "Discount-code blocks require the promotion goal",
        path: ["blocks", index],
      });
    }
  });
}

export const CampaignDraftPayloadSchema = z
  .strictObject({
    schemaVersion: SchemaVersionSchema,
    goal: CampaignGoalSchema,
    subject: ShortTextSchema,
    preheader: ShortTextSchema,
    blocks: z.array(CampaignBlockPayloadSchema).min(1).max(40),
  })
  .superRefine(addCampaignSemanticIssues);

export const CampaignSchema = z
  .strictObject({
    schemaVersion: SchemaVersionSchema,
    goal: CampaignGoalSchema,
    subject: ShortTextSchema,
    preheader: ShortTextSchema,
    blocks: z.array(CampaignBlockSchema).min(1).max(40),
  })
  .superRefine((campaign, context) => {
    addCampaignSemanticIssues(campaign, context);

    const blockIds = campaign.blocks.map((block) => block.id);
    if (new Set(blockIds).size !== blockIds.length) {
      context.addIssue({
        code: "custom",
        message: "Campaign block IDs must be unique",
        path: ["blocks"],
      });
    }

    campaign.blocks.forEach((block, index) => {
      const expectedId = `block-${String(index + 1).padStart(2, "0")}`;
      if (block.id !== expectedId) {
        context.addIssue({
          code: "custom",
          message: "Campaign block IDs must follow block order",
          path: ["blocks", index, "id"],
        });
      }
    });
  });

export type CampaignDraftPayload = z.infer<typeof CampaignDraftPayloadSchema>;
export type Campaign = z.infer<typeof CampaignSchema>;

/** Assigns deterministic block IDs and validates the normalised campaign. */
export function normaliseCampaignDraft(
  payload: CampaignDraftPayload,
): Campaign {
  const parsedPayload = CampaignDraftPayloadSchema.parse(payload);
  const campaign = {
    ...parsedPayload,
    blocks: parsedPayload.blocks.map((block, index) => ({
      ...block,
      id: `block-${String(index + 1).padStart(2, "0")}`,
    })),
  };

  return CampaignSchema.parse(campaign);
}
