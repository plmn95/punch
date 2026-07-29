import type { Campaign } from "../core/schemas/index.js";
import { MAX_HTML_BYTES } from "../rendering/render-contract.js";
import { productBindingPasses } from "./render-binding-validation.js";
import { gridGeometryPasses } from "./render-geometry-validation.js";
import {
  compliancePasses,
  resourceUrlsPass,
} from "./render-resource-validation.js";

/** Validates the bounded generated-HTML layer against one parsed campaign. */
export function validateRenderHtml(campaign: Campaign, html: string) {
  return {
    compliance: compliancePasses(campaign, html),
    gridGeometry: gridGeometryPasses(campaign, html),
    htmlBytes: new TextEncoder().encode(html).byteLength <= MAX_HTML_BYTES,
    productBinding: productBindingPasses(campaign, html),
    resourceUrls: resourceUrlsPass(html),
  } as const;
}
