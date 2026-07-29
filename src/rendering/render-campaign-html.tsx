import { render } from "@react-email/render";

import { CampaignSchema } from "../core/schemas/campaign.js";
import { EmailDocument } from "./email-document.js";
import { assertNoReservedPlaceholders } from "./render-contract.js";

/** Validates unknown campaign input and renders standalone HTML in memory. */
export async function renderCampaignHtml(input: unknown): Promise<string> {
  const campaign = CampaignSchema.parse(input);
  assertNoReservedPlaceholders(campaign);

  return render(<EmailDocument campaign={campaign} />, {
    pretty: false,
  });
}
