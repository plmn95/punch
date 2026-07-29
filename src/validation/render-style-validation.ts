import {
  MIN_COMPLIANCE_FONT_SIZE,
  MIN_CONTENT_FONT_SIZE,
  MIN_CTA_HEIGHT,
} from "../rendering/render-contract.js";
import {
  collectElementContexts,
  collectStartTags,
  exactAttribute,
  type GeneratedElementContext,
  type GeneratedStartTag,
} from "./generated-html.js";
import { responsiveFontFloorsPass } from "./render-responsive-style-validation.js";
import {
  isNonTextRole,
  textRoleContexts,
  textRoleContractPasses,
} from "./render-text-role-validation.js";

const REQUIRED_ROLES = [
  "button",
  "compliance",
  "compliance-link",
  "preheader",
  "product-name",
] as const;

const COMPLIANCE_ROLES = new Set(["compliance", "compliance-link"]);

/** Parses one opaque six-digit hexadecimal colour. */
function parseHexColour(value: unknown): [number, number, number] | undefined {
  if (typeof value !== "string" || !/^#[\da-f]{6}$/iu.test(value)) {
    return undefined;
  }
  return [1, 3, 5].map((offset) =>
    Number.parseInt(value.slice(offset, offset + 2), 16),
  ) as [number, number, number];
}

/** Converts one sRGB channel to relative luminance. */
function lineariseChannel(value: number): number {
  const channel = value / 255;
  return channel <= 0.04045
    ? channel / 12.92
    : ((channel + 0.055) / 1.055) ** 2.4;
}

/** Returns the relative luminance for one opaque colour tuple. */
function luminance([red, green, blue]: [number, number, number]): number {
  return (
    0.2126 * lineariseChannel(red) +
    0.7152 * lineariseChannel(green) +
    0.0722 * lineariseChannel(blue)
  );
}

/** Returns the WCAG contrast ratio for two supported opaque colours. */
export function contrastRatio(
  foreground: unknown,
  background: unknown,
): number | undefined {
  const foregroundRgb = parseHexColour(foreground);
  const backgroundRgb = parseHexColour(background);
  if (foregroundRgb === undefined || backgroundRgb === undefined) {
    return undefined;
  }
  const first = luminance(foregroundRgb);
  const second = luminance(backgroundRgb);
  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05);
}

/** Parses a non-negative pixel value from one rendered style property. */
export function stylePixels(value: unknown): number | undefined {
  if (typeof value === "number") {
    return value >= 0 ? value : undefined;
  }
  if (typeof value !== "string" || !/^\d+(?:\.\d+)?px$/u.test(value)) {
    return undefined;
  }
  return Number.parseFloat(value);
}

/** Parses one generated inline style attribute into exact properties. */
function inlineStyle(tag: GeneratedStartTag): Record<string, string> {
  const value = exactAttribute(tag, "style");
  if (value === undefined) {
    return {};
  }
  return Object.fromEntries(
    value.split(";").flatMap((declaration) => {
      const separator = declaration.indexOf(":");
      return separator <= 0
        ? []
        : [[declaration.slice(0, separator), declaration.slice(separator + 1)]];
    }),
  );
}

/** Finds one emitted style property on a tag or its nearest ancestor. */
function inheritedStyleProperty(
  context: GeneratedElementContext,
  property: string,
): string | undefined {
  return [context.tag, ...[...context.ancestors].reverse()]
    .map((tag) => inlineStyle(tag)[property])
    .find((value) => value !== undefined);
}

/** Reports whether one rendered text tag meets its WCAG threshold. */
function textTagPasses(context: GeneratedElementContext): boolean {
  const ratio = contrastRatio(
    inheritedStyleProperty(context, "color"),
    inheritedStyleProperty(context, "background-color"),
  );
  const fontSize = stylePixels(inheritedStyleProperty(context, "font-size"));
  const fontWeight = Number(
    inheritedStyleProperty(context, "font-weight") ?? 400,
  );
  if (ratio === undefined || fontSize === undefined) {
    return false;
  }
  const isLarge = fontSize >= 24 || (fontSize >= 18.66 && fontWeight >= 700);
  return ratio >= (isLarge ? 3 : 4.5);
}

/** Checks the rendered hidden preheader exemption. */
function hiddenPreheaderPasses(tags: GeneratedStartTag[]): boolean {
  const preheaders = tags.filter(
    (tag) => exactAttribute(tag, "data-punch-text-role") === "preheader",
  );
  const style = preheaders[0] === undefined ? {} : inlineStyle(preheaders[0]);
  return (
    preheaders.length === 1 &&
    style.color === "transparent" &&
    style.display === "none" &&
    style["font-size"] === "1px" &&
    style["line-height"] === "1px" &&
    style["max-height"] === "0" &&
    style["max-width"] === "0" &&
    style.opacity === "0" &&
    style.overflow === "hidden"
  );
}

/** Checks actual rendered text roles against contrast thresholds. */
function contrastPasses(contexts: GeneratedElementContext[]): boolean {
  const roles = textRoleContexts(contexts);
  return (
    textRoleContractPasses(contexts, roles) &&
    roles.every(({ context, role }) => {
      if (isNonTextRole(role)) {
        return true;
      }
      return textTagPasses(context);
    })
  );
}

/** Checks actual rendered content and compliance font floors. */
function fontFloorsPass(
  html: string,
  contexts: GeneratedElementContext[],
): boolean {
  const roleContexts = textRoleContexts(contexts);
  const presentRoles = new Set(roleContexts.map(({ role }) => role));
  return (
    textRoleContractPasses(contexts, roleContexts) &&
    REQUIRED_ROLES.every((role) => presentRoles.has(role)) &&
    hiddenPreheaderPasses(contexts.map(({ tag }) => tag)) &&
    responsiveFontFloorsPass(html) &&
    roleContexts.every(({ context, role }) => {
      if (isNonTextRole(role)) {
        return true;
      }
      const size = stylePixels(inheritedStyleProperty(context, "font-size"));
      const floor = COMPLIANCE_ROLES.has(role)
        ? MIN_COMPLIANCE_FONT_SIZE
        : MIN_CONTENT_FONT_SIZE;
      return size !== undefined && size >= floor;
    })
  );
}

/** Expands supported rendered padding shorthand to vertical pixel values. */
function verticalPadding(
  value: string | undefined,
): [number, number] | undefined {
  const pixels = value?.split(/\s+/u).map(stylePixels);
  if (
    pixels === undefined ||
    pixels.length < 1 ||
    pixels.length > 4 ||
    pixels.some((pixel) => pixel === undefined)
  ) {
    return undefined;
  }
  const values = pixels as [number, ...number[]];
  const bottom = values.length >= 3 ? (values[2] ?? values[0]) : values[0];
  return [values[0], bottom];
}

/** Checks every rendered clickable CTA against the actual height floor. */
function ctaHeightPasses(tags: GeneratedStartTag[]): boolean {
  const buttons = tags.filter(
    (tag) =>
      exactAttribute(tag, "data-punch-role") === "cta" ||
      exactAttribute(tag, "data-punch-text-role") === "button",
  );
  return (
    buttons.length > 0 &&
    buttons.every((tag) => {
      if (
        tag.name !== "a" ||
        exactAttribute(tag, "data-punch-role") !== "cta" ||
        exactAttribute(tag, "data-punch-text-role") !== "button"
      ) {
        return false;
      }
      const style = inlineStyle(tag);
      const lineHeight = stylePixels(style["line-height"]);
      const minimumHeight = stylePixels(style["min-height"]);
      const padding = verticalPadding(style.padding);
      const marker = Number(exactAttribute(tag, "data-punch-cta-height"));
      return (
        lineHeight !== undefined &&
        minimumHeight !== undefined &&
        padding !== undefined &&
        lineHeight + padding[0] + padding[1] >= MIN_CTA_HEIGHT &&
        minimumHeight >= MIN_CTA_HEIGHT &&
        marker >= MIN_CTA_HEIGHT
      );
    })
  );
}

/** Validates actual rendered colour, type, and CTA style policy. */
export function validateRenderStyles(html: string) {
  const contexts = collectElementContexts(html);
  const tags = collectStartTags(html);
  return {
    contrast: contrastPasses(contexts),
    ctaHeight: ctaHeightPasses(tags),
    fontFloor: fontFloorsPass(html, contexts),
  } as const;
}
