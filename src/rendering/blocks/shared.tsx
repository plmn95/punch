import { useRenderStyles } from "../render-style-context.js";
import type { CSSProperties, ReactNode } from "react";

import type {
  Cta,
  Image,
  ProductPresentation,
} from "../../core/schemas/index.js";

import {
  formatMoney,
  gridImageRole,
  renderHttpUrl,
  type RenderImageRole,
} from "../render-contract.js";
import { EMAIL_THEME } from "../render-theme.js";

type BlockFrameProps = {
  readonly blockId: string;
  readonly blockType: string;
  readonly children: ReactNode;
  readonly cellStyle: CSSProperties;
};

type EmailButtonProps = {
  readonly action: Cta;
  readonly compact?: boolean;
  readonly productId?: string;
};

type ProductImageProps = {
  readonly image: Image;
  readonly productId: string;
  readonly role: RenderImageRole;
  readonly width: number;
};

type ProductCardProps = {
  readonly columns: 2 | 3 | 4;
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

/** Renders one validated HTTP(S) action as an email-safe table button. */
export function EmailButton({
  action,
  compact = false,
  productId,
}: EmailButtonProps) {
  const {
    compactButtonTableStyle,
    buttonTableStyle,
    compactButtonLinkStyle,
    buttonLinkStyle,
    buttonCellStyle,
  } = useRenderStyles();
  const productMarker =
    productId === undefined ? undefined : { "data-punch-cta-for": productId };
  const tableStyle = compact ? compactButtonTableStyle : buttonTableStyle;
  const linkStyle = compact ? compactButtonLinkStyle : buttonLinkStyle;

  return (
    <table
      border={0}
      cellPadding={0}
      cellSpacing={0}
      role="presentation"
      style={tableStyle}
    >
      <tbody>
        <tr>
          <td height={EMAIL_THEME.geometry.ctaHeight} style={buttonCellStyle}>
            <a
              {...productMarker}
              className="punch-mobile-button"
              data-punch-cta-height={EMAIL_THEME.geometry.ctaHeight}
              data-punch-role="cta"
              data-punch-text-role="button"
              href={renderHttpUrl(action.href)}
              style={linkStyle}
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
export function ProductImage({
  image,
  productId,
  role,
  width,
}: ProductImageProps) {
  const { fullWidthImageStyle } = useRenderStyles();
  return (
    <img
      alt={image.alt}
      className="punch-mobile-image"
      data-punch-image-for={productId}
      data-punch-image-role={role}
      src={renderHttpUrl(image.url)}
      style={fullWidthImageStyle}
      width={width}
    />
  );
}

/** Renders one fixed-height desktop copy zone above a product CTA. */
function ProductCopy({
  copyHeight,
  product,
}: {
  readonly copyHeight: number;
  readonly product: ProductPresentation;
}) {
  const {
    productCopyCellStyle,
    productNameStyle,
    bodyTextStyle,
    productPriceStyle,
  } = useRenderStyles();
  return (
    <td
      className="punch-product-copy"
      height={copyHeight}
      style={productCopyCellStyle}
    >
      <h3
        data-punch-product-name-for={product.productId}
        data-punch-text-role="product-name"
        style={productNameStyle}
      >
        {product.name}
      </h3>
      {product.description === undefined ? null : (
        <p
          data-punch-product-description-for={product.productId}
          data-punch-text-role="body-card"
          style={bodyTextStyle}
        >
          {product.description}
        </p>
      )}
      {product.price === undefined ? null : (
        <p
          data-punch-product-price-for={product.productId}
          data-punch-text-role="product-price"
          style={productPriceStyle}
        >
          {formatMoney(product.price)}
        </p>
      )}
    </td>
  );
}

/** Renders the optional product-card image row. */
function ProductCardMedia({ columns, imageWidth, product }: ProductCardProps) {
  return product.image === undefined ? null : (
    <tr>
      <td>
        <ProductImage
          image={product.image}
          productId={product.productId}
          role={gridImageRole(columns)}
          width={imageWidth}
        />
      </td>
    </tr>
  );
}

/** Renders the product-card facts and fixed CTA zone. */
function ProductCardBody({
  columns,
  product,
}: Pick<ProductCardProps, "columns" | "product">) {
  const { cardContentStyle } = useRenderStyles();
  const copyHeight = EMAIL_THEME.geometry.productCopyHeight[columns];
  return (
    <tr>
      <td style={cardContentStyle}>
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
              <ProductCopy copyHeight={copyHeight} product={product} />
            </tr>
            <tr>
              <td>
                <EmailButton
                  action={product.cta}
                  compact
                  productId={product.productId}
                />
              </td>
            </tr>
          </tbody>
        </table>
      </td>
    </tr>
  );
}

/** Renders one product-grid card without inventing absent optional facts. */
export function ProductCard({
  columns,
  imageWidth,
  product,
}: ProductCardProps) {
  const { imageFreeCardStyle, cardStyle } = useRenderStyles();
  return (
    <table
      border={0}
      cellPadding={0}
      cellSpacing={0}
      className="punch-product-card"
      data-punch-image-state={
        product.image === undefined ? "image-free" : "image"
      }
      data-punch-product-id={product.productId}
      role="presentation"
      style={product.image === undefined ? imageFreeCardStyle : cardStyle}
      width="100%"
    >
      <tbody>
        <ProductCardMedia
          columns={columns}
          imageWidth={imageWidth}
          product={product}
        />
        <ProductCardBody columns={columns} product={product} />
      </tbody>
    </table>
  );
}
