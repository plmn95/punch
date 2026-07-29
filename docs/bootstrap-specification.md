# Punch bootstrap specification

Status: design-only Phase 1 specification. It does not authorise Phase 2
implementation, dependency installation, a remote, or publication.

## Repository baseline

The Phase 1 local review candidate is:

- local path: `/Users/plamenhadzhiev/repos/12startups/punch`;
- empty independent Git history created on `main`;
- no configured remote;
- one documentation-only commit containing exactly the six Phase 1 artifacts;
- no package manifest, lockfile, source directory, dependency, runtime code,
  prompt body, fixture, snapshot, asset, licence, CI workflow, or release
  configuration.

Punch must never inherit the private Punchline Git history. A future public
history starts from reviewed Punch commits only.

## Intended package shape

This is a future module map, not a request to create these paths in Phase 1.

```text
src/
├── cli/          # explicit command, guided adapter, result output
├── core/         # campaign orchestrator, goals, public schemas
├── providers/    # internal TextModel seam and Anthropic adapter
├── extraction/   # shared public HTTP, brand, and product extraction
├── generation/   # emit, critique, revise, repair, prompt builders
├── rendering/    # export renderer, compliance, blocks, styles
├── validation/   # product binding, claims, links, render checks
└── output/       # artifacts, safe directory handling, traces
```

Boundaries are directional:

1. CLI normalises input and calls core.
2. Core coordinates injected provider, extraction, generation, rendering,
   validation, and output.
3. Generation knows semantic schemas but not React, files, CLI, or Anthropic
   SDK construction.
4. Rendering knows validated campaign data but not fetching, model calls, CLI,
   editor state, or application services.
5. Validation consumes explicit source evidence and rendered output.
6. Output writes final artifacts only after path and validation decisions.

## Public input contract

The first public schema is equivalent to:

```ts
type CampaignGoal = "sales" | "product-launch" | "promotion";

type OfferInput = {
  description: string;
  code?: string;
  endsAt?: string;
};

type GenerateCampaignInput = {
  website: string;
  products: string[];
  goal: CampaignGoal;
  instructions?: string;
  offer?: OfferInput;
};
```

Schema requirements:

- `website` is one public credential-free HTTP(S) URL;
- `products` contains one to six public credential-free HTTP(S) URLs;
- product URLs are canonicalised, unique, and retain input order;
- every string is trimmed and length-limited;
- HTML is stripped from user-authored free text before model use;
- `offer` is required for `promotion` and forbidden for other goals;
- `description` states the offer without inviting the model to infer value;
- `endsAt` uses a documented ISO-8601 representation when supplied;
- output directory, trace, JSON, force, and interaction flags are command
  concerns, not campaign input.

During general-input support, canonical products receive deterministic IDs in
input order, for example `product-01` through `product-06`. Those IDs survive
extraction, generation, revision, rendering, validation, and artifacts.

## Provider contract

The engine receives a configured object implementing one small internal seam:

```ts
interface TextModel {
  complete(request: ModelRequest): Promise<ModelResponse>;
}
```

The exact request/response schemas are fixed at Phase 2 checkpoint 1. They
must carry:

- system and user content;
- a stage name and prompt version;
- maximum output bounds;
- a shared `AbortSignal`;
- returned text and normalised usage;
- provider-neutral error categories.

The Anthropic adapter alone:

- imports the Anthropic SDK;
- reads the selected model from one configuration owner;
- accepts credentials at construction;
- translates SDK errors;
- applies provider-call deadlines;
- exposes no credential in logs, traces, errors, commands, or artifacts.

The core campaign function receives the provider; it never reads
`ANTHROPIC_API_KEY` or constructs the SDK client. A fake provider supports
deterministic tests. `0.1.0` has no public provider-plugin framework.

## Semantic campaign contract

The campaign schema owns an ordered blueprint of at most 40 generated blocks:

- `header-standard`;
- `hero-stacked`;
- `heading`;
- `body-paragraph`;
- `product-feature`;
- `product-grid`;
- `discount-code`;
- `cta-block`.

Each block has a deterministic ID. Each `product-feature` and each
`product-grid` item has a required `productId`. Product grids contain two to six
items, use two to four desktop columns, and require one product-specific CTA
per item. A product feature also requires a product-specific CTA.

The model does not choose compliance chrome, raw HTML, MJML, arbitrary CSS,
email-editor controls, or unsupported block types.

Campaign-level validation requires:

- every input product ID appears at least once;
- no unknown product ID appears;
- names, prices, currencies, images, descriptions, links, and CTAs remain bound
  to the same product;
- every product CTA points to that product's validated canonical URL;
- exact observed facts are not rewritten or mixed;
- promotion claims use structured offer evidence;
- serious unsupported claims are absent;
- `sales` contains no inferred promotion;
- block count, grid cardinality, CTA, URL, and schema constraints pass.

## Rendering contract

The renderer consumes validated semantic campaign JSON and returns standalone
HTML. It must:

- use export-only React Email leaves with no browser/editor imports;
- retain mature one-product, featured-plus-supporting, balanced-grid,
  collection, repeated-product, introduction, and conclusion structures;
- preserve balanced rows, explicit cell widths, Outlook-safe image dimensions,
  responsive stacking below 600px, and measured product-card text zones;
- use a validated product image or a deliberate image-free layout;
- escape text and attributes and restrict Markdown to supported inline forms;
- validate every link and image URL;
- include renderer-owned `{{unsubscribe_url}}` and
  `{{physical_address}}` literals;
- emit stable Punch-owned markers for deterministic render checks;
- contain no Punchline host, R2 URL, editor attribute, TipTap data, or external
  placeholder service.

Deterministic render checks include:

- 4.5:1 contrast for normal text and 3:1 for large text;
- at least 44px button CTA height;
- at least 14px content and 12px compliance-chrome font size;
- at most 102,400 bytes of final HTML;
- at most four columns with explicit widths and no fixed-image overflow;
- both compliance placeholders;
- valid HTTP(S) links/images only;
- exact product-to-image/link/CTA binding.

Standalone output receives a visual review at 820px and 390px for both the
single-product and six-product fictional campaigns.

## CLI contract

The canonical non-interactive interface is:

```bash
punch generate \
  --website "https://example.com" \
  --product "https://example.com/products/product-one" \
  --product "https://example.com/products/product-two" \
  --goal "sales" \
  --output "./campaign"
```

Planned command concerns:

- `--website`, `--goal`, and `--output` are required once;
- repeated `--product` flags preserve order;
- `--instructions` is optional;
- `--offer`, `--discount-code`, and `--offer-ends-at` map to the structured
  `OfferInput`;
- `--trace` enables bounded diagnostic artifacts;
- `--json` writes exactly one stable terminal result to stdout;
- `--force` permits a narrowly recognised Punch output replacement;
- `--no-interactive` disables prompting.

Diagnostics and progress use stderr. Normal text mode may be human-friendly;
JSON mode never emits progress, colour codes, banners, or extra stdout lines.
Complete explicit input always executes without confirmation.

### Guided flow

Recommended final-polish behaviour:

- `punch` starts the guided flow when both stdin and stdout are TTYs and CI is
  not detected;
- `punch generate` with missing required fields under the same conditions seeds
  supplied values and enters the same flow;
- help, CI, non-TTY, piped input/output, `--json`, and `--no-interactive` never
  prompt;
- a complete explicit command never prompts.

The flow collects only:

1. website URL;
2. an ordered, reviewable list of one to six unique product URLs, with add and
   remove actions;
3. a human-readable goal:
   - **Sell existing products** → `sales`: evergreen current-catalogue selling;
   - **Launch new products** → `product-launch`: a new product, collection,
     drop, or restock;
   - **Promote an offer** → `promotion`: an explicit promotion or discount;
4. offer details only for `promotion`;
5. optional instructions;
6. output directory;
7. final confirmation.

Before confirmation it displays the normalised summary, trace state, and
equivalent explicit command. It never asks for secrets, blocks, layout,
typography, colours, model settings, critique behaviour, validation policy, or
subject-line strategy. It calls the same command handler and may be omitted
from `0.1.0` if it stops being a thin input layer.

## Output and failure contract

Valid generation publishes:

```text
campaign/
├── email.html
├── campaign.json
└── validation.json
```

With `--trace`, a valid run may additionally publish:

```text
campaign/trace/
├── manifest.json
├── brand-profile.json
├── product-profiles.json
├── draft.json
├── critique.json
└── revised-campaign.json
```

Stage artifacts appear only when that stage ran; for example,
`revised-campaign.json` is absent when critique did not trigger revision.

`campaign.json` records schema version, status, goal, product IDs, evidence
references, and semantic campaign. `validation.json` records schema version,
`valid`/`invalid` status, deterministic checks, model-assisted claim checks,
errors, and warnings. It never contains credentials or raw page archives.

`trace/manifest.json` records:

- trace schema version;
- redaction-policy version;
- `valid` or `invalid` terminal status;
- stage and prompt-version identifiers;
- the path, media type, byte size, digest, and disposition of each trace
  artifact;
- `valid: false` for any rejected HTML.

Trace files use artifact-specific field allowlists and contain only validated,
normalised structured stage data. They exclude raw HTML, response headers, raw
model/provider requests and responses, free-form completions, environment
values, and error snippets. Secret/PII canaries must be unable to pass through
campaign, validation, error, or trace output.

On final validation failure:

- top-level `email.html` is absent;
- `validation.json` is present;
- `campaign.json` may be present with `invalid` status;
- no trace directory exists unless `--trace` was supplied;
- `trace/rejected-email.html` is permitted only with `--trace` and is explicitly
  invalid in the trace manifest.

Operational failure before a validated result returns a stable CLI error and
leaves no partial final artifacts.

## Safe output publication

The output writer:

1. resolves the destination and parent with directory-scoped, no-follow checks;
2. rejects traversal, symlink components, special files, hard-linked artifacts,
   cross-filesystem staging, and unsafe ownership or permissions;
3. records parent/destination identity and revalidates it immediately before
   publication to detect link swaps or other time-of-check/time-of-use changes;
4. creates a unique sibling staging directory exclusively, with conservative
   permissions, and writes only new regular files;
5. finishes files and directory metadata, validates the complete staged set,
   and publishes a missing destination with one same-filesystem atomic rename;
6. removes only the task-owned staging directory after a failed attempt.

Without `--force`, an existing non-empty output directory is an error. With
`--force`, Punch performs exact-directory replacement, never an in-place file
merge. The existing directory must contain:

- a supported `validation.json` marker with generator name, artifact-schema
  version, terminal status, exact relative artifact list, and digests;
- exactly the artifact set permitted for that status and trace mode;
- only regular, single-link files and a recognised trace directory;
- no unrelated entry, link, special file, or digest mismatch.

The marker alone is insufficient. The writer must revalidate the complete old
set, then use an atomic directory-exchange primitive. If the platform,
filesystem, or runtime cannot guarantee the exchange, `--force` fails closed
and asks for a fresh output path; it never falls back to a two-step backup or
per-file overwrite. The displaced old directory is removed only after a
successful exchange and final identity revalidation.

Fixed provider-call and total-run deadlines share one abort signal. SIGINT and
SIGTERM cancel active fetching/model calls and prevent partial publication.

## Incremental Phase 2 checkpoints

Phase 2 requires separate approval and follows this order exactly:

1. **Semantic schemas and generation engine.** Establish Punch-owned schemas,
   injected provider seam, and emit/critique/revise orchestration.
2. **Valid campaign JSON from a fixed fictional fixture.** Use newly created,
   owned brand/product evidence and no live fetching.
3. **Export-only renderer against the fixture.** Port the eight-block render
   boundary without editor/application dependencies.
4. **Strong standalone HTML without live extraction.** Pass deterministic
   render checks and Plamen's desktop/mobile visual gate.
5. **Connect brand and product extraction.** Add shared hardened fetching,
   deterministic parsing, and model fallback.
6. **Stable product IDs and binding.** Carry explicit identity through all
   product-bearing facts and blocks.
7. **Deterministic cross-product validation.** Prove required-product coverage
   and exact fact/image/link/CTA association.
8. **Explicit CLI and output writer.** Add non-interactive command, stable
   errors, safe paths, artifacts, and optional traces.
9. **Deeper claim validation and revision.** Add source-aware claim evaluation
   and one bounded corrective revision.

Earlier fixed fixtures preserve all products by construction. They are not
evidence that arbitrary multi-product input is safe until checkpoints 6 and 7
pass. The guided CLI is considered only after checkpoint 8 is stable and the
visual/output gates have passed.

Each checkpoint ends with a reviewable commit and its named tests. Do not
collapse all checkpoints into one implementation task.

## Future bootstrap and package gate

The first separately authorised implementation checkpoint must decide and
record:

- package name and registry availability;
- ESM/CommonJS and supported Node versions;
- exact package exports and `punch` binary entry;
- package manager and fresh lockfile;
- formatter, lint, typecheck, and test commands;
- direct runtime and development dependencies;
- licence and notices;
- packed-file allowlist and package-size budget.

The package tarball must exclude `AGENTS.md`, private-source references,
extraction records, tests/fixtures unless intentionally shipped, traces,
environment files, and development-only instructions.
