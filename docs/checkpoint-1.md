# Phase 2 checkpoint 1

Status: authorised clean-room implementation. No private Punchline source or
prompt body is transferred.

## Authority and provenance

- Phase 1 baseline:
  `a299cdf11abaec0c93ccec19e894f320f5ee74fe`.
- Plamen approved that baseline on 29 July 2026.
- Plamen then authorised continuation into Phase 2 checkpoint 1.
- This checkpoint is written from Punch's approved public contract and newly
  authored prompt wording.
- `OWN-1` and `IP-1` remain open for any future private-source transfer. They do
  not block this independent rewrite.

## Checkpoint boundary

This checkpoint owns:

- public input and evidence schemas;
- the eight-block semantic campaign schema;
- engine-assigned block and critique IDs;
- the injected text-model seam;
- strict structured model calls with one bounded repair attempt;
- emit → critique → conditional revise orchestration;
- safe errors, cancellation, deadlines, and usage accounting;
- package, type, lint, test, build, and packed-file foundations.

This checkpoint does not own:

- a canonical fixed campaign fixture or generated campaign artifact;
- React Email rendering or HTML;
- live website or product extraction;
- general input-order product ID assignment;
- deterministic cross-product fact validation;
- the Anthropic SDK adapter;
- the CLI, output writer, traces, guided flow, remote, licence, or publication.

Product IDs are structurally required but fixture-scoped and opaque here.
Checkpoints 6 and 7 still own stable input-order identity and deterministic
coverage/binding proof.

## Package decisions

- Local package name: `punch-email`. The public npm registry returned an
  existing unrelated package for `punch` and no public package for
  `punch-email` on 29 July 2026.
- The name remains provisional under `NAME-1`.
- Version: `0.0.0-development`.
- Publication state: `private: true`, `UNLICENSED`.
- Runtime: ESM-only on Node 24 or newer.
- Package manager: npm 11 with a fresh lockfile.
- Public package surface: the root export only. It exposes the canonical
  input, evidence, and normalised campaign schemas and their inferred types.
  Provider, prompt, repair, stage-payload, and low-level runner surfaces remain
  internal.
- Build: plain TypeScript declarations and JavaScript; no bundler.
- Runtime dependency: Zod only.
- Packed-file allowlist: `dist` plus npm-required package metadata.
- Reserved checkpoint-8 binary mapping: `punch` → `dist/cli/main.js`. It is not
  declared until that file and the explicit CLI exist.

The Anthropic SDK, React, React Email, fetching/HTML libraries, CLI parser, and
prompt library remain deferred until their owning checkpoints.

## Prompt provenance

The checkpoint prompt builders are newly authored for Punch. They:

- accept only schema-validated bounded structures;
- mark external evidence as untrusted data;
- request semantic JSON only;
- keep stage, version, output limits, and control flow engine-owned;
- contain no copied private prompt wording.

## Fixture provenance

Checkpoint tests use only newly authored fictional material:

- brand: `Kiln & Leaf`;
- products: `Ember Mug` and numbered `Meadow Cup` variants;
- source locations: reserved `example.com` subdomains;
- copy, prices, offer, conflicts, malicious instructions, and provider canaries:
  written for this checkpoint;
- images: URL-shaped fictional facts only; no image or other asset is bundled.

No customer, merchant, private evaluation, generated campaign, copied fixture,
or Punchline asset was used.

## Dependency and package review

- The initial lint dependency line reported five high-severity advisories
  through glob expansion. ESLint `10.8.0` and TypeScript-ESLint `8.65.0`
  replaced it before the checkpoint candidate.
- A fresh `npm ci --ignore-scripts` installs 130 packages and a fresh audit
  reports zero known vulnerabilities.
- The lockfile contains 163 package entries. Licence metadata comprises MIT,
  Apache-2.0, BSD-2-Clause, BSD-3-Clause, ISC, MPL-2.0, BlueOak-1.0.0, and
  0BSD. MPL and BlueOak entries are development-only.
- The only install-script marker belongs to the optional development-only
  `fsevents` path through Vitest/Vite; checkpoint installs skip all scripts.
- The exact local package contains 57 entries, is 24,078 compressed bytes and
  250,746 unpacked bytes, bundles no dependency, and contains only `dist` plus
  `package.json`.
- Project licence, public name, complete release notices, maintenance review,
  and publication approval remain open gates. This evidence does not authorise
  publication.

## Review gate

The local candidate passes:

- formatting, lint, and TypeScript;
- 67 unit tests across six files;
- distributable build and root-import smoke test;
- clean lockfile reinstall and zero-vulnerability audit;
- dependency metadata and install-script inspection;
- packed-file and size inspection.
- exact package-archive scan with no credential, email, absolute private path,
  private-project reference, environment-value, or binary finding.

The wider working-tree scan found only expected internal planning references
inside non-packaged Phase 1 records and deliberate fictional canaries in tests.
The complete source, configuration, dependency, diff, and Git-scope review
passed. The commit containing this record is the local checkpoint review
boundary; it grants no later checkpoint, remote, or publication authority.
