import type { HeroStackedBlock } from "../../core/schemas/index.js";
import {
  bodyTextStyle,
  eyebrowStyle,
  heroHeadingStyle,
  heroImageStyle,
  heroSectionCellStyle,
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
      cellStyle={heroSectionCellStyle}
    >
      {block.image === undefined ? null : (
        <img
          alt={block.image.alt}
          className="punch-mobile-image"
          data-punch-image-role="hero"
          src={renderHttpUrl(block.image.url)}
          style={heroImageStyle}
          width={520}
        />
      )}
      {block.eyebrow === undefined ? null : (
        <p data-punch-text-role="eyebrow-card" style={eyebrowStyle}>
          {block.eyebrow}
        </p>
      )}
      <h1
        className="punch-hero-heading"
        data-punch-text-role="hero-heading"
        style={heroHeadingStyle}
      >
        {block.heading}
      </h1>
      {block.body === undefined ? null : (
        <p data-punch-text-role="body-card" style={bodyTextStyle}>
          {block.body}
        </p>
      )}
      {block.cta === undefined ? null : <EmailButton action={block.cta} />}
    </BlockFrame>
  );
}
