# Phase 2 checkpoint 3

Status: local review candidate. This checkpoint proves a clean-room,
export-only renderer against the fixed checkpoint-2 campaign.

## Authority and boundary

- Approved baseline:
  `20c83ca4f300eda4a1d82751a206c8ed46704a39`.
- Plamen approved checkpoint 2 and authorised continuation into checkpoint 3
  on 29 July 2026.
- This implementation was written independently from Punch's approved public
  schemas, rendering contract, and fictional fixture.
- No private Punchline renderer, style, component, fixture, snapshot, prompt,
  asset, or generated HTML was inspected, copied, or adapted.
- `OWN-1` and `IP-1` remain open for any future private-source transfer. The
  extraction allowlist is not transfer authority.

This checkpoint owns:

- runtime revalidation of unknown campaign input;
- in-memory standalone HTML rendering;
- one exhaustive dispatcher for all eight semantic blocks;
- export-only, presentation-table React leaves;
- fixed neutral render styles and responsive structure;
- restricted inline Markdown;
- stable Punch-owned block, grid, product, image, CTA, and compliance markers;
- renderer-owned compliance placeholders; and
- fixed-fixture structural, escaping, URL, image-free, and geometry tests.

It does not own file output, a public renderer export, CLI, live extraction,
traces, theme extraction, arbitrary-input product binding, deterministic render
validators, browser/email-client proof, visual approval, remote creation,
licensing, or publication.

## Dependency decision

React Email 6 combines its components, render utilities, CLI, and preview
server in the `react-email` package. Punch therefore does not install that
unified package or any deprecated component package. It uses the maintained
Node renderer directly and owns its email-safe React leaves:

| Surface     | Exact version               | Role                          |
| ----------- | --------------------------- | ----------------------------- |
| Runtime     | `@react-email/render@2.1.0` | React tree to standalone HTML |
| Runtime     | `react@19.2.8`              | JSX runtime                   |
| Runtime     | `react-dom@19.2.8`          | server-render peer            |
| Development | `@types/react@19.2.17`      | JSX and React types           |

The decision follows React Email's
[render API](https://react.email/docs/utilities/render) and
[package migration](https://react.email/docs/getting-started/updating-react-email)
guidance. The direct renderer supports Node 20 or newer and React 18/19; Punch's
Node 24-or-newer contract satisfies it. All versions are exact-pinned.

`@types/react-dom` is unnecessary and absent. The lock contains no
`react-email`, deprecated React Email component package, Next.js, Tailwind,
preview server, Socket.IO, Chokidar, Commander, Conf, Babel, MJML, or installed
esbuild node.

## Renderer design

`renderCampaignHtml(input: unknown)`:

1. parses the value with the canonical `CampaignSchema`;
2. rejects campaign content that contains either privileged compliance token;
3. builds one standalone React document;
4. renders with `@react-email/render`; and
5. returns the HTML string without a filesystem or network side effect.

The public root package export deliberately remains schema-only. Renderer files
are compiled into `dist`, but no supported renderer subpath exists until the
standalone-HTML gate determines the final high-level API.

The dispatcher covers exactly:

1. `header-standard`;
2. `hero-stacked`;
3. `heading`;
4. `body-paragraph`;
5. `product-feature`;
6. `product-grid`;
7. `discount-code`; and
8. `cta-block`.

Every leaf uses standard React elements and presentation tables. There is no
browser/client boundary, editor state, free-form HTML, `dangerouslySetInnerHTML`,
CSS chosen by campaign data, external font/icon/placeholder dependency, or
remote request.

## Safety and structure

- The campaign boundary and every final dynamic link/image URL are validated.
- React performs text and attribute escaping.
- Inline Markdown supports only bounded, non-nested bold, italic, and
  credential-free HTTP(S) links.
- Markdown images, escaped link forms, unsupported emphasis, unsafe schemes,
  and URLs containing parentheses remain literal; the parser never turns a
  supported prefix into a changed destination.
- Optional images render as an intentional image-free branch. No empty or
  invented `src` is emitted.
- Product image dimensions account for two-, three-, and four-column cell
  widths, including short centred rows.
- `{{physical_address}}` and `{{unsubscribe_url}}` are fixed renderer chrome,
  appear once in the fixed render, and cannot be supplied again by campaign
  text.
- Stable markers use only schema-validated block IDs/types and product IDs.
- The renderer emits no Punchline host, R2 URL, private attribute, TipTap data,
  placeholder-service URL, or bundled asset.

The current colour, type, spacing, and geometry values are neutral
renderer-owned defaults. `Campaign` has no validated render-theme structure, so
this checkpoint makes no claim that arbitrary output reflects a supplied
brand's visual identity.

## Fixed-fixture proof

The three focused renderer suites use the approved checkpoint-2 Kiln & Leaf
fixture without adding a generated HTML artifact:

- all eight block markers appear exactly once and in blueprint order;
- repeated renders are byte-identical;
- each fixed product scope contains its own exact name, description, displayed
  price, image-marker/URL pair, and CTA-marker/URL pair;
- all rendered dynamic URL attributes are HTTP(S), except the one exact
  renderer-owned unsubscribe placeholder;
- image-free product variants contain no image or placeholder URL;
- escaping and safe/literal Markdown boundaries are exercised;
- malformed, credential-bearing, raw-markup, unknown-block, and reserved-token
  inputs fail before rendering;
- full two-, three-, and four-column rows plus a short final row have scoped,
  explicit row/cell widths and Outlook-oriented numeric image widths; and
- level-three headings and two-action closing blocks render through their
  schema-valid paths.

This is fixture-specific preservation, not general product-binding validation.
Checkpoints 6 and 7 retain that responsibility.

## Dependency and package review

- Lockfile version 3 adds 20 entries: 18 runtime and two development.
- Sixteen new packages are MIT; `domelementtype`, `domhandler`, `domutils`, and
  `entities` are BSD-2-Clause. Every new package contains its licence file.
- Existing `prettier@3.8.3` moves into the production closure because the
  renderer depends on it; it is not duplicated.
- No new package is deprecated, bundled, optional, native-only, platform-bound,
  or marked with an install script. No new package defines
  `preinstall`/`install`/`postinstall`.
- All new lock entries use `registry.npmjs.org` plus SRI integrity metadata.
- A production install adds about 8.98 MiB of new packages and promotes about
  8.21 MiB of existing Prettier files: about 17.19 MiB total.
- The dependency is not bundled into Punch's archive. The footprint and licence
  inventory remain release considerations under `DEP-1` and `LIC-1`.
- `npm audit --audit-level=high` reports zero known vulnerabilities.

Package-lock SHA-256:
`b963a8fdc4f0ebf6e844685c9d049955ce1e3d3607ba3e75523d564dc659b4d1`.

The exact rebuilt package has 89 entries, is 33,200 compressed bytes and
284,993 unpacked bytes, bundles no dependency, and contains only `dist` plus
`package.json`. Archive SHA-256:
`69e34db16b87ba32e9f8081904969cfb5b153a65d074a0488e7e8e1846864d1b`.

Its category-only scan found no binary, credential shape, email address,
environment value, absolute private path, private-project reference,
development instruction, test, fixture, trace, document, or environment file.

## Verification record

Fresh verification on 29 July 2026:

- `npx vitest run tests/rendering`: three files and ten tests passed.
- `npm run check`: formatting, lint with zero warnings, TypeScript, all ten test
  files with 80 tests, and the distributable build passed.
- `npm ci --ignore-scripts`: 150 packages installed with scripts disabled and
  zero known vulnerabilities.
- Built root import smoke: canonical schemas load and the renderer is absent
  from the root export.
- Built internal renderer smoke: the fixed campaign reparses, renders twice to
  identical 11,354-byte standalone HTML, and begins with a doctype.
- Unsupported package subpath smoke returns
  `ERR_PACKAGE_PATH_NOT_EXPORTED`, as intended.
- `npm ls --all` reports no dependency problem.
- `npm audit --audit-level=high` reports zero known vulnerabilities.
- The exact archive contents, size, allowlist, hash, and category-only scan pass.
- The exact 27-file delta scan found no binary, credential shape, absolute
  private path, or oversized file. One email-shaped userinfo test and
  Punchline/R2 negative-test and internal-gate references were manually
  classified as deliberate non-package evidence.
- Independent renderer review found no remaining priority-1 or priority-2
  issue after Markdown, product-association, grid-geometry, and file-size
  objections were resolved.
- `git diff --check` passes.

No browser, live website, live provider, email client, output writer, CLI, or
visual check ran because those surfaces are outside this checkpoint.

## Limits and next gate

Checkpoint 4 owns a strong standalone-email candidate, deterministic contrast,
font, CTA-height, byte, link, column, overflow, compliance, and binding render
checks, plus real 820px and 390px image/image-free review and Plamen's visual
approval.

The neutral fixture renderer does not prove brand reflection, broad email-client
compatibility, mobile quality, acceptable visual rhythm, arbitrary product
binding, or lawful send readiness. `DEP-1`, `LIC-1`, `PKG-1`, `SEC-4`, `QA-1`,
`VIS-1`, remote creation, and publication remain open, deferred, or held.
`P2-C3` remains open until Plamen reviews the exact local checkpoint commit.
