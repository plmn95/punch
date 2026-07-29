import type {
  Campaign,
  CampaignDraftPayload,
  CritiqueOutputPayload,
  CritiqueResult,
  GenerationContext,
  RevisionOutputPayload,
} from "../core/schemas/index.js";
import { collectProductBlockBindings } from "../core/product-bindings.js";

/** Reports caller-owned goal and structured-offer invariant failures. */
export function campaignStageIssues(
  campaign: CampaignDraftPayload,
  context: GenerationContext,
): string[] {
  const issues = productBindingIssues(campaign, context);
  if (campaign.goal !== context.goal) {
    issues.push("goal-mismatch");
  }
  if (context.goal !== "promotion") {
    return issues;
  }

  for (const block of campaign.blocks) {
    if (block.type === "discount-code") {
      issues.push(...discountCodeIssues(block, context.offer));
    }
  }
  return [...new Set(issues)];
}

/** Rejects product-bearing blocks that reference no current input product. */
function productBindingIssues(
  campaign: CampaignDraftPayload,
  context: GenerationContext,
): string[] {
  const knownIds = new Set(
    context.products.map((product) => product.productId),
  );
  return collectProductBlockBindings(campaign).some(
    (binding) => !knownIds.has(binding.productId),
  )
    ? ["unknown-product-id"]
    : [];
}

/** Reports discount-code facts that do not match the structured offer. */
function discountCodeIssues(
  block: Readonly<{ code: string; endsAt?: string | undefined }>,
  offer: Readonly<{
    code?: string | undefined;
    endsAt?: string | undefined;
  }>,
): string[] {
  const issues: string[] = [];
  if (offer.code === undefined) {
    issues.push("discount-code-without-offer-code");
  } else if (block.code !== offer.code) {
    issues.push("discount-code-mismatch");
  }
  if (block.endsAt !== undefined && block.endsAt !== offer.endsAt) {
    issues.push("discount-end-mismatch");
  }
  return issues;
}

/** Rejects critique pointers that do not identify current context objects. */
export function critiqueReferenceIssues(
  output: CritiqueOutputPayload,
  campaign: Campaign,
  context: GenerationContext,
): string[] {
  const issues: string[] = [];
  const blockIds = new Set(campaign.blocks.map((block) => block.id));
  const productIds = new Set(
    context.products.map((product) => product.productId),
  );

  if (
    output.issues.some((issue) => issue.blockId && !blockIds.has(issue.blockId))
  ) {
    issues.push("unknown-block-id");
  }
  if (
    output.issues.some(
      (issue) => issue.productId && !productIds.has(issue.productId),
    )
  ) {
    issues.push("unknown-product-id");
  }
  return issues;
}

/** Reports campaign and critique-addressing revision invariant failures. */
export function revisionStageIssues(
  revision: RevisionOutputPayload,
  critique: CritiqueResult,
  context: GenerationContext,
): string[] {
  const issues = campaignStageIssues(revision.campaign, context);
  const knownIds = new Set(critique.issues.map((issue) => issue.id));
  const addressedIds = new Set(revision.addressedIssueIds);

  if (revision.addressedIssueIds.some((id) => !knownIds.has(id))) {
    issues.push("unknown-issue-id");
  }
  if (
    critique.issues.some(
      (issue) => issue.severity === "blocking" && !addressedIds.has(issue.id),
    )
  ) {
    issues.push("unaddressed-blocking-issue");
  }
  return [...new Set(issues)];
}
