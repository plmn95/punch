import { render } from "@react-email/render";

import { CampaignSchema } from "../core/schemas/campaign.js";
import { assertRenderedCampaign } from "../validation/render-validation.js";
import { EmailDocument } from "./email-document.js";
import { assertNoReservedPlaceholders } from "./render-contract.js";

/** Validates unknown campaign input and renders standalone HTML in memory. */
export async function renderCampaignHtml(input: unknown): Promise<string> {
  const campaign = CampaignSchema.parse(input);
  assertNoReservedPlaceholders(campaign);

  const html = await render(<EmailDocument campaign={campaign} />, {
    pretty: false,
  });
  assertRenderedCampaign(campaign, html);
  return html;
}
