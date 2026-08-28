import { useRenderStyles } from "../render-style-context.js";
import type { CtaBlock } from "../../core/schemas/index.js";

import { BlockFrame, EmailButton } from "./shared.js";

type CtaBlockProps = {
  readonly block: CtaBlock;
};

/** Renders the optional copy above the closing actions. */
function ClosingCopy({ block }: CtaBlockProps) {
  const { headingTwoStyle, bodyTextWithTopMarginStyle } = useRenderStyles();
  return (
    <>
      {block.heading === undefined ? null : (
        <h2 data-punch-text-role="heading" style={headingTwoStyle}>
          {block.heading}
        </h2>
      )}
      {block.body === undefined ? null : (
        <p
          data-punch-text-role="body-canvas"
          style={bodyTextWithTopMarginStyle}
        >
          {block.body}
        </p>
      )}
    </>
  );
}

/** Renders a closing region with one or two schema-validated actions. */
export function ClosingCta({ block }: CtaBlockProps) {
  const { centeredSectionCellStyle } = useRenderStyles();
  const actionWidth = `${100 / block.actions.length}%`;
  return (
    <BlockFrame
      blockId={block.id}
      blockType={block.type}
      cellStyle={centeredSectionCellStyle}
    >
      <ClosingCopy block={block} />
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
