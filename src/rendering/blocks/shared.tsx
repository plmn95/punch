import type { CSSProperties, ReactNode } from "react";

import type {
  Cta,
  Image,
  Money,
  ProductPresentation,
} from "../../core/schemas/index.js";
import { renderHttpUrl } from "../render-contract.js";
import {
  bodyTextStyle,
  buttonCellStyle,
  buttonLinkStyle,
  buttonTableStyle,
  cardContentStyle,
  cardStyle,
  fullWidthImageStyle,
  productNameStyle,
  productPriceStyle,
} from "../styles.js";

type BlockFrameProps = {
  readonly blockId: string;
  readonly blockType: string;
  readonly children: ReactNode;
  readonly cellStyle: CSSProperties;
};

type EmailButtonProps = {
  readonly action: Cta;
  readonly productId?: string;
};

type ProductImageProps = {
  readonly image: Image;
  readonly productId: string;
  readonly width: number;
};

type ProductCardProps = {
  readonly imageWidth: number;
  readonly product: ProductPresentation;
};

/** Wraps one generated block in stable Punch-owned structural markers. */
export function BlockFrame({
  blockId,
  blockType,
  children,
  cellStyle,
}: BlockFrameProps) {
  return (
    <tr data-punch-block-id={blockId} data-punch-block-type={blockType}>
      <td className="punch-section-cell" style={cellStyle}>
        {children}
      </td>
    </tr>
  );
}

/** Formats semantic money without inferring locale or currency presentation. */
export function formatMoney(money: Money): string {
  return money.display ?? `${money.amount} ${money.currency}`;
}

/** Renders one validated HTTP(S) action as an email-safe table button. */
export function EmailButton({ action, productId }: EmailButtonProps) {
  const productMarker =
    productId === undefined ? undefined : { "data-punch-cta-for": productId };

  return (
    <table
      border={0}
      cellPadding={0}
      cellSpacing={0}
      role="presentation"
      style={buttonTableStyle}
    >
      <tbody>
        <tr>
          <td style={buttonCellStyle}>
            <a
              {...productMarker}
              className="punch-mobile-button"
              data-punch-role="cta"
              href={renderHttpUrl(action.href)}
              style={buttonLinkStyle}
            >
              {action.label}
            </a>
          </td>
        </tr>
      </tbody>
    </table>
  );
}

/** Renders one validated product image with explicit email dimensions. */
export function ProductImage({ image, productId, width }: ProductImageProps) {
  return (
    <img
      alt={image.alt}
      data-punch-image-for={productId}
      src={renderHttpUrl(image.url)}
      style={fullWidthImageStyle}
      width={width}
    />
  );
}

/** Renders one product-grid card without inventing absent optional facts. */
export function ProductCard({ imageWidth, product }: ProductCardProps) {
  return (
    <table
      border={0}
      cellPadding={0}
      cellSpacing={0}
      data-punch-product-id={product.productId}
      role="presentation"
      style={cardStyle}
      width="100%"
    >
      <tbody>
        {product.image === undefined ? null : (
          <tr>
            <td>
              <ProductImage
                image={product.image}
                productId={product.productId}
                width={imageWidth}
              />
            </td>
          </tr>
        )}
        <tr>
          <td style={cardContentStyle}>
            <h3 style={productNameStyle}>{product.name}</h3>
            {product.description === undefined ? null : (
              <p style={bodyTextStyle}>{product.description}</p>
            )}
            {product.price === undefined ? null : (
              <p style={productPriceStyle}>{formatMoney(product.price)}</p>
            )}
            <EmailButton action={product.cta} productId={product.productId} />
          </td>
        </tr>
      </tbody>
    </table>
  );
}
