import type { DiscountCodeBlock } from "../../core/schemas/index.js";
import {
  bodyTextStyle,
  discountCodeStyle,
  discountPanelStyle,
  headingThreeStyle,
  sectionCellStyle,
} from "../styles.js";
import { BlockFrame } from "./shared.js";

type DiscountCodeProps = {
  readonly block: DiscountCodeBlock;
};

/** Renders only the explicit fields carried by a promotion-code block. */
export function DiscountCode({ block }: DiscountCodeProps) {
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
              {block.heading === undefined ? null : (
                <h2 style={headingThreeStyle}>{block.heading}</h2>
              )}
              {block.description === undefined ? null : (
                <p style={bodyTextStyle}>{block.description}</p>
              )}
              <span style={discountCodeStyle}>{block.code}</span>
              {block.endsAt === undefined ? null : (
                <p style={bodyTextStyle}>
                  Offer ends <time dateTime={block.endsAt}>{block.endsAt}</time>
                </p>
              )}
            </td>
          </tr>
        </tbody>
      </table>
    </BlockFrame>
  );
}
