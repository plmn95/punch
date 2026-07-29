# Phase 2 checkpoint 2

Status: local review candidate. This checkpoint proves one fixed fictional
multi-product campaign only.

## Authority and boundary

- Approved baseline:
  `7225f2b3ab6adac669f842558912167c854ec876`.
- Plamen approved checkpoint 1 and authorised continuation into checkpoint 2
  on 29 July 2026.
- The checkpoint runs one fixed context through the existing injected-provider
  generation path and produces stable, schema-valid campaign JSON.
- It adds no production runtime surface, dependency, package export, live
  provider, fetching, renderer, HTML, CLI, output writer, trace, asset, remote,
  licence, or publication configuration.
- No private Punchline source, prompt body, fixture, campaign, customer
  material, or asset was inspected or transferred.

## Fixed fixture

The canonical fixture is a three-product `promotion` campaign for the
fictional ecommerce brand **Kiln & Leaf**. It uses one featured product and two
supporting products so every current semantic block can be exercised without
starting renderer work.

| File                                        | Purpose                                               |
| ------------------------------------------- | ----------------------------------------------------- |
| `tests/fixtures/checkpoint-2/context.json`  | Fixed brand, product, instruction, and offer evidence |
| `tests/fixtures/checkpoint-2/campaign.json` | Expected normalised semantic campaign JSON            |
| `tests/checkpoint-2/fixed-campaign.test.ts` | Engine-path and fixture-consistency proof             |

The committed `campaign.json` is a semantic `Campaign` fixture for generation
and the next renderer checkpoint. It is not the checkpoint-8 CLI artifact
envelope with status, evidence references, and validation metadata.

The context and campaign contain:

- the fictional brand Kiln & Leaf;
- the fictional Ember Mug, Meadow Cup, and Hearth Pitcher;
- reserved `example.com` subdomains only;
- newly authored names, copy, EUR prices, descriptions, offer, code, deadline,
  and URL-shaped product/image facts;
- no fetched page, real merchant, customer data, private evaluation material,
  logo, product photograph, font, binary, or bundled asset.

The brand seed was created independently for Punch checkpoint 1. The two fixed
JSON records and their expanded three-product campaign were authored for this
checkpoint by Codex under Plamen's direction from Punch's public product
contract. They were not adapted from a private campaign or fixture. This is a
provenance record, not a project-licence or trade-mark conclusion.

## Proof

The focused test:

1. parses the evidence with `GenerationContextSchema`;
2. parses the expected result with `CampaignSchema`;
3. removes engine-owned block IDs to form the deterministic fake provider's
   emit response;
4. runs `runGeneration` through emit and critique;
5. proves the engine returns the exact fixed campaign with no repair or
   revision;
6. proves both model stages receive the exact fixed brand, instruction, offer,
   and per-product evidence values;
7. checks all eight block types and ordered `block-01` through `block-08` IDs;
8. checks the fixed product sequence and each name, price/currency, image URL,
   description, and CTA URL against the matching observed fixture evidence;
9. checks structured offer association; and
10. proves repeated runs serialise to identical JSON, match the committed
    campaign fixture byte for byte, and reparse through the canonical schema.

These association assertions are deliberately fixture-specific. They preserve
all three products by construction; they are not a general product-binding or
cross-product validator.

## Package and export decision

- The public root export remains unchanged and schema-only.
- The fixed fixture, fake provider, internal generation runner, prompt builders,
  repair surface, and stage payloads are not public package exports.
- Fixture and test files live outside `src` and remain outside the package's
  `dist`-only packed-file allowlist.
- No dependency or lockfile change is required.
- TypeScript's `resolveJsonModule` option is enabled so the tests review the
  committed JSON records directly. It adds no runtime module or dependency.

## Verification record

Fixture and proof hashes:

| File                                        | SHA-256                                                            |
| ------------------------------------------- | ------------------------------------------------------------------ |
| `tests/fixtures/checkpoint-2/context.json`  | `fce1e8d1cf45c9e679bdbf4d50bf3694d4c4ca53909e427942457a1c0fe17205` |
| `tests/fixtures/checkpoint-2/campaign.json` | `f17a4b7fb6aafc8935389ed9c8fe66b5aad0818e886896c43249083c88136dc2` |
| `tests/checkpoint-2/fixed-campaign.test.ts` | `54ced4b6603ad52c9071149484f4d0f463d66a1dc9d65cc09c89c88a21b0fdbe` |

Fresh verification on 29 July 2026:

- `npx vitest run tests/checkpoint-2/fixed-campaign.test.ts`: one file and
  three tests passed.
- `npm run check`: formatting, lint with zero warnings, TypeScript, all seven
  test files with 70 tests, and the distributable build passed.
- Root package import smoke: `CampaignSchema` and `GenerationContextSchema`
  loaded from `dist/index.js`.
- `npm audit --audit-level=high`: zero known vulnerabilities.
- `git diff --exit-code -- package.json package-lock.json src`: runtime source,
  dependency metadata, and lockfile are unchanged.
- `npm pack --dry-run --json` and an exact local archive inspection: 57 files,
  24,078 compressed bytes, 250,746 unpacked bytes, no bundled dependency, and
  only `dist` plus `package.json`. The fixture, tests, instructions, and
  checkpoint documents are absent.
- Inspected archive SHA-256:
  `f5ed2f0ee5a19f4738ba0e8ef6584a7f669c8e4b5db7895131b60ae5616464fb`.
  Its contents are byte-identical to checkpoint 1 because no distributable
  source changed.
- The exact archive scan found no credential shape, email address, absolute
  private path, private-project reference, environment assignment, or binary.
- The new fixture/test delta scan found no credential shape, email address,
  absolute private path, or private-project reference. All 39 URL occurrences
  use the reserved `kiln-and-leaf.example.com` host; the files are text and
  contain no bundled asset.
- The wider tree scan found only the existing deliberate credential/email test
  canaries and expected Punchline/private-path references in non-packaged
  internal instructions and extraction records. No file outside dependencies
  exceeds 1 MiB.
- The task-created build output, package archive, and package-extraction
  directory were removed after inspection.

No render, browser, live Anthropic, fetching, CLI, or visual check was run
because those surfaces do not exist in this checkpoint.

## Limits and next gate

This checkpoint does not prove model quality or safety for arbitrary inputs.
Product IDs remain fixture-scoped and opaque. Stable input-order identity and
general deterministic coverage/fact/image/link/CTA binding remain checkpoints
6 and 7. Rendering begins only after Plamen approves this checkpoint, under a
separately authorised checkpoint 3.

`FIX-1` evidence is complete for this one canonical fixture, but the gate
remains open for the later fictional evaluation set. `SEC-4`, `QA-1`, `VIS-1`,
remote creation, and publication remain deferred, open, or held by their named
owners. `P2-C2` remains open until Plamen reviews the exact local commit.
