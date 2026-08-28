import {
  createContext,
  useContext,
  type CSSProperties,
  type ReactNode,
} from "react";

import {
  DEFAULT_BRAND_SETTINGS,
  type CompleteBrandSettings,
} from "../brand/settings.js";
import { createBrandTheme } from "./brand-theme.js";
import { baseStyleFactories } from "./styles.js";
import { commerceStyleFactories } from "./commerce-styles.js";

const factories = { ...baseStyleFactories, ...commerceStyleFactories };
type RenderStyles = Readonly<{ [K in keyof typeof factories]: CSSProperties }>;

/** Creates the style set once for this document, never in process-global mutable state. */
function createStyles(settings: CompleteBrandSettings): RenderStyles {
  const theme = createBrandTheme(settings);
  return Object.fromEntries(
    Object.entries(factories).map(([key, factory]) => [key, factory(theme)]),
  ) as RenderStyles;
}

const RenderStyleContext = createContext<RenderStyles>(
  createStyles(DEFAULT_BRAND_SETTINGS),
);

/** Supplies isolated styles to all React email blocks in one render. */
export function BrandStyleProvider({
  settings,
  children,
}: {
  settings: CompleteBrandSettings;
  children: ReactNode;
}) {
  return (
    <RenderStyleContext.Provider value={createStyles(settings)}>
      {children}
    </RenderStyleContext.Provider>
  );
}

/** Reads the current document's style set without recomputing its theme. */
export function useRenderStyles(): RenderStyles {
  return useContext(RenderStyleContext);
}
