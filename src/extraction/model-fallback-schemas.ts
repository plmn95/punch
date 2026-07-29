import { z } from "zod";

const SegmentIdSchema = z.string().regex(/^segment-(?:0[1-9]|1[0-9]|2[0-4])$/u);

const VoiceTraitSchema = z.enum([
  "bold",
  "calm",
  "conversational",
  "direct",
  "elegant",
  "friendly",
  "minimal",
  "playful",
  "refined",
  "warm",
]);

export const BrandFallbackSchema = z.strictObject({
  voice: z
    .strictObject({
      traits: z.array(VoiceTraitSchema).min(1).max(4),
      segmentIds: z.array(SegmentIdSchema).min(1).max(3),
    })
    .optional(),
});

export type BrandFallback = z.infer<typeof BrandFallbackSchema>;
