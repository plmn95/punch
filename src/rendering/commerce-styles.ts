import type { CSSProperties } from "react";

import type { RenderTheme } from "./brand-theme.js";

/** Creates productNameStyle without changing shared render state. */
export const productNameStyle = (theme: RenderTheme): CSSProperties => ({
  color: theme.colours.primary,
  fontFamily: theme.fonts.display,
  fontSize: `${theme.typography.product}px`,
  fontWeight: 700,
  lineHeight: "28px",
  margin: "0 0 10px",
});

/** Creates productPriceStyle without changing shared render state. */
export const productPriceStyle = (theme: RenderTheme): CSSProperties => ({
  color: theme.colours.primary,
  fontSize: `${theme.typography.body}px`,
  fontWeight: 700,
  lineHeight: "22px",
  margin: "12px 0 0",
});

/** Creates cardStyle without changing shared render state. */
export const cardStyle = (theme: RenderTheme): CSSProperties => ({
  backgroundColor: theme.colours.card,
  border: `1px solid ${theme.colours.border}`,
  borderCollapse: "separate",
  borderRadius: "12px",
  overflow: "hidden",
  width: "100%",
});

/** Creates imageFreeCardStyle without changing shared render state. */
export const imageFreeCardStyle = (theme: RenderTheme): CSSProperties => ({
  ...cardStyle(theme),
  borderTop: `4px solid ${theme.colours.accent}`,
});

/** Creates cardContentStyle without changing shared render state. */
export const cardContentStyle = (): CSSProperties => ({
  padding: "18px",
});

/** Creates productCopyCellStyle without changing shared render state. */
export const productCopyCellStyle = (): CSSProperties => ({
  verticalAlign: "top",
});

/** Creates featurePanelStyle without changing shared render state. */
export const featurePanelStyle = (theme: RenderTheme): CSSProperties => ({
  backgroundColor: theme.colours.card,
  border: `1px solid ${theme.colours.border}`,
  borderCollapse: "separate",
  borderRadius: "12px",
  overflow: "hidden",
  width: "100%",
});

/** Creates imageFreeFeaturePanelStyle without changing shared render state. */
export const imageFreeFeaturePanelStyle = (
  theme: RenderTheme,
): CSSProperties => ({
  ...featurePanelStyle(theme),
  borderTop: `5px solid ${theme.colours.accent}`,
});

/** Creates buttonTableStyle without changing shared render state. */
export const buttonTableStyle = (): CSSProperties => ({
  borderCollapse: "separate",
  margin: "20px auto 0",
});

/** Creates buttonCellStyle without changing shared render state. */
export const buttonCellStyle = (theme: RenderTheme): CSSProperties => ({
  backgroundColor: theme.colours.accent,
  borderRadius: "8px",
  height: `${theme.geometry.ctaHeight}px`,
  textAlign: "center",
});

/** Creates buttonLinkStyle without changing shared render state. */
export const buttonLinkStyle = (theme: RenderTheme): CSSProperties => ({
  boxSizing: "border-box",
  color: theme.colours.buttonText,
  display: "inline-block",
  fontSize: `${theme.typography.button}px`,
  fontWeight: 700,
  lineHeight: `${theme.geometry.ctaLineHeight}px`,
  minHeight: `${theme.geometry.ctaHeight}px`,
  padding: `${theme.geometry.ctaVerticalPadding}px 22px`,
  textDecoration: "none",
});

/** Creates compactButtonTableStyle without changing shared render state. */
export const compactButtonTableStyle = (): CSSProperties => ({
  ...buttonTableStyle(),
  width: "100%",
});

/** Creates compactButtonLinkStyle without changing shared render state. */
export const compactButtonLinkStyle = (theme: RenderTheme): CSSProperties => ({
  ...buttonLinkStyle(theme),
  paddingLeft: "12px",
  paddingRight: "12px",
  width: "100%",
});

/** Creates discountPanelStyle without changing shared render state. */
export const discountPanelStyle = (theme: RenderTheme): CSSProperties => ({
  backgroundColor: theme.colours.promotion,
  border: `1px solid ${theme.colours.promotionBorder}`,
  borderCollapse: "separate",
  borderRadius: "12px",
  width: "100%",
});

/** Creates discountCodeStyle without changing shared render state. */
export const discountCodeStyle = (theme: RenderTheme): CSSProperties => ({
  backgroundColor: theme.colours.code,
  border: `1px dashed ${theme.colours.accent}`,
  borderRadius: "6px",
  color: theme.colours.primary,
  display: "inline-block",
  fontSize: `${theme.typography.discountCode}px`,
  fontWeight: 700,
  letterSpacing: "2px",
  lineHeight: "26px",
  marginTop: "16px",
  padding: "10px 16px",
});

/** Creates complianceStyle without changing shared render state. */
export const complianceStyle = (theme: RenderTheme): CSSProperties => ({
  borderTop: `1px solid ${theme.colours.border}`,
  color: theme.colours.compliance,
  fontSize: `${theme.typography.compliance}px`,
  lineHeight: "18px",
  padding: "24px 40px 32px",
  textAlign: "center",
});

/** Creates complianceParagraphStyle without changing shared render state. */
export const complianceParagraphStyle = (): CSSProperties => ({
  margin: "0 0 8px",
});

/** Creates complianceLinkStyle without changing shared render state. */
export const complianceLinkStyle = (theme: RenderTheme): CSSProperties => ({
  color: theme.colours.compliance,
  fontSize: `${theme.typography.compliance}px`,
  lineHeight: "18px",
  textDecoration: "underline",
});

export const commerceStyleFactories = {
  productNameStyle,
  productPriceStyle,
  cardStyle,
  imageFreeCardStyle,
  cardContentStyle,
  productCopyCellStyle,
  featurePanelStyle,
  imageFreeFeaturePanelStyle,
  buttonTableStyle,
  buttonCellStyle,
  buttonLinkStyle,
  compactButtonTableStyle,
  compactButtonLinkStyle,
  discountPanelStyle,
  discountCodeStyle,
  complianceStyle,
  complianceParagraphStyle,
  complianceLinkStyle,
};
