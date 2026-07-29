import type { CtaBlock } from "../../core/schemas/index.js";
import {
  bodyTextStyle,
  centeredSectionCellStyle,
  headingTwoStyle,
} from "../styles.js";
import { BlockFrame, EmailButton } from "./shared.js";

type CtaBlockProps = {
  readonly block: CtaBlock;
};

/** Renders a closing region with one or two schema-validated actions. */
export function ClosingCta({ block }: CtaBlockProps) {
  const actionWidth = `${100 / block.actions.length}%`;

  return (
    <BlockFrame
      blockId={block.id}
      blockType={block.type}
      cellStyle={centeredSectionCellStyle}
    >
      {block.heading === undefined ? null : (
        <h2 style={headingTwoStyle}>{block.heading}</h2>
      )}
      {block.body === undefined ? null : (
        <p style={bodyTextStyle}>{block.body}</p>
      )}
      <table
        border={0}
        cellPadding={0}
        cellSpacing={0}
        role="presentation"
        style={{ borderCollapse: "collapse", width: "100%" }}
        width="100%"
      >
        <tbody>
          <tr>
            {block.actions.map((action) => (
              <td
                className="punch-mobile-column"
                key={action.href}
                style={{ padding: "0 8px", verticalAlign: "top" }}
                width={actionWidth}
              >
                <EmailButton action={action} />
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </BlockFrame>
  );
}
