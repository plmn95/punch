import type { ProductFeatureBlock } from "../../core/schemas/index.js";
import {
  featurePanelStyle,
  imageFreeFeaturePanelStyle,
  productNameStyle,
  productPriceStyle,
} from "../commerce-styles.js";
import {
  bodyTextStyle,
  eyebrowStyle,
  productSectionCellStyle,
} from "../styles.js";
import { formatMoney } from "../render-contract.js";
import { BlockFrame, EmailButton, ProductImage } from "./shared.js";

type ProductFeatureProps = {
  readonly block: ProductFeatureBlock;
};

/** Renders the optional featured-product image row. */
function ProductFeatureMedia({ block }: ProductFeatureProps) {
  return block.image === undefined ? null : (
    <tr>
      <td>
        <ProductImage
          image={block.image}
          productId={block.productId}
          role="feature"
          width={520}
        />
      </td>
    </tr>
  );
}

/** Renders the featured product facts and its associated CTA. */
function ProductFeatureCopy({ block }: ProductFeatureProps) {
  return (
    <tr>
      <td style={{ padding: "28px" }}>
        {block.eyebrow === undefined ? null : (
          <p data-punch-text-role="eyebrow-card" style={eyebrowStyle}>
            {block.eyebrow}
          </p>
        )}
        <h2
          data-punch-product-name-for={block.productId}
          data-punch-text-role="product-name"
          style={productNameStyle}
        >
          {block.name}
        </h2>
        {block.description === undefined ? null : (
          <p
            data-punch-product-description-for={block.productId}
            data-punch-text-role="body-card"
            style={bodyTextStyle}
          >
            {block.description}
          </p>
        )}
        {block.price === undefined ? null : (
          <p
            data-punch-product-price-for={block.productId}
            data-punch-text-role="product-price"
            style={productPriceStyle}
          >
            {formatMoney(block.price)}
          </p>
        )}
        <EmailButton action={block.cta} productId={block.productId} />
      </td>
    </tr>
  );
}

/** Renders one complete featured-product presentation table. */
function ProductFeaturePanel({ block }: ProductFeatureProps) {
  return (
    <table
      border={0}
      cellPadding={0}
      cellSpacing={0}
      data-punch-image-state={
        block.image === undefined ? "image-free" : "image"
      }
      data-punch-product-id={block.productId}
      role="presentation"
      style={
        block.image === undefined
          ? imageFreeFeaturePanelStyle
          : featurePanelStyle
      }
      width="100%"
    >
      <tbody>
        <ProductFeatureMedia block={block} />
        <ProductFeatureCopy block={block} />
      </tbody>
    </table>
  );
}

/** Renders one featured product with an explicitly associated CTA. */
export function ProductFeature({ block }: ProductFeatureProps) {
  return (
    <BlockFrame
      blockId={block.id}
      blockType={block.type}
      cellStyle={productSectionCellStyle}
    >
      <ProductFeaturePanel block={block} />
    </BlockFrame>
  );
}
