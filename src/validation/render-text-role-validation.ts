import {
  exactAttribute,
  type GeneratedElementContext,
} from "./generated-html.js";

const NON_TEXT_ROLES = new Set(["image-link", "preheader"]);
const TEXT_LEAF_ELEMENTS = new Set(["a", "h1", "h2", "h3", "p", "span"]);
const ROLE_ELEMENTS = new Map<string, ReadonlySet<string>>([
  ["body-canvas", new Set(["p"])],
  ["body-card", new Set(["p"])],
  ["body-promotion", new Set(["p"])],
  ["button", new Set(["a"])],
  ["compliance", new Set(["p", "td"])],
  ["compliance-link", new Set(["a"])],
  ["discount-code", new Set(["span"])],
  ["eyebrow-card", new Set(["p"])],
  ["heading", new Set(["h2"])],
  ["hero-heading", new Set(["h1"])],
  ["image-link", new Set(["a"])],
  ["inline-link", new Set(["a"])],
  ["preheader", new Set(["div"])],
  ["product-name", new Set(["h2", "h3"])],
  ["product-price", new Set(["p"])],
  ["subheading", new Set(["h3"])],
  ["subheading-promotion", new Set(["h2"])],
  ["wordmark", new Set(["a"])],
]);

export type TextRoleContext = {
  readonly context: GeneratedElementContext;
  readonly role: string;
};

/** Returns every rendered element carrying a text-role marker. */
export function textRoleContexts(
  contexts: GeneratedElementContext[],
): TextRoleContext[] {
  return contexts.flatMap((context) => {
    const role = exactAttribute(context.tag, "data-punch-text-role");
    return role === undefined ? [] : [{ context, role }];
  });
}

/** Reports whether one role is the closed non-text exemption. */
export function isNonTextRole(role: string): boolean {
  return NON_TEXT_ROLES.has(role);
}

/** Reports whether one marked context belongs to renderer-owned compliance. */
function hasComplianceOwner(context: GeneratedElementContext): boolean {
  return [context.tag, ...context.ancestors].some(
    (tag) => exactAttribute(tag, "data-punch-compliance") !== undefined,
  );
}

/** Reports whether an image-link anchor actually contains an image. */
function hasImageDescendant(
  context: GeneratedElementContext,
  contexts: GeneratedElementContext[],
): boolean {
  return contexts.some(
    (candidate) =>
      candidate.tag.name === "img" &&
      candidate.ancestors.some(
        (ancestor) => ancestor.index === context.tag.index,
      ),
  );
}

/** Checks one role against its permitted element and ownership context. */
function roleContextPasses(
  { context, role }: TextRoleContext,
  contexts: GeneratedElementContext[],
): boolean {
  if (!ROLE_ELEMENTS.get(role)?.has(context.tag.name)) {
    return false;
  }
  if (role === "image-link") {
    return hasImageDescendant(context, contexts);
  }
  if (role === "preheader") {
    return exactAttribute(context.tag, "data-punch-preheader") === "v1";
  }
  return !role.startsWith("compliance") || hasComplianceOwner(context);
}

/** Requires exhaustive text markers with role-to-element compatibility. */
export function textRoleContractPasses(
  contexts: GeneratedElementContext[],
  roles: TextRoleContext[],
): boolean {
  return (
    contexts.every(
      ({ tag }) =>
        !TEXT_LEAF_ELEMENTS.has(tag.name) ||
        exactAttribute(tag, "data-punch-text-role") !== undefined,
    ) && roles.every((role) => roleContextPasses(role, contexts))
  );
}
