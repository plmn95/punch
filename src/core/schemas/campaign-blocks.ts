import { z } from "zod";

import {
  BlockIdSchema,
  CodeTextSchema,
  CtaSchema,
  HttpUrlSchema,
  ImageSchema,
  LabelTextSchema,
  LongTextSchema,
  MoneySchema,
  ProductIdSchema,
  ShortTextSchema,
} from "./primitives.js";

/** Reports whether each product appears at most once in a single grid. */
function hasUniqueGridProducts(
  items: ReadonlyArray<{ readonly productId: string }>,
): boolean {
  const productIds = items.map((item) => item.productId);
  return new Set(productIds).size === productIds.length;
}

export const ProductPresentationSchema = z.strictObject({
  productId: ProductIdSchema,
  name: ShortTextSchema,
  description: LongTextSchema.optional(),
  price: MoneySchema.optional(),
  image: ImageSchema.optional(),
  cta: CtaSchema,
});

export const HeaderStandardBlockPayloadSchema = z.strictObject({
  type: z.literal("header-standard"),
  brandName: ShortTextSchema,
  homeUrl: HttpUrlSchema,
  logo: ImageSchema.optional(),
});

export const HeroStackedBlockPayloadSchema = z.strictObject({
  type: z.literal("hero-stacked"),
  eyebrow: LabelTextSchema.optional(),
  heading: ShortTextSchema,
  body: LongTextSchema.optional(),
  image: ImageSchema.optional(),
  cta: CtaSchema.optional(),
});

export const HeadingBlockPayloadSchema = z.strictObject({
  type: z.literal("heading"),
  level: z.union([z.literal(2), z.literal(3)]),
  text: ShortTextSchema,
});

export const BodyParagraphBlockPayloadSchema = z.strictObject({
  type: z.literal("body-paragraph"),
  markdown: LongTextSchema,
});

export const ProductFeatureBlockPayloadSchema = z.strictObject({
  type: z.literal("product-feature"),
  eyebrow: LabelTextSchema.optional(),
  productId: ProductIdSchema,
  name: ShortTextSchema,
  description: LongTextSchema.optional(),
  price: MoneySchema.optional(),
  image: ImageSchema.optional(),
  cta: CtaSchema,
});

const ProductGridBlockPayloadBaseSchema = z.strictObject({
  type: z.literal("product-grid"),
  columns: z.union([z.literal(2), z.literal(3), z.literal(4)]),
  items: z.array(ProductPresentationSchema).min(2).max(6),
});

export const ProductGridBlockPayloadSchema =
  ProductGridBlockPayloadBaseSchema.refine(
    (block) => hasUniqueGridProducts(block.items),
    {
      message: "A product may appear only once in a single grid",
      path: ["items"],
    },
  );

export const DiscountCodeBlockPayloadSchema = z.strictObject({
  type: z.literal("discount-code"),
  heading: ShortTextSchema.optional(),
  description: LongTextSchema.optional(),
  code: CodeTextSchema,
  endsAt: z.iso.datetime({ offset: true }).optional(),
});

export const CtaBlockPayloadSchema = z.strictObject({
  type: z.literal("cta-block"),
  heading: ShortTextSchema.optional(),
  body: LongTextSchema.optional(),
  actions: z.array(CtaSchema).min(1).max(2),
});

export const CampaignBlockPayloadSchema = z.discriminatedUnion("type", [
  HeaderStandardBlockPayloadSchema,
  HeroStackedBlockPayloadSchema,
  HeadingBlockPayloadSchema,
  BodyParagraphBlockPayloadSchema,
  ProductFeatureBlockPayloadSchema,
  ProductGridBlockPayloadSchema,
  DiscountCodeBlockPayloadSchema,
  CtaBlockPayloadSchema,
]);

export const HeaderStandardBlockSchema =
  HeaderStandardBlockPayloadSchema.extend({
    id: BlockIdSchema,
  });

export const HeroStackedBlockSchema = HeroStackedBlockPayloadSchema.extend({
  id: BlockIdSchema,
});

export const HeadingBlockSchema = HeadingBlockPayloadSchema.extend({
  id: BlockIdSchema,
});

export const BodyParagraphBlockSchema = BodyParagraphBlockPayloadSchema.extend({
  id: BlockIdSchema,
});

export const ProductFeatureBlockSchema =
  ProductFeatureBlockPayloadSchema.extend({
    id: BlockIdSchema,
  });

export const ProductGridBlockSchema = ProductGridBlockPayloadBaseSchema.extend({
  id: BlockIdSchema,
}).refine((block) => hasUniqueGridProducts(block.items), {
  message: "A product may appear only once in a single grid",
  path: ["items"],
});

export const DiscountCodeBlockSchema = DiscountCodeBlockPayloadSchema.extend({
  id: BlockIdSchema,
});

export const CtaBlockSchema = CtaBlockPayloadSchema.extend({
  id: BlockIdSchema,
});

export const CampaignBlockSchema = z.discriminatedUnion("type", [
  HeaderStandardBlockSchema,
  HeroStackedBlockSchema,
  HeadingBlockSchema,
  BodyParagraphBlockSchema,
  ProductFeatureBlockSchema,
  ProductGridBlockSchema,
  DiscountCodeBlockSchema,
  CtaBlockSchema,
]);

export type ProductPresentation = z.infer<typeof ProductPresentationSchema>;
export type HeaderStandardBlockPayload = z.infer<
  typeof HeaderStandardBlockPayloadSchema
>;
export type HeroStackedBlockPayload = z.infer<
  typeof HeroStackedBlockPayloadSchema
>;
export type HeadingBlockPayload = z.infer<typeof HeadingBlockPayloadSchema>;
export type BodyParagraphBlockPayload = z.infer<
  typeof BodyParagraphBlockPayloadSchema
>;
export type ProductFeatureBlockPayload = z.infer<
  typeof ProductFeatureBlockPayloadSchema
>;
export type ProductGridBlockPayload = z.infer<
  typeof ProductGridBlockPayloadSchema
>;
export type DiscountCodeBlockPayload = z.infer<
  typeof DiscountCodeBlockPayloadSchema
>;
export type CtaBlockPayload = z.infer<typeof CtaBlockPayloadSchema>;
export type CampaignBlockPayload = z.infer<typeof CampaignBlockPayloadSchema>;
export type HeaderStandardBlock = z.infer<typeof HeaderStandardBlockSchema>;
export type HeroStackedBlock = z.infer<typeof HeroStackedBlockSchema>;
export type HeadingBlock = z.infer<typeof HeadingBlockSchema>;
export type BodyParagraphBlock = z.infer<typeof BodyParagraphBlockSchema>;
export type ProductFeatureBlock = z.infer<typeof ProductFeatureBlockSchema>;
export type ProductGridBlock = z.infer<typeof ProductGridBlockSchema>;
export type DiscountCodeBlock = z.infer<typeof DiscountCodeBlockSchema>;
export type CtaBlock = z.infer<typeof CtaBlockSchema>;
export type CampaignBlock = z.infer<typeof CampaignBlockSchema>;
