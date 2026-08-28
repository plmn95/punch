import { useRenderStyles } from "../render-style-context.js";
import type { DiscountCodeBlock } from "../../core/schemas/index.js";

import { BlockFrame } from "./shared.js";

type DiscountCodeProps = {
  readonly block: DiscountCodeBlock;
};

const OFFER_DATE_FORMATTER = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "long",
  timeZone: "UTC",
  year: "numeric",
});

/** Formats the calendar date without shifting the supplied ISO offset. */
function formatOfferDate(value: string): string {
  const calendarDate = value.slice(0, 10);
  return OFFER_DATE_FORMATTER.format(new Date(`${calendarDate}T00:00:00Z`));
}

/** Renders the explicit promotion facts inside the discount panel. */
function DiscountContent({ block }: DiscountCodeProps) {
  const { headingThreeStyle, bodyTextWithTopMarginStyle, discountCodeStyle } =
    useRenderStyles();
  return (
    <>
      {block.heading === undefined ? null : (
        <h2
          data-punch-text-role="subheading-promotion"
          style={headingThreeStyle}
        >
          {block.heading}
        </h2>
      )}
      {block.description === undefined ? null : (
        <p
          data-punch-text-role="body-promotion"
          style={bodyTextWithTopMarginStyle}
        >
          {block.description}
        </p>
      )}
      <span data-punch-text-role="discount-code" style={discountCodeStyle}>
        {block.code}
      </span>
      {block.endsAt === undefined ? null : (
        <p
          data-punch-text-role="body-promotion"
          style={bodyTextWithTopMarginStyle}
        >
          Ends{" "}
          <time dateTime={block.endsAt}>{formatOfferDate(block.endsAt)}</time>
        </p>
      )}
    </>
  );
}

/** Renders only the explicit fields carried by a promotion-code block. */
export function DiscountCode({ block }: DiscountCodeProps) {
  const { sectionCellStyle, discountPanelStyle } = useRenderStyles();
  return (
    <BlockFrame
      blockId={block.id}
      blockType={block.type}
      cellStyle={sectionCellStyle}
    >
      <table
        border={0}
        cellPadding={0}
        cellSpacing={0}
        role="presentation"
        style={discountPanelStyle}
        width="100%"
      >
        <tbody>
          <tr>
            <td style={{ padding: "28px", textAlign: "center" }}>
              <DiscountContent block={block} />
            </td>
          </tr>
        </tbody>
      </table>
    </BlockFrame>
  );
}
