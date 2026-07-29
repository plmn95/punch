import type { Campaign } from "../core/schemas/campaign.js";
import { HttpUrlSchema } from "../core/schemas/primitives.js";

export const EMAIL_WIDTH = 600;
export const RENDER_VERSION = "email-v1";
export const COMPLIANCE_VERSION = "v1";
export const UNSUBSCRIBE_PLACEHOLDER = "{{unsubscribe_url}}";
export const PHYSICAL_ADDRESS_PLACEHOLDER = "{{physical_address}}";

const RESERVED_PLACEHOLDERS = [
  UNSUBSCRIBE_PLACEHOLDER,
  PHYSICAL_ADDRESS_PLACEHOLDER,
] as const;

/** Revalidates a renderer-bound URL at its final use site. */
export function renderHttpUrl(value: string): string {
  return HttpUrlSchema.parse(value);
}

/** Prevents semantic content from impersonating renderer-owned compliance chrome. */
export function assertNoReservedPlaceholders(campaign: Campaign): void {
  const serialisedCampaign = JSON.stringify(campaign);
  if (
    RESERVED_PLACEHOLDERS.some((placeholder) =>
      serialisedCampaign.includes(placeholder),
    )
  ) {
    throw new Error("Campaign contains a reserved renderer placeholder");
  }
}

/** Throws when an exhaustive renderer switch receives an unknown block. */
export function assertNever(value: never): never {
  void value;
  throw new Error("Unsupported campaign block type");
}
