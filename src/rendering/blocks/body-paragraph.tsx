import type { BodyParagraphBlock } from "../../core/schemas/index.js";
import { renderSafeInlineMarkdown } from "../safe-inline-markdown.js";
import { bodySectionCellStyle, bodyTextStyle } from "../styles.js";
import { BlockFrame } from "./shared.js";

type BodyParagraphProps = {
  readonly block: BodyParagraphBlock;
};

/** Renders one paragraph through Punch's restricted inline Markdown path. */
export function BodyParagraph({ block }: BodyParagraphProps) {
  return (
    <BlockFrame
      blockId={block.id}
      blockType={block.type}
      cellStyle={bodySectionCellStyle}
    >
      <p data-punch-text-role="body-canvas" style={bodyTextStyle}>
        {renderSafeInlineMarkdown(block.markdown)}
      </p>
    </BlockFrame>
  );
}
