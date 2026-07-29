import type { HeroStackedBlock } from "../../core/schemas/index.js";
import {
  bodyTextStyle,
  centeredSectionCellStyle,
  eyebrowStyle,
  fullWidthImageStyle,
  heroHeadingStyle,
} from "../styles.js";
import { BlockFrame, EmailButton } from "./shared.js";
import { renderHttpUrl } from "../render-contract.js";

type HeroStackedProps = {
  readonly block: HeroStackedBlock;
};

/** Renders a vertically composed campaign introduction. */
export function HeroStacked({ block }: HeroStackedProps) {
  return (
    <BlockFrame
      blockId={block.id}
      blockType={block.type}
      cellStyle={centeredSectionCellStyle}
    >
      {block.image === undefined ? null : (
        <img
          alt={block.image.alt}
          src={renderHttpUrl(block.image.url)}
          style={fullWidthImageStyle}
          width={520}
        />
      )}
      {block.eyebrow === undefined ? null : (
        <p style={eyebrowStyle}>{block.eyebrow}</p>
      )}
      <h1 style={heroHeadingStyle}>{block.heading}</h1>
      {block.body === undefined ? null : (
        <p style={bodyTextStyle}>{block.body}</p>
      )}
      {block.cta === undefined ? null : <EmailButton action={block.cta} />}
    </BlockFrame>
  );
}
