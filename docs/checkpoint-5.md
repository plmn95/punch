# Phase 2 checkpoint 5

Status: approved checkpoint. This checkpoint connects independently written
brand and product extraction to the existing semantic generation engine.

## Authority and boundary

- Approved baseline:
  `205236ec9ad0b1c196c222ed19ac46e560d0f831`.
- Plamen approved checkpoint 4 and its exact visual evidence, then authorised
  continuation into checkpoint 5 on 29 July 2026.
- Plamen approved the exact checkpoint-5 commit
  `f6976d1b0081626f18e6e18a4c932a3420c2919c` on 29 July 2026.
- The implementation was written from Punch's public contracts and newly
  fictional tests.
- No private Punchline source, prompt, fixture, snapshot, asset, campaign, or
  application code was inspected, copied, or adapted.

This checkpoint owns:

- one hardened fetch session shared by website, product, and stylesheet input;
- deterministic brand and product extraction with typed evidence;
- bounded, inert HTML, JSON-LD, metadata, visible-text, and CSS processing;
- optional model-assisted brand-tone classification;
- input-order product IDs in the generation context;
- grounding instructions in emit, critique, and revise prompts;
- one internal extraction-to-generation pipeline; and
- adversarial fetch, parser, cancellation, fallback, and integration tests.

It does not own arbitrary extracted-input rendering, checkpoint-6 end-to-end
product-to-block binding enforcement, checkpoint-7 cross-product validation,
deeper claim evaluation, one total extraction-plus-generation deadline, a live
provider adapter, output writing, CLI, traces, public extraction exports,
remote creation, licensing, or publication.

## Hardened public fetch boundary

The fetcher uses Node's low-level HTTP, HTTPS, DNS, stream, and compression
primitives. It does not use a browser, global fetch, ambient cookies,
authentication, a proxy, or connection pooling.

For every initial URL and redirect it:

1. parses a credential-free HTTP(S) URL and removes its fragment;
2. rejects single-label and listed local/reserved hostnames plus alternate
   numeric and non-public literal addresses;
3. resolves both address families and rejects the hostname if any answer is
   non-public;
4. deterministically pins one accepted address;
5. connects directly to that address while retaining the original `Host` and
   TLS server name;
6. verifies TLS certificates for HTTPS and compares the connected peer with
   the pinned address;
7. re-resolves and revalidates every redirect; and
8. rejects downgrade, loop, private-target, and policy-escaping redirects.

Stylesheets are discovered only from the final website document and fetched
only from that document's exact origin, including scheme and effective port.
CSS imports and every other resource are ignored. A failure isolated to one
optional stylesheet is omitted; aggregate, document-count, cancellation, and
total-session failures stop the extraction.

The non-configurable production budgets are:

| Boundary                     | Limit                       |
| ---------------------------- | --------------------------- |
| Entire fetch session         | 45 seconds                  |
| One logical document         | 10 seconds                  |
| Idle socket/body progress    | 5 seconds                   |
| Redirects per document       | 5                           |
| Logical documents            | 15                          |
| Concurrent documents         | 3                           |
| DNS answers                  | 16                          |
| Response headers             | 16 KiB and 64 fields        |
| HTML compressed/decompressed | 2 MiB / 4 MiB               |
| CSS compressed/decompressed  | 512 KiB / 1 MiB             |
| Aggregate compressed         | 8 MiB                       |
| Aggregate decompressed       | 24 MiB                      |
| Content encodings            | identity, gzip, br, deflate |

Only status `200` terminal responses are accepted. Redirect statuses are
restricted to `301`, `302`, `303`, `307`, and `308`. HTML accepts
`text/html` or `application/xhtml+xml`; styles accept `text/css`. Duplicate or
contradictory framing, unsupported encodings or charsets, declared-length
mismatches, slow streams, excess headers, and compressed or decompressed excess
fail with fixed safe errors.

Document and session timeouts have distinct codes. This prevents the total
fetch deadline from being mistaken for an optional stylesheet timeout and
allows no later model work after the session budget expires. Abort-registration
races are covered across DNS, request gating, document and provider deadlines,
and body collection.

## Deterministic extraction

Required website and product documents are fetched concurrently under the same
session. Product slots receive `product-01` through `product-06` before network
work, and `Promise.all` result order preserves the supplied URL order.
Extraction fails when a required document fails or when either a product's
final canonical URL or name is not observed.

Source selection is intentionally tiered:

- a product uses one exact-final-URL JSON-LD `Product` record;
- a sole unbound `Product` record may be used only when it declares no identity;
- product records are never combined; one exact URL match may be selected from
  several records, while multiple exact matches, a sole mismatched or
  invalid-identity record, and otherwise ambiguous sets are rejected;
- product Open Graph metadata and visible `h1` text are fallbacks when the
  bound JSON-LD tier does not supply that field;
- a brand uses one final-origin-bound JSON-LD `Organization` or `WebSite`
  record, or one sole identity-free record, then brand-labelled metadata or DOM
  fallbacks; and
- lower tiers do not replace a field successfully supplied by a higher tier.

Conflicts are preserved for defined peer candidate sets such as multiple Open
Graph titles/descriptions, DOM logo candidates, and offer commerce values.
Ranked image alternatives select the first valid observed URL. Price/currency
and availability additionally compare JSON-LD and product metadata because
their semantic equality is exact. Amount and currency remain one atomic value.
Equivalent decimals such as `39` and `39.00` merge without changing the first
observed display value; genuinely different pairs remain conflicted.

Missing price, currency, availability, image, description, brand name, logo,
palette, font, or voice remains explicitly unknown. Product critical facts are
never model-generated. Colours and explicit non-system primary fonts are
labelled inferred and cite only the style sources that contributed to them.

Before materialising parser structures, Punch applies these additional limits:

| Parser input                 | Limit                                                |
| ---------------------------- | ---------------------------------------------------- |
| HTML structure               | 50,000 tokens and nesting depth 128                  |
| JSON-LD scripts              | 32 scripts, 64,000 UTF-16 code units and UTF-8 bytes |
| JSON-LD traversal            | 64 records and 256 visits; overflow fails closed     |
| CSS structure                | 20,000 tokens, depth 64, 16,384-code-unit raw span   |
| CSS declaration value        | 4 KiB                                                |
| CSS colour/font values       | 32 per source                                        |
| Model-bound visible segments | 24 segments, 1,000 bytes each, 20,000 bytes total    |

Fixed non-content elements, nested script/style content, and elements marked by
`hidden`, `aria-hidden`, inline `display:none`, or inline `visibility:hidden`
are excluded from visible text. Model-bound text is normalised, selected
invisible, control, and bidi-formatting characters are removed, and
prompt-delimiter characters are escaped.

## Model boundary and generation connection

Model assistance is deliberately smaller than deterministic extraction:

- it runs only when brand voice is unknown and bounded visible segments exist;
- it chooses one to four traits from a closed ten-trait enum;
- it cites one to three existing segment IDs;
- Punch constructs the neutral summary locally;
- free-form facts, claims, names, commerce values, URLs, and extra fields are
  rejected; and
- provider failure or invalid JSON leaves voice unknown while recording exactly
  one safe usage entry.

The extraction prompt is versioned as `punch.extract-brand.v1`. Generation
prompts advance to `punch.emit.v2`, `punch.critique.v2`, and
`punch.revise.v2`. They instruct the model to use critical facts only when
observed, never select conflicted candidates, omit unknown values rather than
guess, and treat inferred voice as tone guidance rather than factual support.

Provider call, deadline, and prompt-serialisation helpers move from generation
into the internal provider seam so extraction and generation use one safe
implementation. Generation error accounting ignores extraction-only stages
rather than misclassifying them.

The internal pipeline parses canonical input, extracts evidence, and invokes
the unchanged emit → critique → conditional revise engine with the same model
and caller signal. It does not render, write files, or expand the root package
API. The newly fictional Steady Signal/Signal Lamp integration test proves
product ID, name, price/currency, source URL, and context reach emit and
critique without a live network or provider.

## Dependency and package review

Three exact direct dependencies are added:

| Package               | Kind        | Reason                                      |
| --------------------- | ----------- | ------------------------------------------- |
| `htmlparser2@8.0.2`   | runtime     | inert HTML token preflight and DOM parsing  |
| `postcss@8.5.24`      | runtime     | inert bounded declaration parsing           |
| `@types/node@24.12.2` | development | native network, stream, compression typings |

`htmlparser2` and its exact runtime closure were already present through the
renderer at the same versions and integrities. `postcss`, `nanoid`,
`picocolors`, and `source-map-js` retain their exact versions and integrities
while moving from development-only to runtime. `@types/node` and
`undici-types` are the only new graph entries and remain development-only.

The added or promoted reviewed closure uses MIT, BSD-2-Clause, BSD-3-Clause, or
ISC licences and each package includes a licence file. Its lock entries record
no consumer install script. Published htmlparser2-family metadata includes
source-package `prepare` scripts, but no registry install hook. All reviewed
lock entries use the npm registry plus integrity metadata.

Package-lock SHA-256:
`3ae1e6020b3d6b63241f1aeb9ebb39b287b889b17db8d262ec91deef3b841ec3`.

Two consecutive final package packs are byte-identical. The exact archive has
177 entries: 88 JavaScript files, 88 declaration files, and `package.json`. It
is 80,069 compressed bytes and 455,105 unpacked bytes, bundles no dependency,
and contains only `dist` plus `package.json`. Archive SHA-256:
`f89ac05c11910999fcec756340c114da3ad2ab2a0ae89cc4c052b0f6a4ed84a9`.

The package remains private and unlicensed, has no binary, and exposes only 16
root runtime values: 15 schemas plus `SCHEMA_VERSION`. Extraction, providers,
prompts, and the internal pipeline are physically present in `dist` but have no
supported package subpath; `punch-email/extraction` returns
`ERR_PACKAGE_PATH_NOT_EXPORTED`.

Archive scans found no document, test, fixture, instruction, trace, source map,
binary, absolute private path, private-project reference, email address,
credential assignment, environment read, or bundled asset.

## Verification record

Fresh verification on 29 July 2026:

- focused extraction, integration, and provider-deadline verification: ten
  files and 98 tests passed;
- `npm run check`: formatting, lint with zero warnings, TypeScript, all 23 test
  files with 200 tests, and the distributable build passed;
- `npm ci --ignore-scripts`: 152 packages installed with lifecycle scripts
  disabled; 153 packages audited with zero known vulnerabilities;
- `npm ls --all` and dependency-explanation checks exited successfully; listed
  unmet entries are optional development-tool integrations;
- `npm audit --audit-level=high` reported zero known vulnerabilities;
- built root import smoke exposed 15 schemas plus `SCHEMA_VERSION` and no
  extraction, pipeline, generation, renderer, or fetch export;
- unsupported extraction subpath smoke returned
  `ERR_PACKAGE_PATH_NOT_EXPORTED`;
- all 88 source files are at most 300 lines and every source function is at
  most 50 lines;
- exact package, binary, private-reference, absolute-path, credential-shape,
  email-shape, and environment-read scans passed after manual classification
  of fictional rejection canaries;
- `git diff --check` passed; and
- independent read-only grounding, security, and dependency/package reviews
  returned PASS after their objections were closed.

The first sandboxed focused run could not bind its two task-owned loopback
servers and failed only with `EPERM`. The authorised host run passed every
test. No live website, provider, Git remote, external TLS endpoint, email
client, CLI, or campaign output writer/path surface was exercised because those
surfaces are outside this checkpoint.

## Limits and next gate

`SEC-2` closes on the hardened-fetch implementation, adversarial matrix, and
independent security review. Plamen's approval of exact commit
`f6976d1b0081626f18e6e18a4c932a3420c2919c` closes `P2-C5`.

The strongest remaining factual gate is `SEC-4`: checkpoints 6 and 7 must
prove required single- and six-product coverage and exact name, fact, image,
link, and CTA binding for arbitrary extracted input. Broader field-specific
inconsistency policy also belongs there.

Observed logo and product-image URLs receive generic credential-free HTTP(S)
validation but are not fetched or public-address validated in this checkpoint.
They must receive the appropriate boundary before arbitrary extracted evidence
can reach rendering/export or an image-proxy path.

`SEC-3` remains open for the full malicious-source evaluation and deeper
source-aware claim validation. `SEC-6` remains open for one total
extraction-plus-generation deadline and later CLI, credential, output, and trace
canaries. The HTTPS transport retains original-host SNI and certificate
verification by source inspection, but release hardening still needs a live
certificate fixture.

`FIX-1`, `DEP-1`, `PKG-1`, `LIC-1`, ownership, history, remote, and publication
gates remain open, deferred, or held. No later checkpoint is authorised by
this record.
