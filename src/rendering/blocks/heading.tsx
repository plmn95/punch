import type { HeadingBlock } from "../../core/schemas/index.js";
import {
  headingThreeStyle,
  headingTwoStyle,
  sectionCellStyle,
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
      cellStyle={sectionCellStyle}
    >
      {block.level === 2 ? (
        <h2 style={headingTwoStyle}>{block.text}</h2>
      ) : (
        <h3 style={headingThreeStyle}>{block.text}</h3>
      )}
    </BlockFrame>
  );
}
