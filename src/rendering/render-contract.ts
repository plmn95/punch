import type { Campaign } from "../core/schemas/campaign.js";
import type { Money } from "../core/schemas/primitives.js";
import { HttpUrlSchema } from "../core/schemas/primitives.js";

export const EMAIL_WIDTH = 600;
export const GRID_HORIZONTAL_PADDING = 80;
export const GRID_CARD_HORIZONTAL_CHROME = 20;
export const MAX_HTML_BYTES = 102_400;
export const MIN_CONTENT_FONT_SIZE = 14;
export const MIN_COMPLIANCE_FONT_SIZE = 12;
export const MIN_CTA_HEIGHT = 44;
export const RENDER_VERSION = "email-v1";
export const COMPLIANCE_VERSION = "v1";
export const UNSUBSCRIBE_PLACEHOLDER = "{{unsubscribe_url}}";
export const PHYSICAL_ADDRESS_PLACEHOLDER = "{{physical_address}}";

export type RenderImageRole =
  | "feature"
  | "grid-2"
  | "grid-3"
  | "grid-4"
  | "hero"
  | "logo";

const RESERVED_PLACEHOLDERS = [
  UNSUBSCRIBE_PLACEHOLDER,
  PHYSICAL_ADDRESS_PLACEHOLDER,
] as const;

/** Revalidates a renderer-bound URL at its final use site. */
export function renderHttpUrl(value: string): string {
  return HttpUrlSchema.parse(value);
}

/** Formats semantic money without inferring locale or currency presentation. */
export function formatMoney(money: Money): string {
  return money.display ?? `${money.amount} ${money.currency}`;
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

/** Returns the conservative fixed image width for one desktop grid column. */
export function gridImageWidth(columns: 2 | 3 | 4): number {
  return Math.floor(
    (EMAIL_WIDTH - GRID_HORIZONTAL_PADDING) / columns -
      GRID_CARD_HORIZONTAL_CHROME,
  );
}

/** Returns the stable image-role marker for one product grid. */
export function gridImageRole(
  columns: 2 | 3 | 4,
): Extract<RenderImageRole, `grid-${number}`> {
  return `grid-${columns}`;
}

/** Formats an email-table percentage without unstable trailing precision. */
export function emailPercentage(value: number): string {
  return `${Number(value.toFixed(4))}%`;
}

/** Returns the centred table width for one product-grid row. */
export function gridRowWidth(itemCount: number, columns: 2 | 3 | 4): string {
  return emailPercentage((itemCount / columns) * 100);
}

/** Returns the equal cell width inside one product-grid row. */
export function gridCellWidth(itemCount: number): string {
  return emailPercentage(100 / itemCount);
}
