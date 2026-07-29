import type { HeadingBlock } from "../../core/schemas/index.js";
import {
  headingSectionCellStyle,
  headingThreeStyle,
  headingTwoStyle,
} from "../styles.js";
import { BlockFrame } from "./shared.js";

type HeadingProps = {
  readonly block: HeadingBlock;
};

/** Renders an explicit level-two or level-three campaign heading. */
export function Heading({ block }: HeadingProps) {
  return (
    <BlockFrame
      blockId={block.id}
      blockType={block.type}
      cellStyle={headingSectionCellStyle}
    >
      {block.level === 2 ? (
        <h2 data-punch-text-role="heading" style={headingTwoStyle}>
          {block.text}
        </h2>
      ) : (
        <h3 data-punch-text-role="subheading" style={headingThreeStyle}>
          {block.text}
        </h3>
      )}
    </BlockFrame>
  );
}
