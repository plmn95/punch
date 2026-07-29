# Phase 2 checkpoint 6

Status: approved checkpoint. This checkpoint makes product identity canonical
and carries explicit product-to-block metadata through the existing semantic
pipeline.

## Authority and boundary

- Approved baseline:
  `f6976d1b0081626f18e6e18a4c932a3420c2919c`.
- Plamen approved checkpoint 5 and authorised continuation into checkpoint 6
  on 29 July 2026.
- Plamen approved the exact checkpoint-6 commit
  `c26eb751330ba573769a94ab162f687d5c58c1c5` on 29 July 2026.
- The implementation is an independent Punch change based on the approved
  public contract and newly fictional tests.
- No private Punchline source, prompt, fixture, snapshot, asset, campaign, or
  application code was inspected, copied, or adapted.

This checkpoint owns:

- the exact internal product-ID set `product-01` through `product-06`;
- one input-position allocator shared by extraction and context validation;
- rejection of reordered, skipped, malformed, or duplicated context IDs;
- one deterministic collector for `product-feature` and `product-grid` item
  bindings;
- emit and revision rejection when a product-bearing block references no
  product in the current context;
- generation-prompt identity instructions and version advancement; and
- single- and six-product proof that IDs survive extraction, generation, and
  standalone rendering.

It does not own:

- required-product coverage;
- comparison of generated names, descriptions, prices/currencies,
  availability, images, canonical URLs, CTAs, or offers with evidence;
- cross-product swaps, conflict/unknown policy, or final grounding acceptance;
- evidence-reference-to-container consistency;
- generic-text claim attribution;
- arbitrary extracted-input rendering or output publication;
- a live provider, CLI, output writer, traces, remote, licence, or publication.

Those factual checks remain checkpoint 7 and `SEC-4`. Deeper claim evaluation
remains checkpoint 9.

## Canonical identity

`ProductIdSchema` accepts only six engine-owned values:

```text
product-01
product-02
product-03
product-04
product-05
product-06
```

`productIdFromIndex` maps zero-based canonical input position to that exact
sequence and rejects any index outside zero through five. Extraction allocates
the IDs before concurrent fetching, so URL shape, redirects, page content,
network completion order, and model output cannot choose identity.

`GenerationContextSchema` requires each `products[index].productId` to equal
the allocator result for that index. Existing URL uniqueness and product-ID
uniqueness checks remain in place.

## Product-bearing structures

The ratified semantic contract defines only these generated structures as
product-bearing:

- `product-feature.productId`;
- `product-grid.items[].productId`.

Hero blocks, headings, body copy, and closing CTA blocks remain campaign-level
composition. Product-specific facts and canonical product actions belong in
the two explicitly bound product structures. This checkpoint does not add
optional identity fields or a second campaign-level product map that could
drift from the canonical block metadata.

The internal binding collector records, in semantic render order:

- block index;
- product-bearing block type;
- grid item index when applicable; and
- canonical product ID.

Repeated presentations of one product across blocks remain valid. A single
grid still forbids duplicate product IDs.

## Generation enforcement

Emit and revision stage invariants compare every collected binding ID with the
current generation context. A schema-valid ID that is not present in that
context produces the safe issue code `unknown-product-id` and receives the
existing one-attempt structured repair path. A repaired result must pass the
same invariant.

This is referential identity, not checkpoint-7 factual validation. Checkpoint 6
does not reject a campaign merely because a required context product is
missing, and it does not compare any generated product field with evidence.

The newly authored identity instructions advance:

- emit to `punch.emit.v3`;
- critique to `punch.critique.v3`; and
- revise to `punch.revise.v3`.

The prompts identify the only two product-bearing structures and require exact
context IDs. Prompt guidance remains subordinate to Zod schemas and
deterministic stage invariants.

## Render identity proof

The renderer implementation is unchanged. Its existing stable product, name,
description, price, image, and CTA markers already carry each semantic
productId.

A new integration proof uses one and six explicitly ordered fictional product
URLs whose fetches complete in reverse order. It:

1. verifies the extracted context retains `product-01` through `product-06` in
   input order;
2. runs the semantic emit and critique stages;
3. collects the exact IDs from the final product-bearing blocks;
4. renders that validated-shape fictional campaign in memory; and
5. verifies the standalone HTML contains the same ordered product ownership
   markers.

This test does not connect arbitrary extracted input to a production renderer
or output writer. It proves identity transport only; checkpoint 7 must compare
the campaign with the extracted evidence before that connection is safe.

## Verification record

Fresh verification on 29 July 2026:

- focused identity, generation, extraction, renderer, and integration tests:
  six files and 25 tests passed;
- `npm run check`: formatting, lint with zero warnings, TypeScript, all 27 test
  files with 214 tests, and the distributable build passed;
- the root package import remains exactly 15 schemas plus `SCHEMA_VERSION`;
  `productIdFromIndex` and the binding collector remain internal;
- unsupported `punch-email/core/product-bindings` import returned
  `ERR_PACKAGE_PATH_NOT_EXPORTED`;
- two consecutive package archives were byte-identical at SHA-256
  `0ceea9492cef2dae1d645cb8c993b1c4b501e0b4b4b8c1a8521c0de56df20602`;
- the exact archive contains 179 entries: 89 JavaScript files, 89 declaration
  files, and `package.json`; it is 81,742 compressed bytes and 498,020 unpacked
  bytes;
- the archive contains no dependency, documentation, test, fixture, trace,
  asset, binary, development instruction, absolute private path,
  private-project reference, credential shape, email shape, or environment
  file/value;
- `npm ls --all` passed with only declared optional development integrations
  absent;
- a fresh `npm audit --audit-level=high --json` reported zero vulnerabilities;
- package and lockfile metadata are byte-unchanged;
- the exact changed-file scan found no credential shape, email address, binary,
  or absolute private path; the only private-project references are the
  deliberate negative and provenance statements in checkpoint/gate documents;
- every changed implementation and test file remains below 300 lines, and each
  new or changed function remains within the 50-line limit;
- `git diff --check` passed; and
- independent read-only architecture and security reviews passed after their
  exact type-boundary findings were corrected; neither found a remaining
  checkpoint-6 defect.

No dependency, lockfile, public root export, renderer implementation, fixture,
asset, binary, remote, or publication configuration changes are required.

## Limits and next gate

`P2-C5` is closed by Plamen's approval of exact commit
`f6976d1b0081626f18e6e18a4c932a3420c2919c`. Plamen's approval of exact commit
`c26eb751330ba573769a94ab162f687d5c58c1c5` closes `P2-C6`.

`SEC-4` remains deferred. Checkpoint 7 must add an independent deterministic
campaign-to-evidence validator and prove single- and six-product required
coverage, no unknown IDs, exact fact/image/link/CTA association, and
conservative conflict/unknown handling. Existing campaign-to-HTML checks prove
renderer fidelity only and cannot close that gate.

Image-URL public-address validation, the full malicious-source evaluation, one
total extraction-plus-generation deadline, deeper claim checking, filesystem
safety, traces, complete dependency/package review, licence, history, remote,
and publication gates remain open, deferred, or held. No later checkpoint is
authorised by this record.
