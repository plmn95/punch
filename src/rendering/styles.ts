import type { CSSProperties } from "react";

export const RESPONSIVE_CSS = `
@media only screen and (max-width: 600px) {
  .punch-mobile-row {
    width: 100% !important;
  }

  .punch-mobile-column {
    display: block !important;
    width: 100% !important;
  }

  .punch-section-cell {
    padding-left: 20px !important;
    padding-right: 20px !important;
  }

  .punch-mobile-button {
    display: block !important;
    text-align: center !important;
  }
}
`;

export const pageStyle = {
  backgroundColor: "#f4efe8",
  color: "#2f251f",
  fontFamily: 'Arial, "Helvetica Neue", Helvetica, sans-serif',
  margin: "0",
  padding: "0",
} satisfies CSSProperties;

export const outerTableStyle = {
  backgroundColor: "#f4efe8",
  borderCollapse: "collapse",
  width: "100%",
} satisfies CSSProperties;

export const containerStyle = {
  backgroundColor: "#fffdf9",
  borderCollapse: "collapse",
  maxWidth: "600px",
  width: "100%",
} satisfies CSSProperties;

export const preheaderStyle = {
  color: "transparent",
  display: "none",
  fontSize: "1px",
  lineHeight: "1px",
  maxHeight: "0",
  opacity: 0,
  overflow: "hidden",
} satisfies CSSProperties;

export const sectionCellStyle = {
  padding: "24px 40px",
} satisfies CSSProperties;

export const compactSectionCellStyle = {
  padding: "16px 40px",
} satisfies CSSProperties;

export const centeredSectionCellStyle = {
  padding: "32px 40px",
  textAlign: "center",
} satisfies CSSProperties;

export const wordmarkStyle = {
  color: "#2f251f",
  fontFamily: 'Georgia, "Times New Roman", serif',
  fontSize: "26px",
  fontWeight: 700,
  lineHeight: "32px",
  textDecoration: "none",
} satisfies CSSProperties;

export const imageStyle = {
  border: "0",
  display: "block",
  height: "auto",
  maxWidth: "100%",
  outline: "none",
  textDecoration: "none",
} satisfies CSSProperties;

export const fullWidthImageStyle = {
  ...imageStyle,
  width: "100%",
} satisfies CSSProperties;

export const eyebrowStyle = {
  color: "#9a5137",
  fontSize: "14px",
  fontWeight: 700,
  letterSpacing: "1.2px",
  lineHeight: "18px",
  margin: "0 0 10px",
  textTransform: "uppercase",
} satisfies CSSProperties;

export const heroHeadingStyle = {
  color: "#2f251f",
  fontFamily: 'Georgia, "Times New Roman", serif',
  fontSize: "38px",
  lineHeight: "44px",
  margin: "0 0 16px",
} satisfies CSSProperties;

export const headingTwoStyle = {
  color: "#2f251f",
  fontFamily: 'Georgia, "Times New Roman", serif',
  fontSize: "28px",
  lineHeight: "34px",
  margin: "0",
} satisfies CSSProperties;

export const headingThreeStyle = {
  color: "#2f251f",
  fontFamily: 'Georgia, "Times New Roman", serif',
  fontSize: "22px",
  lineHeight: "28px",
  margin: "0",
} satisfies CSSProperties;

export const bodyTextStyle = {
  color: "#5f5047",
  fontSize: "16px",
  lineHeight: "25px",
  margin: "0",
} satisfies CSSProperties;

export const productNameStyle = {
  color: "#2f251f",
  fontFamily: 'Georgia, "Times New Roman", serif',
  fontSize: "22px",
  lineHeight: "28px",
  margin: "0 0 10px",
} satisfies CSSProperties;

export const productPriceStyle = {
  color: "#2f251f",
  fontSize: "16px",
  fontWeight: 700,
  lineHeight: "22px",
  margin: "12px 0 0",
} satisfies CSSProperties;

export const cardStyle = {
  backgroundColor: "#f8f3ed",
  border: "1px solid #e4d7ca",
  borderCollapse: "separate",
  borderRadius: "12px",
  width: "100%",
} satisfies CSSProperties;

export const cardContentStyle = {
  padding: "22px",
} satisfies CSSProperties;

export const featurePanelStyle = {
  backgroundColor: "#f8f3ed",
  border: "1px solid #e4d7ca",
  borderCollapse: "separate",
  borderRadius: "12px",
  width: "100%",
} satisfies CSSProperties;

export const buttonTableStyle = {
  borderCollapse: "separate",
  margin: "20px auto 0",
} satisfies CSSProperties;

export const buttonCellStyle = {
  backgroundColor: "#9a5137",
  borderRadius: "8px",
  height: "48px",
  textAlign: "center",
} satisfies CSSProperties;

export const buttonLinkStyle = {
  color: "#ffffff",
  display: "inline-block",
  fontSize: "15px",
  fontWeight: 700,
  lineHeight: "20px",
  padding: "14px 22px",
  textDecoration: "none",
} satisfies CSSProperties;

export const discountPanelStyle = {
  backgroundColor: "#efe0d2",
  border: "1px solid #d9bba3",
  borderCollapse: "separate",
  borderRadius: "12px",
  width: "100%",
} satisfies CSSProperties;

export const discountCodeStyle = {
  backgroundColor: "#fffdf9",
  border: "1px dashed #9a5137",
  borderRadius: "6px",
  color: "#2f251f",
  display: "inline-block",
  fontSize: "20px",
  fontWeight: 700,
  letterSpacing: "2px",
  lineHeight: "26px",
  marginTop: "16px",
  padding: "10px 16px",
} satisfies CSSProperties;

export const complianceStyle = {
  borderTop: "1px solid #e4d7ca",
  color: "#74675e",
  fontSize: "12px",
  lineHeight: "18px",
  padding: "24px 40px 32px",
  textAlign: "center",
} satisfies CSSProperties;

export const complianceParagraphStyle = {
  margin: "0 0 8px",
} satisfies CSSProperties;

export const complianceLinkStyle = {
  color: "#74675e",
  textDecoration: "underline",
} satisfies CSSProperties;
