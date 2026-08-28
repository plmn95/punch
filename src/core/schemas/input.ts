import { z } from "zod";
import { BrandSettingsSchema } from "../../brand/settings.js";

import {
  CodeTextSchema,
  HttpUrlSchema,
  LongTextSchema,
  ShortTextSchema,
} from "./primitives.js";

export const CampaignGoalSchema = z.enum([
  "sales",
  "product-launch",
  "promotion",
]);

export const OfferInputSchema = z.strictObject({
  description: ShortTextSchema,
  code: CodeTextSchema.optional(),
  endsAt: z.iso.datetime({ offset: true }).optional(),
});

const generateCampaignInputBase = {
  brand: BrandSettingsSchema.optional(),
  website: HttpUrlSchema,
  products: z.array(HttpUrlSchema).min(1).max(6),
  instructions: LongTextSchema.optional(),
};

const generateCampaignInputUnion = z.discriminatedUnion("goal", [
  z.strictObject({
    ...generateCampaignInputBase,
    goal: z.literal("sales"),
  }),
  z.strictObject({
    ...generateCampaignInputBase,
    goal: z.literal("product-launch"),
  }),
  z.strictObject({
    ...generateCampaignInputBase,
    goal: z.literal("promotion"),
    offer: OfferInputSchema,
  }),
]);

export const GenerateCampaignInputSchema =
  generateCampaignInputUnion.superRefine((input, context) => {
    const seen = new Set<string>();

    input.products.forEach((product, index) => {
      if (seen.has(product)) {
        context.addIssue({
          code: "custom",
          message: "Product URLs must be unique after canonicalisation",
          path: ["products", index],
        });
      }
      seen.add(product);
    });
  });

export type CampaignGoal = z.infer<typeof CampaignGoalSchema>;
export type OfferInput = z.infer<typeof OfferInputSchema>;
export type GenerateCampaignInput = z.infer<typeof GenerateCampaignInputSchema>;
