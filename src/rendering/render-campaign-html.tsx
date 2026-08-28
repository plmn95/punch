import { render } from "@react-email/render";

import { CampaignSchema } from "../core/schemas/campaign.js";
import { assertRenderedCampaign } from "../validation/render-validation.js";
import { EmailDocument } from "./email-document.js";
import { assertNoReservedPlaceholders } from "./render-contract.js";
import { resolveBrand } from "../brand/resolve-brand.js";
import type { BrandSettings } from "../brand/settings.js";
import { BrandStyleProvider } from "./render-style-context.js";

/** Validates unknown campaign input and renders standalone HTML in memory. */
export async function renderCampaignHtml(
  input: unknown,
  brand: BrandSettings = {},
): Promise<string> {
  const campaign = CampaignSchema.parse(input);
  const resolved = resolveBrand({}, brand);
  assertNoReservedPlaceholders(campaign);

  const html = await render(
    <BrandStyleProvider settings={resolved.settings}>
      <EmailDocument campaign={campaign} />
    </BrandStyleProvider>,
    {
      pretty: false,
    },
  );
  assertRenderedCampaign(campaign, html);
  return html;
}
