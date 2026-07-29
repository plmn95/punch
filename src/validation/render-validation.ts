import type { Campaign } from "../core/schemas/index.js";
import { validateRenderHtml } from "./render-html-validation.js";
import { validateRenderStyles } from "./render-style-validation.js";

const RENDER_CHECK_IDS = [
  "contrast",
  "font-floor",
  "cta-height",
  "html-bytes",
  "grid-geometry",
  "compliance",
  "resource-urls",
  "product-binding",
] as const;

/** Validates every deterministic checkpoint-4 render requirement. */
export function validateRenderedCampaign(campaign: Campaign, html: string) {
  const htmlChecks = validateRenderHtml(campaign, html);
  const styleChecks = validateRenderStyles(html);
  const outcomes = {
    compliance: htmlChecks.compliance,
    contrast: styleChecks.contrast,
    "cta-height": styleChecks.ctaHeight,
    "font-floor": styleChecks.fontFloor,
    "grid-geometry": htmlChecks.gridGeometry,
    "html-bytes": htmlChecks.htmlBytes,
    "product-binding": htmlChecks.productBinding,
    "resource-urls": htmlChecks.resourceUrls,
  } as const;
  const checks = RENDER_CHECK_IDS.map((id) => ({
    id,
    passed: outcomes[id],
  }));

  return {
    checks,
    valid: checks.every((check) => check.passed),
  } as const;
}

/** Rejects rendered output without retaining campaign text or HTML in the error. */
export function assertRenderedCampaign(campaign: Campaign, html: string): void {
  const validation = validateRenderedCampaign(campaign, html);
  if (!validation.valid) {
    const failures = validation.checks
      .filter((check) => !check.passed)
      .map((check) => check.id)
      .join(", ");
    throw new Error(
      `Rendered campaign failed deterministic checks: ${failures}`,
    );
  }
}
