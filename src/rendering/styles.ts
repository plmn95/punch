import type { CSSProperties } from "react";

import { EMAIL_THEME } from "./render-theme.js";

export const RESPONSIVE_CSS = `
body, table, td, a {
  -webkit-text-size-adjust: 100%;
  -ms-text-size-adjust: 100%;
}

@media only screen and (max-width: 600px) {
  .punch-shell-cell {
    padding: 0 !important;
  }

  .punch-email-container {
    border-radius: 0 !important;
  }

  .punch-mobile-row {
    width: 100% !important;
  }

  .punch-mobile-column {
    box-sizing: border-box !important;
    display: block !important;
    padding-left: 0 !important;
    padding-right: 0 !important;
    width: 100% !important;
  }

  .punch-section-cell {
    padding-left: 20px !important;
    padding-right: 20px !important;
  }

  .punch-hero-heading {
    font-size: 32px !important;
    line-height: 38px !important;
  }

  .punch-product-copy {
    height: auto !important;
  }

  .punch-mobile-button {
    display: block !important;
    text-align: center !important;
  }
}
`;

export const pageStyle = {
  WebkitTextSizeAdjust: "100%",
  backgroundColor: EMAIL_THEME.colours.page,
  color: EMAIL_THEME.colours.primary,
  fontFamily: EMAIL_THEME.fonts.body,
  margin: "0",
  padding: "0",
  textSizeAdjust: "100%",
} satisfies CSSProperties;

export const outerTableStyle = {
  backgroundColor: EMAIL_THEME.colours.page,
  borderCollapse: "collapse",
  width: "100%",
} satisfies CSSProperties;

export const shellCellStyle = {
  padding: "32px 16px",
} satisfies CSSProperties;

export const containerStyle = {
  backgroundColor: EMAIL_THEME.colours.canvas,
  border: `1px solid ${EMAIL_THEME.colours.border}`,
  borderCollapse: "separate",
  borderRadius: "14px",
  boxShadow: "0 12px 32px rgba(47, 37, 31, 0.08)",
  maxWidth: "600px",
  overflow: "hidden",
  width: "100%",
} satisfies CSSProperties;

export const preheaderStyle = {
  color: "transparent",
  display: "none",
  fontSize: "1px",
  lineHeight: "1px",
  maxHeight: "0",
  maxWidth: "0",
  opacity: 0,
  overflow: "hidden",
} satisfies CSSProperties;

export const sectionCellStyle = {
  padding: "24px 40px",
} satisfies CSSProperties;

export const compactSectionCellStyle = {
  padding: "24px 40px",
  textAlign: "center",
} satisfies CSSProperties;

export const centeredSectionCellStyle = {
  padding: "36px 40px 40px",
  textAlign: "center",
} satisfies CSSProperties;

export const heroSectionCellStyle = {
  backgroundColor: EMAIL_THEME.colours.card,
  padding: "44px 40px",
  textAlign: "center",
} satisfies CSSProperties;

export const headingSectionCellStyle = {
  padding: "32px 40px 8px",
} satisfies CSSProperties;

export const bodySectionCellStyle = {
  padding: "0 40px 24px",
} satisfies CSSProperties;

export const productSectionCellStyle = {
  padding: "16px 40px 24px",
} satisfies CSSProperties;

export const wordmarkStyle = {
  color: EMAIL_THEME.colours.primary,
  fontFamily: EMAIL_THEME.fonts.display,
  fontSize: `${EMAIL_THEME.typography.wordmark}px`,
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

export const heroImageStyle = {
  ...fullWidthImageStyle,
  borderRadius: "10px",
  marginBottom: "26px",
} satisfies CSSProperties;

export const eyebrowStyle = {
  color: EMAIL_THEME.colours.accent,
  fontSize: `${EMAIL_THEME.typography.eyebrow}px`,
  fontWeight: 700,
  letterSpacing: "1.2px",
  lineHeight: "18px",
  margin: "0 0 10px",
  textTransform: "uppercase",
} satisfies CSSProperties;

export const heroHeadingStyle = {
  color: EMAIL_THEME.colours.primary,
  fontFamily: EMAIL_THEME.fonts.display,
  fontSize: `${EMAIL_THEME.typography.hero}px`,
  fontWeight: 700,
  lineHeight: "44px",
  margin: "0 0 16px",
} satisfies CSSProperties;

export const headingTwoStyle = {
  color: EMAIL_THEME.colours.primary,
  fontFamily: EMAIL_THEME.fonts.display,
  fontSize: `${EMAIL_THEME.typography.heading}px`,
  fontWeight: 700,
  lineHeight: "34px",
  margin: "0",
} satisfies CSSProperties;

export const headingThreeStyle = {
  color: EMAIL_THEME.colours.primary,
  fontFamily: EMAIL_THEME.fonts.display,
  fontSize: `${EMAIL_THEME.typography.subheading}px`,
  fontWeight: 700,
  lineHeight: "28px",
  margin: "0",
} satisfies CSSProperties;

export const bodyTextStyle = {
  color: EMAIL_THEME.colours.body,
  fontSize: `${EMAIL_THEME.typography.body}px`,
  lineHeight: "25px",
  margin: "0",
} satisfies CSSProperties;

export const bodyTextWithTopMarginStyle = {
  ...bodyTextStyle,
  margin: "12px 0 0",
} satisfies CSSProperties;

export const inlineLinkStyle = {
  color: EMAIL_THEME.colours.accent,
  fontSize: `${EMAIL_THEME.typography.body}px`,
  lineHeight: "25px",
  textDecoration: "underline",
} satisfies CSSProperties;
