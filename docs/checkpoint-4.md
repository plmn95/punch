# Phase 2 checkpoint 4

Status: local review candidate. This checkpoint turns the clean-room renderer
into a strong standalone-email candidate, adds fail-closed render validation,
and supplies exact desktop/mobile visual evidence for Plamen's gate.

## Authority and boundary

- Approved baseline:
  `ce0e9305181579d599a64a2171bc9c7a0a54e638`.
- Plamen approved checkpoint 3 and authorised continuation into checkpoint 4
  on 29 July 2026.
- The work remains an independent Punch implementation based on the approved
  public schemas and renderer contract.
- No private Punchline renderer, style, component, fixture, snapshot, prompt,
  asset, or generated campaign was inspected, copied, or adapted.
- The two checkpoint fixtures, their copy, brands, products, URLs, and
  temporary review images were newly created for Punch.

This checkpoint owns:

- a coherent neutral visual hierarchy for single- and six-product campaigns;
- intentional image and image-free product presentation;
- one featured product plus a balanced two-column supporting grid;
- mobile stacking and email-safe desktop table geometry;
- deterministic final-HTML validation with eight stable check identifiers;
- validator adversarial tests for association, role, style, resource,
  compliance, byte, image, and grid mutations;
- real 820px and 390px browser review for all four fixture states; and
- exact local visual evidence for Plamen's `P2-C4` and `VIS-1` decisions.

It does not own brand/theme extraction, arbitrary generated-campaign
evaluation, broad email-client certification, file output, a public renderer
export, live extraction, provider work, CLI, traces, remote creation,
licensing, publication, or any later checkpoint.

## Renderer quality

Punch owns a closed neutral render theme rather than exposing user-selectable
layout or style controls. The output uses:

- a 600px desktop email container and a full-width 390px mobile container;
- Georgia-led display type with system-sans supporting copy;
- warm neutral canvas/card surfaces and a restrained clay action colour;
- 48px rendered actions against a 44px deterministic minimum;
- measured product-copy regions so desktop card actions align;
- a full-width featured-product treatment;
- paired supporting-product rows with a centred short final row;
- deliberate bordered cards when images are absent;
- 14px-or-larger content type and 12px-or-larger compliance type;
- one light colour-scheme declaration and responsive stacking CSS; and
- renderer-owned physical-address and unsubscribe chrome after the campaign.

The renderer still uses presentation tables, inline styles, numeric image
widths, ordinary HTTP(S) images, and conservative CSS. Rounded corners and
shadows are progressive enhancement; the bordered rectangular hierarchy
remains usable when an email client removes them.

## Newly fictional fixtures

| Fixture               | Campaign shape                    | Reserved host             | SHA-256                                                            |
| --------------------- | --------------------------------- | ------------------------- | ------------------------------------------------------------------ |
| `single-product.json` | One featured product              | `soft-orbit.example.com`  | `441c3aacce3eebbc5255a9eb1694bca409a7cb4b0ad83e48c57f79e59f3829de` |
| `six-product.json`    | One featured plus five supporting | `quiet-relay.example.com` | `8a23ae8184ccb5ad337da8eb07e243f4210c8af81a12919fa61e1b171d34df83` |

Recursive fixture traversal found four and fourteen URLs respectively. Every
URL is credential-free HTTPS on the fixture's exact reserved host. No customer,
real-brand, personal, private-evaluation, bundled image, binary, base64, or
remote runtime dependency is present.

The six-product hierarchy is:

1. campaign header and introduction;
2. one featured Anchor Notebook;
3. five supporting products in input order;
4. two complete desktop rows plus one centred short row;
5. one campaign-level conclusion; and
6. renderer-owned compliance chrome.

Every supplied fixture product remains represented with its own name,
description, amount/currency display, CTA label/link, and optional image
alt/source. Image-free variants preserve the same hierarchy without emitting
an empty, invented, or placeholder image.

## Deterministic render validation

`renderCampaignHtml` validates its final generated HTML before returning it.
Failure reports only stable check identifiers and never retains campaign text
or HTML in the error.

| Check ID          | Fail-closed requirement                                                                                                                                                                                |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `contrast`        | Every marked text leaf has a compatible closed role, actual inherited foreground/background colours, and the applicable WCAG ratio; non-text exemptions require their exact element/ownership context. |
| `font-floor`      | Actual inline sizes meet the content/compliance floors; the hidden preheader is exact; every responsive font declaration is pixel-based and meets the floor; shorthand or unsupported units fail.      |
| `cta-height`      | Every CTA is an anchor with both exact CTA and text-role markers, supported pixel geometry, at least 44px calculated/minimum height, and the renderer's height marker.                                 |
| `html-bytes`      | UTF-8 output is no more than 102,400 bytes.                                                                                                                                                            |
| `grid-geometry`   | Grid count, row count, columns, direct `td` ownership, no spans or alternate cells, cell widths, exact image inventory, roles, sources, alts, and responsive width safeguards match the campaign.      |
| `compliance`      | The two owned placeholders appear exactly once, after all generated blocks, inside the fixed compliance scope.                                                                                         |
| `resource-urls`   | Generated attributes and style resource declarations stay inside the closed HTTP(S)/placeholder policy; userinfo and unsupported URL forms fail.                                                       |
| `product-binding` | Every product scope has its exact campaign name, description, displayed price, CTA label/link, image state, alt/source, and association; extra, missing, swapped, or mixed presentations fail.         |

Adversarial review found and closed bypasses involving visible marker-like
copy, low-contrast ancestor backgrounds, removed or substituted text/CTA
roles, responsive `rem` and font shorthand, unmarked or spanning cells,
oversized and extra valid-role images, extra CTAs, swapped facts/links/images,
credential-bearing URLs, and oversized UTF-8 output.

## Canonical render proof

The production build renders every fixture state byte-identically on repeated
calls and passes all eight checks:

| Fixture/state              | Bytes  | SHA-256                                                            |
| -------------------------- | ------ | ------------------------------------------------------------------ |
| Single product, image      | 8,655  | `85cb0a48a445f54118ea070f0800b30bccf6109bcd9a528f73a143859b570165` |
| Single product, image-free | 8,310  | `910a6a2694f5251a7539b2aa2877fb803246f4f6d6b2e46d182cc67c252b315c` |
| Six products, images       | 22,293 | `a288a20affe2a7c8d1a342c0ebe9ce771ec4b8c042a707f48e34cefbf93581b1` |
| Six products, image-free   | 20,354 | `5777a90d36104d49a35e3275a4fe0fb8963df3d0db0dbb343dbba54494144439` |

## Browser and visual proof

The review harness first renders and validates the canonical production HTML.
For image states only, it replaces the exact fixture product-image `src`
attributes with newly generated in-memory local SVGs. Reversing those
allowlisted substitutions reproduces the canonical HTML byte for byte. Copy,
links, styles, structure, validation markers, and all non-image attributes are
unchanged. The SVGs and harness are temporary and are not repository or package
content.

In-app browser inspection at 820px and 390px passed all eight states:

- desktop container width is exactly 600px; mobile width is exactly 390px;
- document scroll width equals viewport width with no horizontal overflow;
- image counts are `1`, `0`, `6`, and `0`; all images load inside their owning
  product;
- CTA counts are `2`, `2`, `7`, and `7`; every CTA is 48px high and inside the
  email;
- product order is exact in both widths;
- copy regions are unclipped;
- paired desktop CTA positions align with zero measured delta;
- mobile grid cells compute to `display:block` without overlap;
- the short desktop row remains centred;
- compliance follows the final generated block;
- no browser console warning or error was emitted; and
- the unique Pebble Weekender product action was clickable and attempted its
  exact reserved-host destination.

The in-app browser's PNG writer exposed an intermittent 2× crop defect even
though its DOM metrics passed. Those defective files were rejected. Final PNGs
were recaptured from the same local review HTML through Chrome's debugging
protocol with explicit 1× device metrics and exact CSS viewport widths. All
eight were then inspected visually.

| Evidence file               | Dimensions | SHA-256                                                            |
| --------------------------- | ---------- | ------------------------------------------------------------------ |
| `single-image-820.png`      | 820×1521   | `51225f7de8cd1b6446572911f7d936a43fc70c03fc2e19b5a1ee59f1b34628f5` |
| `single-image-free-820.png` | 820×1164   | `6e2f9a29fda9573e7289dd1062ec0ea26160db032a3c2ef61ea00820a751c2c2` |
| `six-image-820.png`         | 820×2988   | `f04740144020937dfe097fd06c059ef62baa0869740ef690c144c46ea3305279` |
| `six-image-free-820.png`    | 820×2134   | `3dba36ff503d2e68aa324d6d476401b77fd725420c8cb2c21e59c419353eaa75` |
| `single-image-390.png`      | 390×1488   | `ebdfc12f0ab1e855c1b27e99f94caade17c71f7452adcf660a5bfff01482fa82` |
| `single-image-free-390.png` | 390×1250   | `51b13e6fd9b447fe64019f78fbe3377a300c581e28bb50d5f66ec516953bdad1` |
| `six-image-390.png`         | 390×4008   | `6ea6fb731fdda45ed7b5458b5659a8d2d73aeea8d68fe3090fe273c6aba16368` |
| `six-image-free-390.png`    | 390×2574   | `67272f167352015b01eed36eafab7eea87421a62511d183dd096abf4b01f9a92` |

## Package and verification record

Fresh verification on 29 July 2026:

- focused renderer/validator verification: six files and 32 tests passed;
- `npm run check`: formatting, lint with zero warnings, TypeScript, all 13 test
  files with 102 tests, and the production build passed;
- `npm ci --ignore-scripts`: 150 packages installed with lifecycle scripts
  disabled and zero known vulnerabilities;
- `npm ls --all` exited successfully;
- `npm audit --audit-level=high` reported zero known vulnerabilities;
- built root import smoke found 16 schema exports and no renderer or validator
  public export;
- built internal single/six renderer smoke passed all eight checks and repeated
  byte identity;
- AST inspection found no function over 50 lines and no affected source file
  over 300 lines;
- fixture, private-reference, secret/PII, remote-dependency, binary, and package
  boundary reviews passed independently; and
- two independent final senior reviews returned `PASS` for renderer quality and
  validator bypass resistance.

`package.json`, the lockfile, dependency versions, build configuration, and
root export map are unchanged from checkpoint 3. The exact archive contains 113
files, only `dist` plus `package.json`, is 47,020 compressed bytes and 338,145
unpacked bytes, and has SHA-256
`2d2c958969f47c597bf7342613c22a40f01c85cc2d7e84b3a63b767533b9ed36`.
Its category-only scan found no test, fixture, document, trace, development
instruction, binary, absolute private path, private-project reference, email
address, credential assignment, environment read, or unrecognised path.

## Limits and next gate

This is a neutral Chrome-reviewed standalone-email candidate, not proof of
brand reflection or broad Gmail, Outlook, Apple Mail, Yahoo, dark-mode, or
assistive-technology behaviour. Known non-blocking client risks are Outlook
table-margin differences, the absence of an `mso-hide:all` preheader
enhancement, and loss of radius/shadow decoration.

The fixture proof does not establish arbitrary-input extraction, generation,
fact conflict handling, unsupported-claim rejection, or all six release
evaluations. Compliance placeholders still require caller translation and
lawful sending responsibilities. `FIX-1`, `DEP-1`, `SEC-4`, `PKG-1`, `QA-1`,
licensing, remote creation, and publication remain open, deferred, or held.

`P2-C4` and `VIS-1` remain open until Plamen reviews the exact local commit and
these eight rendered states. No later checkpoint is authorised by this record.
