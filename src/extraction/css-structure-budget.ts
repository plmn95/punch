const MAX_CSS_STRUCTURE_TOKENS = 20_000;
const MAX_CSS_NESTING_DEPTH = 64;
const MAX_CSS_RAW_SPAN = 16_384;

type CssScanState = {
  tokens: number;
  depth: number;
  quote: "'" | '"' | undefined;
  inComment: boolean;
  escaped: boolean;
  rawSpan: number;
};

type ScanResult = "accept" | "reject" | "skip-next";

/** Checks CSS structure in O(1) memory before any PostCSS AST is built. */
export function hasBoundedCssStructure(css: string): boolean {
  const state: CssScanState = {
    tokens: 0,
    depth: 0,
    quote: undefined,
    inComment: false,
    escaped: false,
    rawSpan: 0,
  };
  for (let index = 0; index < css.length; index += 1) {
    const result = scanCssCharacter(state, css[index]!, css[index + 1]);
    if (result === "reject") {
      return false;
    }
    if (result === "skip-next") {
      index += 1;
    }
  }
  return true;
}

/** Advances the constant-memory scanner by one CSS character. */
function scanCssCharacter(
  state: CssScanState,
  character: string,
  next: string | undefined,
): ScanResult {
  state.rawSpan += 1;
  if (state.rawSpan > MAX_CSS_RAW_SPAN) {
    return "reject";
  }
  if (state.inComment) {
    if (character === "*" && next === "/") {
      state.inComment = false;
      return "skip-next";
    }
    return "accept";
  }
  if (state.quote) {
    advanceQuote(state, character);
    return "accept";
  }
  if (character === "'" || character === '"') {
    state.quote = character;
    return "accept";
  }
  if (character === "/" && next === "*") {
    state.inComment = true;
    state.tokens += 1;
    return withinBudget(state) ? "skip-next" : "reject";
  }
  applyStructuralToken(state, character);
  return withinBudget(state) ? "accept" : "reject";
}

/** Advances escape and close state inside one quoted CSS value. */
function advanceQuote(state: CssScanState, character: string): void {
  if (state.escaped) {
    state.escaped = false;
  } else if (character === "\\") {
    state.escaped = true;
  } else if (character === state.quote) {
    state.quote = undefined;
  }
}

/** Applies one structural brace or declaration terminator. */
function applyStructuralToken(state: CssScanState, character: string): void {
  if (character === "{") {
    state.tokens += 1;
    state.depth += 1;
    state.rawSpan = 0;
  } else if (character === "}") {
    state.tokens += 1;
    state.depth = Math.max(0, state.depth - 1);
    state.rawSpan = 0;
  } else if (character === ";") {
    state.tokens += 1;
    state.rawSpan = 0;
  }
}

/** Reports whether cumulative CSS structure remains under both caps. */
function withinBudget(state: CssScanState): boolean {
  return (
    state.tokens <= MAX_CSS_STRUCTURE_TOKENS &&
    state.depth <= MAX_CSS_NESTING_DEPTH
  );
}
