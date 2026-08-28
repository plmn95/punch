# Brand settings and the CLI

Punch keeps email layout in controlled React blocks. Branding is a separate,
validated input to those blocks, never model-written CSS or HTML.

## Five settings

| Setting            | CLI flag              | Meaning                                   |
| ------------------ | --------------------- | ----------------------------------------- |
| `primaryColour`    | `--primary-colour`    | Main action colour and decorative accents |
| `backgroundColour` | `--background-colour` | Main email surface                        |
| `textColour`       | `--text-colour`       | Readable content ink                      |
| `headingFont`      | `--heading-font`      | One heading font family                   |
| `bodyFont`         | `--body-font`         | One body font family                      |

Colours use `#RRGGBB`. Font names are bounded plain family names, not CSS stacks,
URLs or font files. The renderer supplies fallback stacks. It does not download
or embed custom fonts; naming one does not guarantee the recipient has it.

The renderer derives cards, borders and supporting surfaces. It preserves the
primary colour on buttons and chooses readable button text. Links may use
readable ink instead of a low-contrast brand colour. Explicit text must meet
4.5:1 contrast against the background; an invalid manual combination is refused.
The guide offers a correction that the user must accept. Unreadable detected
text receives a labelled fallback.

## Conservative website detection

The existing bounded fetcher supplies HTML and same-origin CSS. Role extraction
recognises explicit root tokens such as `--primary`, `--color-primary`,
`--background`, `--text`, `--font-heading` and `--font-body`, plus unconditional
body, heading and button rules. It supports opaque hex/integer RGB values and
short local variable chains. Explicit tokens take priority over semantic rules.
Conflicting top-ranked candidates are omitted, not selected by stylesheet order.

This is not a browser-computed cascade or a pixel-perfect website clone. It does
not evaluate JavaScript, follow CSS imports, infer roles from arbitrary class
names, or choose between conditional/hover/dark-mode rules. Missing roles use
defaults. A website that provides only ambiguous signals may retain neutral
styling until the caller supplies overrides.

`result.brand` contains the resolved settings, per-slot `website`/`manual`/
`fallback` origins and warnings. These also live in `campaign.json`, independent
of optional traces. They contain no raw stylesheet or provider payload.

## Reusable profiles

```json
{
  "version": "1",
  "settings": {
    "primaryColour": "#2563EB",
    "backgroundColour": "#FFFFFF",
    "textColour": "#172033",
    "headingFont": "Verdana",
    "bodyFont": "Arial"
  }
}
```

Profiles may specify a subset of settings. `--brand` reads a bounded, regular
JSON file; symlinks, hardlinks and linked parent paths are refused. `--save-brand`
and the guide's save action require a new filename in an existing real parent
directory. There is no global profile, credential store or automatic saving.
The campaign and an external profile are separate saves: if the latter fails,
the CLI reports that the campaign was saved and leaves it intact.

Precedence is explicit flags → loaded profile → detected website roles →
fallbacks. During restyling, saved campaign settings replace website detection.

## Guided and automated use

Bare `punch` and incomplete `punch generate` invocations guide only when both
stdin and stdout are TTYs, no CI environment is detected, and prompting has not
been disabled. Complete commands bypass the guide unless `--interactive` is
present. `--json` and `--no-interactive` always win over `--interactive`.
Unknown flags and duplicate scalar flags fail before any question.

The guide collects sources and the brief, fetches the pages, then reviews brand
settings before optional voice inference or campaign generation. Source-fetch
resources are released before waiting for input. Ctrl-C, Ctrl-D and a declined
generation confirmation cancel without publishing an output bundle.

After generation: `p` opens a temporary browser preview, `b` adjusts branding,
`s` chooses a profile filename, and Enter exports. Temporary previews are removed
when the session ends. The final HTML remains in the chosen output directory.
Brand-only changes reuse the same semantic campaign and its generation usage.

`punch render --campaign <campaign.json> --output <new-directory>` works without
credentials or AI calls. It accepts a saved Punch campaign document or a canonical
semantic campaign. It does not reuse prior grounding claims: validation is
explicitly `render-only`, with zero model usage. Neither rendering mode sends
email or resolves the caller-owned compliance placeholders.

## TypeScript integration

```ts
import { generateCampaign, restyleCampaign, renderCampaign } from "punch-email";

const result = await generateCampaign(
  { website, products, goal: "sales", brand: { primaryColour: "#2563EB" } },
  { provider },
);

// In-memory restyling preserves the existing generation proof and usage.
const green = await restyleCampaign(result, { primaryColour: "#006644" });

// Independent rendering makes only render-validation claims.
const preview = await renderCampaign(result.campaign, result.brand?.settings);
```

A platform can supply its existing brand settings through the same `brand`
input; no CLI or platform-specific connector is required. An optional
`reviewBrand` callback can return overrides before model work begins. Ordinary
API calls remain non-interactive.

## Verification boundary

Tests cover role selection and ambiguity, strict settings, contrast, concurrent
theme isolation, single/six-product rendering, profile safety, TTY/CI gating,
manual correction, cancellation, preview cleanup and render-only reproducibility.
Browser fixtures check desktop/mobile layout. Browser proof is not certification
across Gmail, Outlook, Apple Mail or every installed font.
