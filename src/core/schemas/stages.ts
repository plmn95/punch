import { z } from "zod";

import { CampaignDraftPayloadSchema } from "./campaign.js";
import {
  BlockIdSchema,
  IssueIdSchema,
  LongTextSchema,
  ProductIdSchema,
  ShortTextSchema,
} from "./primitives.js";

export const CritiqueSeveritySchema = z.enum(["blocking", "advisory"]);

export const CritiqueIssueCodeSchema = z.enum([
  "structure",
  "goal-alignment",
  "brand-alignment",
  "product-coverage",
  "product-binding",
  "offer-grounding",
  "unsupported-claim",
  "clarity",
  "link-integrity",
]);

export const CritiqueIssuePayloadSchema = z.strictObject({
  severity: CritiqueSeveritySchema,
  code: CritiqueIssueCodeSchema,
  summary: ShortTextSchema,
  instruction: LongTextSchema,
  blockId: BlockIdSchema.optional(),
  productId: ProductIdSchema.optional(),
});

export const CritiqueOutputPayloadSchema = z.strictObject({
  issues: z.array(CritiqueIssuePayloadSchema).max(20),
});

export const CritiqueIssueSchema = CritiqueIssuePayloadSchema.extend({
  id: IssueIdSchema,
});

export const CritiqueResultSchema = z
  .strictObject({
    issues: z.array(CritiqueIssueSchema).max(20),
  })
  .superRefine((critique, context) => {
    critique.issues.forEach((issue, index) => {
      const expectedId = `issue-${String(index + 1).padStart(2, "0")}`;
      if (issue.id !== expectedId) {
        context.addIssue({
          code: "custom",
          message: "Critique issue IDs must follow issue order",
          path: ["issues", index, "id"],
        });
      }
    });
  });

export const RevisionOutputPayloadSchema = z
  .strictObject({
    campaign: CampaignDraftPayloadSchema,
    addressedIssueIds: z.array(IssueIdSchema).min(1).max(20),
  })
  .refine(
    (revision) =>
      new Set(revision.addressedIssueIds).size ===
      revision.addressedIssueIds.length,
    {
      message: "Addressed issue IDs must be unique",
      path: ["addressedIssueIds"],
    },
  );

export type CritiqueSeverity = z.infer<typeof CritiqueSeveritySchema>;
export type CritiqueIssueCode = z.infer<typeof CritiqueIssueCodeSchema>;
export type CritiqueIssuePayload = z.infer<typeof CritiqueIssuePayloadSchema>;
export type CritiqueOutputPayload = z.infer<typeof CritiqueOutputPayloadSchema>;
export type CritiqueIssue = z.infer<typeof CritiqueIssueSchema>;
export type CritiqueResult = z.infer<typeof CritiqueResultSchema>;
export type RevisionOutputPayload = z.infer<typeof RevisionOutputPayloadSchema>;

/** Assigns deterministic issue IDs and validates a critique result. */
export function normaliseCritiqueOutput(
  payload: CritiqueOutputPayload,
): CritiqueResult {
  const parsedPayload = CritiqueOutputPayloadSchema.parse(payload);
  const critique = {
    issues: parsedPayload.issues.map((issue, index) => ({
      ...issue,
      id: `issue-${String(index + 1).padStart(2, "0")}`,
    })),
  };

  return CritiqueResultSchema.parse(critique);
}
