import type { CampaignBlock } from "../core/schemas/index.js";
import { BodyParagraph } from "./blocks/body-paragraph.js";
import { ClosingCta } from "./blocks/cta-block.js";
import { DiscountCode } from "./blocks/discount-code.js";
import { HeaderStandard } from "./blocks/header-standard.js";
import { Heading } from "./blocks/heading.js";
import { HeroStacked } from "./blocks/hero-stacked.js";
import { ProductFeature } from "./blocks/product-feature.js";
import { ProductGrid } from "./blocks/product-grid.js";
import { assertNever } from "./render-contract.js";

type DispatchBlockProps = {
  readonly block: CampaignBlock;
};

/** Dispatches every allowed semantic block to one export-only render leaf. */
export function DispatchBlock({ block }: DispatchBlockProps) {
  switch (block.type) {
    case "header-standard":
      return <HeaderStandard block={block} />;
    case "hero-stacked":
      return <HeroStacked block={block} />;
    case "heading":
      return <Heading block={block} />;
    case "body-paragraph":
      return <BodyParagraph block={block} />;
    case "product-feature":
      return <ProductFeature block={block} />;
    case "product-grid":
      return <ProductGrid block={block} />;
    case "discount-code":
      return <DiscountCode block={block} />;
    case "cta-block":
      return <ClosingCta block={block} />;
    default:
      return assertNever(block);
  }
}
