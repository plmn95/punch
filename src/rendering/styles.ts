import type { CSSProperties } from "react";

import type { RenderTheme } from "./brand-theme.js";

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

/** Creates pageStyle without changing shared render state. */
export const pageStyle = (theme: RenderTheme): CSSProperties => ({
  WebkitTextSizeAdjust: "100%",
  backgroundColor: theme.colours.page,
  color: theme.colours.primary,
  fontFamily: theme.fonts.body,
  margin: "0",
  padding: "0",
  textSizeAdjust: "100%",
});

/** Creates outerTableStyle without changing shared render state. */
export const outerTableStyle = (theme: RenderTheme): CSSProperties => ({
  backgroundColor: theme.colours.page,
  borderCollapse: "collapse",
  width: "100%",
});

/** Creates shellCellStyle without changing shared render state. */
export const shellCellStyle = (): CSSProperties => ({
  padding: "32px 16px",
});

/** Creates containerStyle without changing shared render state. */
export const containerStyle = (theme: RenderTheme): CSSProperties => ({
  backgroundColor: theme.colours.canvas,
  border: `1px solid ${theme.colours.border}`,
  borderCollapse: "separate",
  borderRadius: "14px",
  boxShadow: "0 12px 32px rgba(47, 37, 31, 0.08)",
  maxWidth: "600px",
  overflow: "hidden",
  width: "100%",
});

/** Creates preheaderStyle without changing shared render state. */
export const preheaderStyle = (): CSSProperties => ({
  color: "transparent",
  display: "none",
  fontSize: "1px",
  lineHeight: "1px",
  maxHeight: "0",
  maxWidth: "0",
  opacity: 0,
  overflow: "hidden",
});

/** Creates sectionCellStyle without changing shared render state. */
export const sectionCellStyle = (): CSSProperties => ({
  padding: "24px 40px",
});

/** Creates compactSectionCellStyle without changing shared render state. */
export const compactSectionCellStyle = (): CSSProperties => ({
  padding: "24px 40px",
  textAlign: "center",
});

/** Creates centeredSectionCellStyle without changing shared render state. */
export const centeredSectionCellStyle = (): CSSProperties => ({
  padding: "36px 40px 40px",
  textAlign: "center",
});

/** Creates heroSectionCellStyle without changing shared render state. */
export const heroSectionCellStyle = (theme: RenderTheme): CSSProperties => ({
  backgroundColor: theme.colours.card,
  padding: "44px 40px",
  textAlign: "center",
});

/** Creates headingSectionCellStyle without changing shared render state. */
export const headingSectionCellStyle = (): CSSProperties => ({
  padding: "32px 40px 8px",
});

/** Creates bodySectionCellStyle without changing shared render state. */
export const bodySectionCellStyle = (): CSSProperties => ({
  padding: "0 40px 24px",
});

/** Creates productSectionCellStyle without changing shared render state. */
export const productSectionCellStyle = (): CSSProperties => ({
  padding: "16px 40px 24px",
});

/** Creates wordmarkStyle without changing shared render state. */
export const wordmarkStyle = (theme: RenderTheme): CSSProperties => ({
  color: theme.colours.primary,
  fontFamily: theme.fonts.display,
  fontSize: `${theme.typography.wordmark}px`,
  fontWeight: 700,
  lineHeight: "32px",
  textDecoration: "none",
});

/** Creates imageStyle without changing shared render state. */
export const imageStyle = (): CSSProperties => ({
  border: "0",
  display: "block",
  height: "auto",
  maxWidth: "100%",
  outline: "none",
  textDecoration: "none",
});

/** Creates fullWidthImageStyle without changing shared render state. */
export const fullWidthImageStyle = (): CSSProperties => ({
  ...imageStyle(),
  width: "100%",
});

/** Creates heroImageStyle without changing shared render state. */
export const heroImageStyle = (): CSSProperties => ({
  ...fullWidthImageStyle(),
  borderRadius: "10px",
  marginBottom: "26px",
});

/** Creates eyebrowStyle without changing shared render state. */
export const eyebrowStyle = (theme: RenderTheme): CSSProperties => ({
  color: theme.colours.link,
  fontSize: `${theme.typography.eyebrow}px`,
  fontWeight: 700,
  letterSpacing: "1.2px",
  lineHeight: "18px",
  margin: "0 0 10px",
  textTransform: "uppercase",
});

/** Creates heroHeadingStyle without changing shared render state. */
export const heroHeadingStyle = (theme: RenderTheme): CSSProperties => ({
  color: theme.colours.primary,
  fontFamily: theme.fonts.display,
  fontSize: `${theme.typography.hero}px`,
  fontWeight: 700,
  lineHeight: "44px",
  margin: "0 0 16px",
});

/** Creates headingTwoStyle without changing shared render state. */
export const headingTwoStyle = (theme: RenderTheme): CSSProperties => ({
  color: theme.colours.primary,
  fontFamily: theme.fonts.display,
  fontSize: `${theme.typography.heading}px`,
  fontWeight: 700,
  lineHeight: "34px",
  margin: "0",
});

/** Creates headingThreeStyle without changing shared render state. */
export const headingThreeStyle = (theme: RenderTheme): CSSProperties => ({
  color: theme.colours.primary,
  fontFamily: theme.fonts.display,
  fontSize: `${theme.typography.subheading}px`,
  fontWeight: 700,
  lineHeight: "28px",
  margin: "0",
});

/** Creates bodyTextStyle without changing shared render state. */
export const bodyTextStyle = (theme: RenderTheme): CSSProperties => ({
  color: theme.colours.body,
  fontSize: `${theme.typography.body}px`,
  lineHeight: "25px",
  margin: "0",
});

/** Creates bodyTextWithTopMarginStyle without changing shared render state. */
export const bodyTextWithTopMarginStyle = (
  theme: RenderTheme,
): CSSProperties => ({
  ...bodyTextStyle(theme),
  margin: "12px 0 0",
});

/** Creates inlineLinkStyle without changing shared render state. */
export const inlineLinkStyle = (theme: RenderTheme): CSSProperties => ({
  color: theme.colours.link,
  fontSize: `${theme.typography.body}px`,
  lineHeight: "25px",
  textDecoration: "underline",
});

export const baseStyleFactories = {
  pageStyle,
  outerTableStyle,
  shellCellStyle,
  containerStyle,
  preheaderStyle,
  sectionCellStyle,
  compactSectionCellStyle,
  centeredSectionCellStyle,
  heroSectionCellStyle,
  headingSectionCellStyle,
  bodySectionCellStyle,
  productSectionCellStyle,
  wordmarkStyle,
  imageStyle,
  fullWidthImageStyle,
  heroImageStyle,
  eyebrowStyle,
  heroHeadingStyle,
  headingTwoStyle,
  headingThreeStyle,
  bodyTextStyle,
  bodyTextWithTopMarginStyle,
  inlineLinkStyle,
};
