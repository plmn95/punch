import type {
  CampaignBlockPayload,
  CampaignDraftPayload,
  GenerationContext,
  ProductEvidence,
  ProductId,
} from "../core/schemas/index.js";
import { tokeniseSafeInlineMarkdown } from "../core/inline-markdown.js";

type UnboundProductResourceIssue = Readonly<{
  code: "unbound-product-image" | "unbound-product-url";
  productId: ProductId;
  blockIndex: number;
}>;

/** Returns observed and conflicted candidates for one URL fact. */
function criticalUrls(
  fact: ProductEvidence["canonicalUrl"],
): readonly string[] {
  if (fact.state === "observed") {
    return [fact.value];
  }
  return fact.state === "conflicted"
    ? fact.candidates.map((candidate) => candidate.value)
    : [];
}

/** Returns every exact URL known to belong to one product. */
function productResourceUrls(product: ProductEvidence): readonly string[] {
  return [
    product.suppliedUrl,
    ...criticalUrls(product.canonicalUrl),
    ...criticalUrls(product.imageUrl),
  ];
}

/** Returns URL-bearing slots from one block without product identity. */
function unboundUrls(block: CampaignBlockPayload): readonly string[] {
  if (block.type === "header-standard") {
    return [block.homeUrl];
  }
  if (block.type === "hero-stacked") {
    return block.cta ? [block.cta.href] : [];
  }
  if (block.type === "body-paragraph") {
    return tokeniseSafeInlineMarkdown(block.markdown).flatMap((token) =>
      token.kind === "link" ? [token.href] : [],
    );
  }
  return block.type === "cta-block"
    ? block.actions.map((action) => action.href)
    : [];
}

/** Returns image-bearing slots from one block without product identity. */
function unboundImages(block: CampaignBlockPayload): readonly string[] {
  if (block.type === "header-standard") {
    return block.logo ? [block.logo.url] : [];
  }
  return block.type === "hero-stacked" && block.image ? [block.image.url] : [];
}

/** Rejects exact known product resources in blocks without product identity. */
export function unboundProductResourceIssues(
  campaign: Pick<CampaignDraftPayload, "blocks">,
  context: GenerationContext,
): UnboundProductResourceIssue[] {
  const issues: UnboundProductResourceIssue[] = [];
  campaign.blocks.forEach((block, blockIndex) => {
    const urls = unboundUrls(block);
    const images = unboundImages(block);
    for (const product of context.products) {
      const resources = productResourceUrls(product);
      if (urls.some((url) => resources.includes(url))) {
        issues.push({
          code: "unbound-product-url",
          productId: product.productId,
          blockIndex,
        });
      }
      if (images.some((url) => resources.includes(url))) {
        issues.push({
          code: "unbound-product-image",
          productId: product.productId,
          blockIndex,
        });
      }
    }
  });
  return issues;
}
