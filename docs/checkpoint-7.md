# Phase 2 checkpoint 7

Status: local review candidate. This checkpoint adds deterministic
campaign-to-evidence validation for every structured product presentation.

## Authority and boundary

- Approved baseline:
  `c26eb751330ba573769a94ab162f687d5c58c1c5`.
- Plamen approved checkpoint 6 and separately authorised continuation into
  checkpoint 7 on 29 July 2026.
- The implementation is an independent Punch change based on the approved
  public contract and newly authored fictional tests.
- No private Punchline source, prompt, fixture, snapshot, asset, campaign, or
  application code was inspected, copied, or adapted.

This checkpoint owns:

- pre-model product-evidence reference ownership and canonical-source checks;
- required single- and six-product coverage by canonical product ID;
- validation of every repeated `product-feature` and `product-grid` item;
- exact structured name, price/currency/display, description, image URL, and
  canonical product CTA association;
- rejection of exact known product resources from identity-free link and image
  slots;
- conservative omission of optional unknown or conflicted facts;
- the existing one structured repair attempt for invalid emit or revision
  output; and
- one final, value-free grounding report on the selected generated campaign.

It does not own:

- availability statements, because the semantic campaign and renderer expose
  no structured availability field;
- subject, preheader, hero, heading, body, eyebrow, CTA-label, image-alt,
  discount-heading, or campaign-level action claim interpretation;
- arbitrary product paraphrase or unsupported-claim evaluation;
- product-image public-address validation;
- an explicit CLI, output writer, trace artifact, or validation-file schema;
- a remote, licence, release, package publication, or public history.

The first three exclusions are source-aware claim work for checkpoint 9. CLI,
output, filesystem, and trace work remains checkpoint 8.

## Evidence-reference preflight

Before the first model call, every evidence reference attached to every
observed, inferred, or conflicted product fact must:

- use `source: "product"`;
- carry the containing product's exact `productId`; and
- use that product's observed canonical final URL, or one of its canonical URL
  conflict candidates.

The pre-redirect supplied URL is not accepted as evidence provenance. Every
conflicted candidate is checked even when the campaign would omit that fact.
Required product name and canonical URL evidence must be observed before
generation starts.

A context that violates these requirements fails as `invalid-context`. It is
not sent to the model and cannot enter the campaign repair path.

## Deterministic product policy

Coverage is set-based:

- every context product ID must occur at least once;
- no context-absent canonical product ID may occur;
- products may appear in any campaign order;
- exact cross-block repetition is permitted; and
- every repeated occurrence is validated independently.

Only `product-feature` and `product-grid.items[]` are product-bearing. For each
occurrence:

- `name` requires exact observed evidence;
- `cta.href` requires the exact observed canonical URL, not the supplied
  pre-redirect URL;
- an optional `price`, when present, requires exact observed amount and
  currency as one atomic fact;
- an optional generated price display is either absent or exactly observed;
- an optional `image.url`, when present, requires the exact observed URL;
- an optional `description`, when present, requires the exact observed or
  explicitly inferred description; and
- an optional price, image, or description must be absent when its evidence is
  unknown or conflicted.

Omitting an observed optional fact remains valid. Choosing either conflict
candidate does not. Image alt text and CTA labels are generated prose, so
checkpoint 9 must evaluate their meaning; checkpoint 4 continues to prove
their exact campaign-to-HTML preservation.

Header, hero, body-paragraph, and campaign CTA blocks have no product identity.
Their structured links, images, and renderer-supported Markdown links cannot
use any exact URL known to belong to a product:

- the supplied product URL;
- an observed or conflicted canonical URL candidate; or
- an observed or conflicted product image URL candidate.

The same resource union is checked across URL and image roles, so changing a
product URL into an image or a product image into a CTA does not evade the
guard. Header home/logo, hero CTA/image, campaign CTA actions, and rendered
body Markdown links are covered. Unrelated brand resources remain valid. One
shared pure tokenizer defines the exact restricted inline-Markdown subset for
both rendering and grounding. Interpreting the surrounding prose, link label,
alt text, or unsupported Markdown remains checkpoint 9.

The structured-offer rules remain deterministic: a present discount
description must exactly match the supplied offer description, and a discount
block cannot invent or alter a code or deadline. Other free-text promotion
claims remain checkpoint 9.

## Issue and repair contract

Grounding issues contain only a static code, product ID, block index, and
optional grid-item index. They never contain expected or generated names,
descriptions, prices, currencies, URLs, prompts, model text, or evidence
snippets.

The static codes are:

```text
product-evidence-reference-mismatch
missing-product-id
unknown-product-id
product-name-unavailable
product-name-mismatch
product-price-unavailable
product-price-mismatch
product-description-unavailable
product-description-mismatch
product-image-unavailable
product-image-mismatch
product-cta-url-unavailable
product-cta-url-mismatch
unbound-product-image
unbound-product-url
```

Emit and revision apply the same pure validator through the existing structured
stage contract. An invalid primary result receives one repair attempt. An
invalid repair fails closed as `invalid-model-output`. Deterministic findings
never trigger a second critique or a second semantic revision.

The selected draft or revised campaign is checked once more before
`runGeneration` returns. Its internal `grounding` report is available for the
future checkpoint-8 validation artifact. The root package export surface is
unchanged.

## Fictional proof

The newly authored grounding test data has one to six distinct fictional
products. Each uses a distinct name, amount, currency, display, supplied URL,
canonical URL, image URL, description, and varied availability evidence. The
supplied and canonical product URLs deliberately differ.

The tests prove:

- exact single- and six-product campaigns pass;
- the six-product featured-plus-supporting structure may reorder complete
  presentations without losing association;
- omission of each of the six input positions fails;
- a context-absent canonical ID fails;
- exact repetition passes while one bad repeated occurrence fails;
- name, amount, currency, display, description, image, and CTA swaps fail;
- the supplied pre-redirect URL cannot replace the canonical CTA URL;
- exact known product resources fail in identity-free header, hero, campaign
  CTA, and rendered body-Markdown slots;
- cross-role product URL/image substitutions fail while unrelated brand
  resources pass;
- optional observed facts may be omitted;
- exact inferred descriptions may be used;
- unknown and conflicted optional facts must be omitted;
- invented displays fail even when amount and currency are correct;
- wrong evidence-reference source, product ID, URL, or conflict candidate
  fails before provider use;
- invalid emit and revision output can use only their existing one repair;
- a second invalid result fails before critique or further revision; and
- accepted one- and six-product campaigns still pass standalone render
  validation.

All test brands, products, URLs, descriptions, offers, and campaign copy were
created for Punch in reserved `example.com` space. No new asset is bundled.

## Verification record

Fresh verification on 30 July 2026:

- the focused grounding, generation, fixture, extraction, and render path:
  ten files and 72 tests passed;
- `npm run check`: formatting, lint with zero warnings, TypeScript, all 31 test
  files with 261 tests, and the distributable build passed;
- the root package import remains exactly 15 schemas plus `SCHEMA_VERSION`;
  the tokenizer, grounding validator, and helper remain internal;
- unsupported `punch-email/validation`,
  `punch-email/validation/campaign-grounding-validation`, and
  `punch-email/core/inline-markdown` imports returned
  `ERR_PACKAGE_PATH_NOT_EXPORTED`;
- two consecutive package archives were byte-identical at SHA-256
  `cac84fa06f9ebd86797e3777994c639cd1f342bec23eef7ba0fe0a09a4a1487b`;
- the exact archive contains 185 entries: 92 JavaScript files, 92 declaration
  files, and `package.json`; it is 85,105 compressed bytes and 511,860
  unpacked bytes;
- the archive contains no documentation, test, fixture, trace, asset, binary,
  development instruction, absolute private path, private-project reference,
  credential shape, personal-email shape, or environment file/value;
- `npm ls --all` passed with only declared optional development integrations
  absent;
- a fresh `npm audit --audit-level=high --json` reported zero vulnerabilities;
- package and lockfile metadata are byte-unchanged;
- every changed implementation and test file remains below 300 lines, and
  every new or changed function remains within the 50-line limit;
- `git diff --check` passed; and
- independent architecture, integration, validation, and adversarial reviews
  passed after the unbound structured-resource, Markdown-link, and cross-role
  bypasses were corrected.

No dependency, lockfile, root export, semantic block schema, runtime fixture,
asset, binary, remote, or publication configuration change is required. The
renderer-only source change moves its existing restricted inline-Markdown
tokenizer into a shared pure helper without changing supported syntax or
output behaviour.

## Limits and next gate

`P2-C6` is closed by Plamen's approval of exact commit
`c26eb751330ba573769a94ab162f687d5c58c1c5`. `P2-C7` remains open until Plamen
approves the exact local checkpoint-7 commit.

`SEC-4` moves from Deferred to Open. This checkpoint supplies deterministic
structured product coverage and association, but checkpoint 9 must still fail
unsupported and availability claims in free text before the full gate can
close.

Image-resource public-address validation, malicious-source evaluation,
filesystem and trace safety, complete dependency/package review, licence,
history, remote, and publication gates remain open, deferred, or held.
Checkpoint 8 has not started and is not authorised by this record.
