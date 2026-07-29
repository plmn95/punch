import type { CSSProperties } from "react";

import { EMAIL_THEME } from "./render-theme.js";

export const productNameStyle = {
  color: EMAIL_THEME.colours.primary,
  fontFamily: EMAIL_THEME.fonts.display,
  fontSize: `${EMAIL_THEME.typography.product}px`,
  fontWeight: 700,
  lineHeight: "28px",
  margin: "0 0 10px",
} satisfies CSSProperties;

export const productPriceStyle = {
  color: EMAIL_THEME.colours.primary,
  fontSize: `${EMAIL_THEME.typography.body}px`,
  fontWeight: 700,
  lineHeight: "22px",
  margin: "12px 0 0",
} satisfies CSSProperties;

export const cardStyle = {
  backgroundColor: EMAIL_THEME.colours.card,
  border: `1px solid ${EMAIL_THEME.colours.border}`,
  borderCollapse: "separate",
  borderRadius: "12px",
  overflow: "hidden",
  width: "100%",
} satisfies CSSProperties;

export const imageFreeCardStyle = {
  ...cardStyle,
  borderTop: `4px solid ${EMAIL_THEME.colours.accent}`,
} satisfies CSSProperties;

export const cardContentStyle = {
  padding: "18px",
} satisfies CSSProperties;

export const productCopyCellStyle = {
  verticalAlign: "top",
} satisfies CSSProperties;

export const featurePanelStyle = {
  backgroundColor: EMAIL_THEME.colours.card,
  border: `1px solid ${EMAIL_THEME.colours.border}`,
  borderCollapse: "separate",
  borderRadius: "12px",
  overflow: "hidden",
  width: "100%",
} satisfies CSSProperties;

export const imageFreeFeaturePanelStyle = {
  ...featurePanelStyle,
  borderTop: `5px solid ${EMAIL_THEME.colours.accent}`,
} satisfies CSSProperties;

export const buttonTableStyle = {
  borderCollapse: "separate",
  margin: "20px auto 0",
} satisfies CSSProperties;

export const buttonCellStyle = {
  backgroundColor: EMAIL_THEME.colours.accent,
  borderRadius: "8px",
  height: `${EMAIL_THEME.geometry.ctaHeight}px`,
  textAlign: "center",
} satisfies CSSProperties;

export const buttonLinkStyle = {
  boxSizing: "border-box",
  color: EMAIL_THEME.colours.buttonText,
  display: "inline-block",
  fontSize: `${EMAIL_THEME.typography.button}px`,
  fontWeight: 700,
  lineHeight: `${EMAIL_THEME.geometry.ctaLineHeight}px`,
  minHeight: `${EMAIL_THEME.geometry.ctaHeight}px`,
  padding: `${EMAIL_THEME.geometry.ctaVerticalPadding}px 22px`,
  textDecoration: "none",
} satisfies CSSProperties;

export const compactButtonTableStyle = {
  ...buttonTableStyle,
  width: "100%",
} satisfies CSSProperties;

export const compactButtonLinkStyle = {
  ...buttonLinkStyle,
  paddingLeft: "12px",
  paddingRight: "12px",
  width: "100%",
} satisfies CSSProperties;

export const discountPanelStyle = {
  backgroundColor: EMAIL_THEME.colours.promotion,
  border: `1px solid ${EMAIL_THEME.colours.promotionBorder}`,
  borderCollapse: "separate",
  borderRadius: "12px",
  width: "100%",
} satisfies CSSProperties;

export const discountCodeStyle = {
  backgroundColor: EMAIL_THEME.colours.code,
  border: `1px dashed ${EMAIL_THEME.colours.accent}`,
  borderRadius: "6px",
  color: EMAIL_THEME.colours.primary,
  display: "inline-block",
  fontSize: `${EMAIL_THEME.typography.discountCode}px`,
  fontWeight: 700,
  letterSpacing: "2px",
  lineHeight: "26px",
  marginTop: "16px",
  padding: "10px 16px",
} satisfies CSSProperties;

export const complianceStyle = {
  borderTop: `1px solid ${EMAIL_THEME.colours.border}`,
  color: EMAIL_THEME.colours.compliance,
  fontSize: `${EMAIL_THEME.typography.compliance}px`,
  lineHeight: "18px",
  padding: "24px 40px 32px",
  textAlign: "center",
} satisfies CSSProperties;

export const complianceParagraphStyle = {
  margin: "0 0 8px",
} satisfies CSSProperties;

export const complianceLinkStyle = {
  color: EMAIL_THEME.colours.compliance,
  fontSize: `${EMAIL_THEME.typography.compliance}px`,
  lineHeight: "18px",
  textDecoration: "underline",
} satisfies CSSProperties;
