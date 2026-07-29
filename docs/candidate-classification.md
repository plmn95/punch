# Punch candidate classification

Status: Phase 1 classification at private source commit
`1853897ce1325de262cc3b5b9a430abe0452d8ad`.

This document classifies what may inform Punch. The closed file/function
boundary is in `docs/extraction-allowlist.md`; where the two differ, the
allowlist is narrower and therefore controlling.

## Classification meanings

| Class   | Meaning                                                                                                                                                        |
| ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Extract | A named pure surface may transfer after exact ownership/IP clearance, a pre-transfer ledger entry, and separate task authority; publication gates still remain |
| Adapt   | Preserve verified behaviour, but change types, boundaries, dependencies, wording, or architecture for Punch                                                    |
| Rewrite | Treat current behaviour as evidence only; create new Punch implementation without copying source text                                                          |
| Exclude | Do not place the material in Punch                                                                                                                             |
| Hold    | Do not transfer until a named gate produces affirmative evidence and an exact disposition                                                                      |

No classification itself grants transfer or publication authority.

## Source-code classification

### Extract after ownership clearance

Only these pure surfaces are extract candidates:

- prompt-text sanitisation;
- bounded JSON cleaning and truncated-JSON repair;
- WCAG contrast calculations and readable-colour selection;
- CTA padding needed for a 44px minimum tap target;
- measured-zone text-height estimation.

Their exact source files, functions, and hashes are recorded in the extraction
allowlist. Focused private tests establish useful behaviour but are not
themselves copy candidates.

### Adapt

The following mature behaviours should survive behind Punch-owned boundaries:

- one hardened public HTTP fetch layer for website, product, and
  exact-final-origin CSS;
- deterministic-first brand and product extraction with model fallback;
- colour, font, logo, voice, and provenance composition;
- JSON generation with one bounded repair path;
- emit → critique → conditional revise orchestration;
- compact brand/source context assembly;
- multi-product hierarchy, feature-plus-supporting structures, balanced grids,
  measured field alignment, responsive stacking, and Outlook-safe image sizing;
- palette, contrast, typography, Markdown, CTA, and layout safeguards;
- deterministic DOM/render checks independent of the private eval system.

Adaptation must remove Punchline application dependencies and must add:

- one-to-six required product IDs in input order;
- per-product fact, link, image, and CTA binding;
- explicit unknown/conflict states;
- `sales`, `product-launch`, and `promotion` semantics;
- injected provider and shared cancellation/deadline handling;
- export-only rendering with eight blocks;
- fixed neutral compliance chrome;
- deliberate image-free layouts rather than hosted placeholder art;
- stable Punch-owned validation markers.

### Rewrite

The following require new Punch-owned implementations:

- public input, offer, product, brand, evidence, campaign, validation, trace,
  and result schemas;
- the `TextModel` seam and Anthropic adapter;
- provider errors, deadlines, credentials, and usage reporting;
- goal definitions and CLI copy;
- product identity and cross-product binding;
- global claim-support and image-provenance logic;
- prompt version registry;
- renderer context, blueprint union, deterministic block IDs, and compliance
  chrome;
- editor-coupled block leaves and safe Markdown rendering;
- output writer, safe overwrite recognition, atomic publication, CLI, JSON
  result envelope, and optional guided flow;
- the evaluation fixture set and all automated tests.

Rewrite means no source-text transfer. Behavioural comparison against the
private source remains permitted at the pinned commit.

### Exclude

Exclude all unfinished or application-specific surfaces:

- Next.js pages, routes, Server Actions, middleware, proxy handlers, and
  application shell;
- Supabase, authentication, accounts, database schemas, tenant state, storage,
  and persistence;
- Inngest functions and hosted workflow state;
- Brevo, ESP connections, campaigns, contacts, sending, forms, automations, and
  analytics;
- Sentry, Vercel, R2, AWS signing, hosted icon routes, image rasterisation, and
  application deployment;
- draft editor, TipTap, browser state, selection, reducers, preview affordances,
  block factories, and inline editing;
- onboarding, settings, localisation, dashboard, galleries, and system emails;
- non-approved email blocks and the existing social/legal footer;
- `proxy-fetch.ts`, browser credentials, ambient cookies, and application
  fetch proxies;
- external `planning.md`, repository mailboxes, instructions, private Git
  history, branches, commits, and source lockfile.

## Prompt and model-material classification

All current prompt bodies are `Hold`, including:

- block catalogue;
- emit, critique, and revise;
- brand voice extraction;
- product-extractor fallback prompt;
- faithfulness/claim evaluation;
- prompt tests, snapshots, expected strings, and historical version notes.

Before a prompt is transferred or adapted, the prompt/IP gate must establish:

1. who authored it and under what assignment;
2. whether it may be intentionally released under Punch's chosen licence;
3. that it contains no customer material, private eval language, real-brand
   copy, Punchline-only assumptions, or internal operational detail;
4. an exact source hash, destination, and disposition;
5. a reviewer-approved Punch rewrite where transfer is unnecessary.

Default disposition is to write new prompts from Punch's public schemas and
ratified behaviour. Prompt architecture may be preserved; literal wording is
not presumed transferable.

## Fixtures, tests, and evaluation material

| Material                                                              | Classification       | Reason and replacement                                                                                      |
| --------------------------------------------------------------------- | -------------------- | ----------------------------------------------------------------------------------------------------------- |
| Private eval corpus, ratings, results, sidecars, and generated emails | Exclude              | Customer/real-brand provenance and redistribution are not cleared; create fictional evaluations             |
| Block `*.fixtures.ts` files                                           | Exclude              | They contain private or real-brand-derived names, copy, URLs, and palettes                                  |
| Renderer snapshots                                                    | Exclude              | They preserve corpus-derived emails and Punchline-hosted references                                         |
| Gallery fixtures and development previews                             | Exclude              | They include real-brand palette studies and third-party placeholder services                                |
| Existing tests                                                        | Rewrite              | Recreate assertions with newly fictional products, brands, domains, and copy                                |
| Security test behaviour                                               | Adapt as a test plan | Recreate public/private IP, DNS rebinding, redirect, size, MIME, timeout, injection, and cancellation cases |
| Render test behaviour                                                 | Adapt as a test plan | Recreate single/six-product desktop/mobile, contrast, CTA, weight, row, compliance, and binding checks      |

The minimum newly fictional evaluation set is:

1. a strong single-product campaign;
2. a strong multi-product campaign;
3. sparse product information;
4. conflicting product price or currency;
5. a deliberately unsupported generated claim;
6. malicious source instructions or prompt injection.

The multi-product fixture must prove that every supplied product is present,
facts do not cross product IDs, image/link/price associations remain exact, and
the campaign has a coherent hierarchy.

## Asset classification

All existing source assets are excluded:

- `public/**`;
- favicons, application icons, logos, screenshots, and design exports;
- email snapshots and compiled system templates;
- hosted Punchline/R2 icons and URLs;
- Picsum, `placehold.co`, or other third-party placeholder references;
- real-brand palettes, fonts, logos, product imagery, and copied specimen
  material;
- `docs/email-design-language.md` as transferable content.

Punch `0.1.0` does not require bundled product or brand imagery. Future
documentation imagery, if any, must be newly created and have a provenance
ledger recording creator, source, licence, modifications, and redistribution
rights.

## Dependency classification

No dependency is installed or approved in Phase 1. The following is a
provisional need-and-licence review, not a dependency decision or legal
conclusion.

| Candidate                           | Provisional purpose                               | Phase 1 disposition                                                         |
| ----------------------------------- | ------------------------------------------------- | --------------------------------------------------------------------------- |
| TypeScript                          | Public package and CLI implementation             | Consider after package/toolchain gate                                       |
| Zod                                 | Runtime schemas and type derivation               | Consider; preserve one-schema source of truth                               |
| Anthropic TypeScript SDK            | Sole `0.1.0` provider adapter                     | Consider only behind injected `TextModel`                                   |
| React and React DOM                 | Export renderer runtime                           | Consider                                                                    |
| React Email                         | Semantic email primitives and Node HTML rendering | Consider the smallest direct package surface; do not inherit its dev server |
| Marked or a smaller Markdown parser | Restricted bold/italic/link rendering             | Compare against a tiny restricted parser and output/supply-chain cost       |
| Cheerio                             | Deterministic extraction and HTML validation      | Consider                                                                    |
| `domhandler`                        | DOM element types used by current checks          | Declare directly if retained, or remove the direct import                   |
| Vitest                              | Unit and integration tests                        | Consider as development-only                                                |
| Prettier                            | Consistent formatting                             | Consider as development-only                                                |
| A CLI argument parser               | Explicit command parsing and help                 | Select after comparing size, maintenance, and licence                       |
| A terminal prompt library           | Optional guided flow                              | Defer until explicit CLI is stable; omit if the guided layer is not small   |

Licence status is intentionally unresolved in Phase 1. Exact selected versions,
direct and transitive licences, notices, install scripts, maintenance status,
vulnerabilities, and packed size require a fresh candidate lockfile review.

Exclude application dependencies by default, including Next.js, Supabase,
Inngest, Sentry, Brevo clients, AWS/R2 helpers, TipTap, application UI/icon
packages, `sharp`, and `resvg`.

## Classification review result

The mature engine value is retained: multi-product generation, emit → critique
→ revise, semantic composition, brand/product extraction, product image
provenance, responsive rendering, and claim evaluation all have a bounded path
into Punch.

The strongest remaining objection is not technical. Read access and a pinned
hash do not prove copyright ownership, contractor assignment, or
redistribution rights. No source transfer or public licence may occur until
the ownership and prompt/IP gates are affirmatively closed.
