import type { ProductFeatureBlock } from "../../core/schemas/index.js";
import {
  bodyTextStyle,
  eyebrowStyle,
  featurePanelStyle,
  productNameStyle,
  productPriceStyle,
  sectionCellStyle,
} from "../styles.js";
import {
  BlockFrame,
  EmailButton,
  formatMoney,
  ProductImage,
} from "./shared.js";

type ProductFeatureProps = {
  readonly block: ProductFeatureBlock;
};

/** Renders one featured product with an explicitly associated CTA. */
export function ProductFeature({ block }: ProductFeatureProps) {
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
        data-punch-product-id={block.productId}
        role="presentation"
        style={featurePanelStyle}
        width="100%"
      >
        <tbody>
          {block.image === undefined ? null : (
            <tr>
              <td>
                <ProductImage
                  image={block.image}
                  productId={block.productId}
                  width={520}
                />
              </td>
            </tr>
          )}
          <tr>
            <td style={{ padding: "28px" }}>
              {block.eyebrow === undefined ? null : (
                <p style={eyebrowStyle}>{block.eyebrow}</p>
              )}
              <h2 style={productNameStyle}>{block.name}</h2>
              {block.description === undefined ? null : (
                <p style={bodyTextStyle}>{block.description}</p>
              )}
              {block.price === undefined ? null : (
                <p style={productPriceStyle}>{formatMoney(block.price)}</p>
              )}
              <EmailButton action={block.cta} productId={block.productId} />
            </td>
          </tr>
        </tbody>
      </table>
    </BlockFrame>
  );
}
