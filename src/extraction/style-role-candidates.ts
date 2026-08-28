import type { Declaration, Root, Rule } from "postcss";

import {
  CompleteBrandSettingsSchema,
  type BrandSettingKey,
  type BrandStyleEvidence,
} from "../brand/settings.js";

export type StyleRoleCandidate = {
  key: BrandSettingKey;
  value: string;
  rank: number;
};
export type SourcedStyleCandidate = StyleRoleCandidate & {
  evidence: { url: string; field: string };
};

const VARIABLE_ROLES: readonly [BrandSettingKey, RegExp][] = [
  [
    "primaryColour",
    /^--(?:(?:brand|color|colour)-)?(?:primary|accent)(?:-color|-colour)?$/iu,
  ],
  [
    "backgroundColour",
    /^--(?:(?:color|colour)-)?(?:background|bg)(?:-color|-colour)?$/iu,
  ],
  [
    "textColour",
    /^--(?:(?:color|colour)-)?(?:text|foreground)(?:-color|-colour)?$/iu,
  ],
  [
    "headingFont",
    /^--(?:font(?:-family)?-heading|heading-font(?:-family)?)$/iu,
  ],
  ["bodyFont", /^--(?:font(?:-family)?-body|body-font(?:-family)?)$/iu],
];

/** Returns only unconditional CSS rules; viewport/hover/dark-mode variants are not guesses. */
function plainRule(declaration: Declaration): Rule | undefined {
  const parent = declaration.parent;
  return parent?.type === "rule" &&
    parent.parent?.type === "root" &&
    !/:(?!root\b)/iu.test(parent.selector)
    ? parent
    : undefined;
}

/** Resolves a short local variable chain without following imports or evaluating CSS. */
function resolveValue(
  value: string,
  variables: ReadonlyMap<string, string>,
): string {
  let current = value.trim();
  for (let depth = 0; depth < 4; depth += 1) {
    const variable = /^var\((--[a-z\d_-]+)\)$/iu.exec(current);
    if (!variable) return current;
    current = variables.get(variable[1]!)?.trim() ?? "";
  }
  return "";
}

/** Normalises only complete opaque hex or integer RGB colour declarations. */
function cssColour(value: string): string {
  const short = /^#([\da-f]{3})$/iu.exec(value);
  if (short)
    return `#${[...short[1]!].map((digit) => digit.repeat(2)).join("")}`;
  const rgb =
    /^rgb\(\s*(\d{1,3})\s*[, ]\s*(\d{1,3})\s*[, ]\s*(\d{1,3})\s*\)$/iu.exec(
      value,
    );
  if (!rgb) return value;
  const channels = rgb.slice(1).map(Number);
  return channels.every((channel) => channel <= 255)
    ? `#${channels.map((channel) => channel.toString(16).padStart(2, "0")).join("")}`
    : "";
}

/** Retains a validated family or colour, never executable CSS. */
function roleValue(key: BrandSettingKey, value: string): string | undefined {
  const candidate = key.endsWith("Font")
    ? value
        .split(",")[0]!
        .trim()
        .replace(/^(['"])(.*)\1$/u, "$2")
    : cssColour(value);
  const parsed = CompleteBrandSettingsSchema.shape[key].safeParse(candidate);
  return parsed.success ? parsed.data : undefined;
}

/** Assigns semantic roles only to explicit tokens and recognisable page elements. */
function declarationRole(
  declaration: Declaration,
  rule: Rule,
): [BrandSettingKey, number] | undefined {
  const property = declaration.prop.toLowerCase();
  const root = /^(?:\s*(?::root|html)\s*,?)+$/u.test(rule.selector);
  const variable = root
    ? VARIABLE_ROLES.find(([, pattern]) => pattern.test(property))
    : undefined;
  if (variable) return [variable[0], 3];
  const page = /^(?:\s*(?:body|html|:root)\s*,?)+$/u.test(rule.selector);
  const heading = /^(?:\s*h[1-6]\s*,?)+$/u.test(rule.selector);
  const action =
    /^(?:\s*(?:button|\.btn|\.button|\.cta|\.button-primary|\.btn-primary)\s*,?)+$/u.test(
      rule.selector,
    );
  if (page && ["background", "background-color"].includes(property))
    return ["backgroundColour", 2];
  if (page && property === "color") return ["textColour", 2];
  if (action && ["background", "background-color"].includes(property))
    return ["primaryColour", 2];
  if (heading && property === "font-family") return ["headingFont", 2];
  if (page && property === "font-family") return ["bodyFont", 2];
  return undefined;
}

/** Collects bounded role candidates from the already-parsed inert stylesheet. */
export function collectStyleRoles(root: Root): StyleRoleCandidate[] {
  const variables = new Map<string, string>();
  root.walkDecls((declaration) => {
    const rule = plainRule(declaration);
    if (
      rule &&
      /^(?:\s*(?::root|html)\s*,?)+$/u.test(rule.selector) &&
      declaration.prop.startsWith("--") &&
      declaration.value.length <= 4096 &&
      variables.size < 128
    ) {
      variables.set(declaration.prop, declaration.value);
    }
  });
  const candidates: StyleRoleCandidate[] = [];
  root.walkDecls((declaration) => {
    const rule = plainRule(declaration);
    if (!rule || declaration.value.length > 4096 || candidates.length >= 64)
      return;
    const role = declarationRole(declaration, rule);
    if (!role) return;
    const value = roleValue(
      role[0],
      resolveValue(declaration.value, variables),
    );
    if (value !== undefined)
      candidates.push({ key: role[0], value, rank: role[1] });
  });
  return candidates;
}

/** Omits conflicting top-ranked roles instead of picking a colour by source order. */
export function resolveStyleRoles(
  candidates: readonly SourcedStyleCandidate[],
): BrandStyleEvidence {
  const result: BrandStyleEvidence = {};
  for (const key of Object.keys(
    CompleteBrandSettingsSchema.shape,
  ) as BrandSettingKey[]) {
    const matching = candidates.filter((candidate) => candidate.key === key);
    const rank = Math.max(...matching.map((candidate) => candidate.rank));
    const best = matching.filter((candidate) => candidate.rank === rank);
    if (
      best.length === 0 ||
      new Set(best.map((candidate) => candidate.value)).size !== 1
    )
      continue;
    result[key] = {
      value: best[0]!.value,
      evidence: best[0]!.evidence,
      confidence: rank >= 3 ? "explicit" : "semantic",
    };
  }
  return result;
}
