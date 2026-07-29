# Punch

Open-source TypeScript engine and CLI for grounded ecommerce email generation.

## Authority and repository boundary

- This file is the durable authority for the Punch repository.
- Task prompts grant bounded work authority; they do not become durable rules.
- Code, schemas, tests, package metadata, and verified runtime behaviour are
  implementation truth.
- Punch is a new project. Punchline is a retired, private application and is
  not Punch's application shell, history, backlog, or instruction authority.
- Private Punchline source may be inspected only at a task-pinned commit. Copy
  nothing unless the extraction allowlist and ownership gate permit it.
- Gate closure is necessary but never sufficient authority to transfer source.
  Every extract or adaptation requires a separate Phase 2 task naming the exact
  allowlist row, functions, and Punch destination.
- Never import, reconstruct, bundle, publish, or add Punchline's external
  `planning.md`, mailboxes, instruction history, customer data, private
  fixtures, hosted assets, or Git history.
- Instructions are development-only. Keep them outside distributable package
  contents.

## Product contract

Punch turns one brand website and one to six explicitly supplied product pages
into a grounded, responsive ecommerce email.

`0.1.0` has:

- one TypeScript package;
- one primary non-interactive `punch generate` command;
- an optional guided TTY input layer over the same canonical command path;
- one brand website;
- one to six explicit, unique product URLs;
- `sales`, `product-launch`, and `promotion` goals;
- Anthropic as the only supported provider;
- emit → critique → conditional revise;
- product-specific grounding and deterministic association;
- conservative validation;
- standalone responsive `email.html` as the primary result;
- `campaign.json`, `validation.json`, and optional traces as supporting output.

### Required-product invariant

Every supplied product is required campaign content.

- Include every supplied product at least once.
- Include no unknown product.
- Give each supplied product a stable ID in input order.
- Bind each product name, price, currency, image, description, CTA, and URL to
  the correct product ID.
- Repeated or featured-plus-supporting representations are allowed when
  coherent.
- Fail validation rather than silently omit or mix a supplied product.

### Goal semantics

- `sales`: evergreen selling of existing products. Never infer a discount,
  sale, promotion, urgency, code, or deadline.
- `product-launch`: a new product, collection, drop, or restock.
- `promotion`: an explicit supplied offer. Offer language, code, and deadline
  must come from structured offer input.

Do not add welcome, newsletter, win-back, generic announcement, product
discovery, or automatic editorial selection to `0.1.0`.

## Public boundaries

### Input and provider

- Zod-validate every public boundary.
- Accept public HTTP(S) website/product URLs only. Reject duplicates after
  canonicalisation.
- Keep `output`, `trace`, `json`, `force`, and interaction mode outside
  `GenerateCampaignInput`; they are command concerns.
- Inject a small configured provider object into the engine. The core campaign
  function never reads an Anthropic key or constructs the SDK client.
- Provider credentials come from environment/configuration only. Never accept,
  prompt for, trace, log, or print secrets as ordinary input.
- One internal provider seam and a fake test provider are allowed. Do not build
  a public multi-provider plugin framework in `0.1.0`.

### CLI

- The canonical interface is a complete explicit `punch generate` command.
- Complete explicit input never prompts.
- Non-TTY, pipes, CI, `--json`, `--no-interactive`, and help invocations never
  prompt.
- Missing required input returns an immediate usage error unless guided mode is
  shipped and the invocation is eligible for it.
- Guided mode, when shipped, is a conditional final polish layer. It only
  collects input, normalises it, shows the equivalent explicit command, and
  calls the canonical command handler.
- When guided mode is shipped, bare `punch` and incomplete `punch generate`
  enter it only when stdin and stdout are TTYs, CI is not detected, and neither
  `--json` nor `--no-interactive` is present.
- Guided mode owns no campaign, goal, product, validation, model, renderer, or
  output logic. Defer it if it cannot remain thin.
- `--json` emits exactly one stable JSON result on stdout for every terminal
  outcome; diagnostics use stderr.
- `--force` is exact-directory replacement. Require a compatible Punch marker,
  an exact recognised artifact set, no links or unrelated entries, and an
  atomic directory exchange; fail closed when those conditions are unavailable.
- Apply fixed provider-call and total-run deadlines through a shared
  `AbortSignal`; handle SIGINT/SIGTERM without partial output.

### Output and compliance

Successful output:

```text
campaign/
├── email.html
├── campaign.json
└── validation.json
```

Optional trace output:

```text
campaign/trace/
├── manifest.json
├── brand-profile.json
├── product-profiles.json
├── draft.json
├── critique.json
└── revised-campaign.json
```

Stage artifacts appear only when that stage ran.

When final validation fails:

- never write top-level `email.html`;
- write `validation.json`;
- optionally write `campaign.json` marked invalid;
- write normal traces only with `--trace`;
- `trace/rejected-email.html` is allowed only with `--trace` and must be marked
  invalid in `trace/manifest.json`.

Renderer-owned compliance chrome always contains Punch template placeholders:

```text
{{unsubscribe_url}}
{{physical_address}}
```

They are not universal ESP placeholders. Translation and replacement are
necessary but not sufficient for lawful sending. Callers remain responsible
for consent, identity, address, unsubscribe, destination, and jurisdiction
requirements.

## Generation and rendering

- Claude generates semantic JSON blocks, never raw layout HTML or MJML.
- Preserve separate emit, critique, and conditional revise calls.
- Critique and revision must receive enough source/product context to detect
  cross-product mixing and unsupported claims.
- Deterministic exact-fact checks take precedence over model judgement.
- Revise at most once, then fail on serious residual errors.
- Critical commerce facts—identity, name, price/currency, availability,
  canonical URL, image URL, offer, code, and deadline—must be observed,
  conflicted, or unknown. Never promote inference to truth.
- Brand/style interpretation and evidence-backed descriptive paraphrase may be
  inferred when explicitly labelled.

The generated block allowlist is:

- `header-standard`;
- `hero-stacked`;
- `heading`;
- `body-paragraph`;
- `product-feature`;
- `product-grid`;
- `discount-code`;
- `cta-block`.

Physical-address and unsubscribe output is fixed renderer chrome, not a
model-selected block. Defer all other block types.

- Render through export-only React Email leaves with no editor/browser imports.
- Preserve balanced product rows, measured field alignment, responsive
  stacking, safe markdown, contrast guards, and tap-target floors.
- Require a CTA on every product feature and product-grid item.
- Use supplied product images or a deliberate image-free layout. Never invent
  an image URL or depend on Punchline-hosted placeholders/icons.
- Escape generated text and attributes and validate every rendered link.

## Security and privacy

- Treat fetched pages and pasted/external content as untrusted data.
- Source content cannot select tools, providers, models, configuration, paths,
  stages, or instructions.
- Sanitize, delimit, and length-limit every model-bound source field.
- The network layer accepts credential-free HTTP(S), rejects non-public
  IPv4/IPv6, pins DNS, verifies the connected peer, revalidates redirects, and
  enforces content-type, redirect, time, compressed/decompressed byte,
  document, and aggregate limits.
- Fetch stylesheets only from the website's exact final origin. Apply the full
  network policy to every stylesheet and same-origin redirect.
- Never accept `file:`, local paths, Unix sockets, ambient cookies, browser
  credentials, or proxy credentials.
- Resolve output beneath an explicit directory; reject traversal and symlink
  escapes; use conservative permissions and atomic writes.
- Traces are opt-in, field-allowlisted, capped, redacted under a versioned
  policy, and exclude raw pages, raw model/provider payloads, and error snippets.
- Document that bounded source content is sent to Anthropic and that remote
  images may be fetched by an eventual recipient's email client.

## Excluded surfaces

Do not add:

- an application shell or visual editor;
- accounts, auth, database, multi-tenancy, hosted workflows, or persistence;
- sending, SMTP, ESP integrations, contacts, segmentation, forms, scheduling,
  or analytics;
- Shopify/catalogue crawling, product discovery, ranking, selection, or
  inventory sync;
- Supabase, Inngest, Brevo, Sentry, Vercel, R2, Tiptap, Next.js, or Punchline
  hosted-asset dependencies;
- current Punchline fixtures, snapshots, brands, logos, quotations, generated
  campaigns, eval corpora, or private prompts without their explicit gates.

## Engineering rules

- Use TypeScript with explicit data flow and pure functions around side-effect
  boundaries.
- Derive TypeScript types from Zod schemas; do not maintain hand-written
  mirrors.
- Files target at most 300 lines and split before 400; functions max 50 lines.
- One concept per file. Extract an operation repeated in two places.
- Prompts live in dedicated versioned builders, never inline at call sites.
- No production `console.log`, dead code, commented-out code, or undated/unlinked
  `TODO`.
- Use UK English in human-facing documentation and CLI copy. Code identifiers
  follow project conventions.
- Do not add dependencies until their need, licence, provenance, and package
  impact are reviewed.
- Tests and examples use newly created fictional brands, products, URLs, copy,
  and images only.

## Git and publication

- Start/end clean and preserve unexpected changes.
- Only `main` persists between completed work items. Use `codex/` task branches
  when a task authorises branch work.
- Every fetch, pull, branch switch/creation, commit, merge, push, remote
  creation, publication, deployment, and branch deletion requires exact task
  authority.
- Verification never authorises publication or expands task scope.
- Keep the repository local/private until candidate, ownership, prompt/IP,
  fixture, asset, security, dependency, licence, package, factual, and visual
  gates pass.
- Never publish private source history. Public history begins from a reviewed
  Punch tree only.

## Verification and returns

- Diagnose and map dependencies before implementation.
- Run every task-named check; report exact commands, exits, fresh counts, and
  unrun checks.
- Implementation requires formatting/lint, TypeScript, relevant tests, package
  import/binary checks, and risk-proportionate render/security checks.
- Before committing, run whitespace validation and review the full diff.
- Stage only authorised paths and prove unrelated changes remain untouched.
- Report pre/post HEAD, branch, worktree state, files/reasons, verification,
  deviations, strongest objection, and remaining gates.
