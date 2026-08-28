import { useRenderStyles } from "../render-style-context.js";
import type { HeaderStandardBlock } from "../../core/schemas/index.js";
import { renderHttpUrl } from "../render-contract.js";

import { BlockFrame } from "./shared.js";

type HeaderStandardProps = {
  readonly block: HeaderStandardBlock;
};

/** Renders the campaign brand header as a linked logo or text wordmark. */
export function HeaderStandard({ block }: HeaderStandardProps) {
  const { compactSectionCellStyle, wordmarkStyle, imageStyle } =
    useRenderStyles();
  return (
    <BlockFrame
      blockId={block.id}
      blockType={block.type}
      cellStyle={compactSectionCellStyle}
    >
      <a
        data-punch-text-role={
          block.logo === undefined ? "wordmark" : "image-link"
        }
        href={renderHttpUrl(block.homeUrl)}
        style={wordmarkStyle}
      >
        {block.logo === undefined ? (
          block.brandName
        ) : (
          <img
            alt={block.logo.alt}
            data-punch-image-role="logo"
            src={renderHttpUrl(block.logo.url)}
            style={imageStyle}
            width={160}
          />
        )}
      </a>
    </BlockFrame>
  );
}
