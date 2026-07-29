# Punch extraction allowlist

Status: closed Phase 1 candidate list. It authorises inspection and
classification only. It does not authorise copying, adapting, or publishing
source.

## Source pin and allowlist rules

- Private source: `/Users/plamenhadzhiev/repos/12startups/memo`.
- Source commit:
  `1853897ce1325de262cc3b5b9a430abe0452d8ad`.
- File hashes below are SHA-256 values from that commit.
- A source path or function absent from this document is excluded by default.
- `Extract` means that the named pure surface may be transferred substantially
  unchanged only after exact-surface ownership/IP clearance, its pre-transfer
  ledger entry, and a separately authorised Phase 2 task.
- `Adapt` means preserve the named behaviour while removing private
  architecture and conforming it to Punch's schemas. It is not permission for a
  blind file copy.
- `Rewrite` means use verified behaviour as a specification only. Do not copy
  source text.
- Existing tests, fixtures, snapshots, prompt bodies, comments describing
  private history, and imports outside the named surface are never implicitly
  included.
- Every future extraction must record source path and hash, named functions,
  destination path, disposition, reviewer, and gate evidence before staging.
- Scan the resulting candidate before staging or committing it. Licence,
  dependency, complete candidate, package, and publication gates remain
  mandatory later; they are not circular prerequisites for private local work.
- Closing a gate never authorises transfer by itself. Every `Extract` or `Adapt`
  row requires a separately authorised Phase 2 task naming its exact source
  surface and destination.

## Pure extraction candidates

These are the only candidates for substantially unchanged transfer.

| Source and SHA-256                                                                                            | Allowed surface                                             | Required disposition                                                                       |
| ------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `src/lib/utils/sanitise-text.ts`<br>`35f69f14184f8868e974db71edb6f047342d351842432b5dfaed8ba65d7d71ca`        | `sanitisePromptText` and its result type                    | Extract after ownership clearance; rename only if Punch's vocabulary requires it           |
| `src/lib/claude/json-repair.ts`<br>`101ed778a0554125abe16905d9c32491bed9ccc9b907438e143e51e35fdfe3bb`         | `cleanJsonResponse`, `repairTruncatedJson`                  | Extract after ownership clearance; keep repair bounded and schema validation authoritative |
| `src/lib/email/contrast.ts`<br>`e1795987457f3c600cd82e464e397b8bda2e62b83e653314b6b61b416bb1f66a`             | Colour parsing, luminance, contrast ratio, `ensureReadable` | Extract after ownership clearance; preserve WCAG thresholds                                |
| `src/lib/email/cta-padding.ts`<br>`392d40dccb1daf2da01716105b2a6e83b956766bae5a0b24e18dc17f259fddd6`          | `TAP_TARGET_MIN_PX`, `clampButtonPaddingForTapTarget`       | Extract after ownership clearance                                                          |
| `src/lib/email/blocks/measured-zone.ts`<br>`33af70e1a09b9543657cc340a3386a8904a6a64d2e7a9574d385d4ca7890f071` | Line estimation and measured-zone helpers                   | Extract after ownership clearance; use only for export layout                              |

No source test file is directly allowlisted. Punch tests must be newly authored
with fictional inputs, though the behaviour covered by focused private tests
may inform the new test matrix.

## Fetching and extraction candidates

| Source and SHA-256                                                                                                            | Allowed behaviour                                                                                                                            | Punch adaptation                                                                                                                                                                               |
| ----------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/lib/utils/safe-product-fetch.ts`<br>`f17d50ce791ed85c0c4bbf7bfd4bd23a5c8aad09f990a691a8eac12053ae7e29`                   | Public-address checks, URL/header/body validation, DNS pinning, connected-peer verification, redirect revalidation, bounded response reading | Adapt into one shared website/product/CSS fetcher; inject policy, user agent, deadline, and shared abort signal; add per-run aggregate and decompressed-byte limits                            |
| `src/lib/utils/product-extractor.ts`<br>`320f983f3bd275d8ea5e9f2382f66a8d098aa9bcf077c7a321b31f201cffbf7b`                    | Deterministic-first product parsing, model fallback, canonical URL pinning, observed-image allowlisting                                      | Adapt heavily to Punch product/evidence schemas; keep price amount and currency together; represent conflicts and unknowns; prevent JSON-LD node mixing; assign stable input-order product IDs |
| `src/lib/utils/website-analyzer.ts`<br>`d723210e4ddb0caf7eb600e9e16d5ffcc993ba920ca6f709964ceecb5cdbf90d`                     | `extractLogos` plus deterministic site metadata and bounded text-extraction behaviour                                                        | Adapt pure parsers; rewrite network/model orchestration against the shared safe fetcher, provider seam, and evidence model                                                                     |
| `src/lib/utils/website-color-extractor.ts`<br>`123a81e2e4ce36ed58069c1561c62f8d046bc359b9c152cc1469be6d2179a1fb`              | Deterministic HTML and CSS colour extraction                                                                                                 | Adapt parsing only; replace its network path; fetch exact-final-origin public CSS through the shared fetcher; preserve stylesheet provenance; do not follow CSS imports                        |
| `src/lib/utils/website-font-extractor.ts`<br>`d0614ca49e26eadd3958e402abac4a3e0c5d421c19b657c40d3767984b96b65d`               | `extractCssFonts` and its priority chain                                                                                                     | Adapt; distinguish observed brand fonts from email-safe render fallbacks                                                                                                                       |
| `src/lib/utils/brand-compose.ts`<br>`c49815533d82c64c03e93e53bf9cec21f4bfc54091c8e5b63ead3e5fa18175ca`                        | Extraction-slot priority, logo selection, provenance-aware brand composition                                                                 | Adapt to a small public `BrandProfile`; separate pure composition from model and network calls                                                                                                 |
| `src/lib/utils/brand-sanitize.ts`<br>`96b7bc9e5995e8eb1e46cadd64ccf25f9b1215c360868a51cb144dedfdda1890`                       | Strict colour parsing, colour/font normalisation, email-safe font mapping, website colour/font merging                                       | Adapt selected helpers; use the allowlisted WCAG contrast module instead of the file's heuristic contrast predicate                                                                            |
| `src/lib/utils/brand-types.ts`<br>`2c614aaacfc9d096e253e1304f7007512e8131ad58052415466b19e9425ae4bb`                          | Provenance and completeness concepts only                                                                                                    | Rewrite as Punch-owned Zod schemas; remove Sentry, application tokens, and private defaults                                                                                                    |
| `src/lib/claude/prompts/generation/voice-extraction.ts`<br>`d03b4a2948b50ffd2845de266593515d133062936a3f71978a7898a7619fe69e` | Bounded voice-extraction stage and typed-output behaviour                                                                                    | Adapt orchestration only after the prompt/IP gate; sanitise and delimit source text, inject the provider, and attach evidence                                                                  |

The `safe-product-fetch.ts` row does not permit
`src/lib/utils/proxy-fetch.ts`, browser-cookie reuse, or any application proxy.

## Generation candidates

| Source and SHA-256                                                                                                           | Allowed behaviour                                                                                      | Punch adaptation                                                                                                                                                  |
| ---------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/lib/claude/prompts/generation/with-repair.ts`<br>`d58e57cc286e02f88faed6329d1d03f270dda652ece8ee73a2471f7ca9319f30`     | Validate → clean JSON → repair truncated JSON → bounded model repair sequence                          | Adapt to `TextModel`; do not import a singleton client; keep the Zod schema authoritative                                                                         |
| `src/lib/claude/client.ts`<br>`d68e1f80aa03d39dda397f35a948705d39122970a216ebe47871f2a73b318c68`                             | Usage type, `sumUsage`, and zero-usage concept                                                         | Adapt usage maths only; rewrite provider construction, model configuration, errors, deadlines, and credential loading                                             |
| `src/lib/claude/prompts/generation/schemas.ts`<br>`4d7ff796294629167daceed5b878a5dbc4c19faa8d5b7edcf7b2fce98b92e1e5`         | Emit-output, voice-output, critique-issue, and critique-result concepts                                | Adapt to Punch schemas; rewrite request/input contracts for one-to-six required products, evidence, offer, and three goals                                        |
| `src/lib/claude/prompts/generation/types.ts`<br>`07492fbbd3e6b1a0ec8093568f71e3d37d9773519450a70c8aff49781d6eb83e`           | Type-derivation pattern                                                                                | Rewrite types from Punch Zod schemas; do not preserve application input shapes                                                                                    |
| `src/lib/generation/goals.ts`<br>`0b0753b7d5d535a2a10599ca196c6b48a3a97f2dfb266b7675095df1a881f48a`                          | Goal metadata pattern                                                                                  | Rewrite to exactly `sales`, `product-launch`, and `promotion`, with the ratified semantics                                                                        |
| `src/lib/claude/prompts/generation/brand-context.ts`<br>`3f4e14779656932455346bb5d2270d9d0ea99a0a52c7d16acef137aed9e1c5ea`   | Compact structured brand-context serialisation                                                         | Adapt to `BrandProfile` and explicit evidence/unknown markers                                                                                                     |
| `src/lib/claude/prompts/generation/block-catalogue.ts`<br>`cdd8ecc6b9a8e82748993bb4ffd3623512d1627fdb7816d3b38a95b8baa6a664` | Semantic block-catalogue role                                                                          | Adapt only after the prompt/IP gate; restrict to eight blocks, 40 total blocks, stable product IDs, required products, strict CTAs, and renderer-owned compliance |
| `src/lib/claude/prompts/generation/emit.ts`<br>`1afd45f126772ab0b13b03be0f371f0a3ef212779e9f7a6354e327a03a5939c7`            | Typed emit-stage builder and source-context assembly                                                   | Adapt only after the prompt/IP gate; include every product and explicit offer/goal semantics                                                                      |
| `src/lib/claude/prompts/generation/critique.ts`<br>`b74c15cf5f7d5cd3ab46fe52f7a1dda136de2b646d62065987c89d32dd3f0713`        | Typed critique-stage builder and blueprint formatting                                                  | Adapt only after the prompt/IP gate; provide source evidence and require omission, mixing, unsupported-claim, and CTA checks                                      |
| `src/lib/claude/prompts/generation/revise.ts`<br>`098717617be051de2f916386e45d20518d205e473a62e431b7e751eb8f827e13`          | Typed revise-stage builder                                                                             | Adapt only after the prompt/IP gate; permit one revision and preserve deterministic-fact precedence                                                               |
| `src/lib/inngest/functions/generate-blueprint.ts`<br>`57c0714bb3f2ee84176473aefebd7264858117b58f109058a34abfe6724cdb28`      | `runBlueprintPipeline`, `runBlueprintPipelineWithUsage`, and emit/critique/conditional-revise sequence | Adapt the pure orchestration only; inject provider and abort signal; exclude Inngest handler, Supabase persistence, Sentry, and application errors                |
| `src/lib/generation/image-provenance.ts`<br>`18c790b3832d39b0f4b631b47e093226cb8652abcadecfd949d2eb6f95608112`               | Observed-versus-generated image checking concept                                                       | Rewrite as per-product evidence binding; global URL-set matching is insufficient                                                                                  |
| `src/lib/eval/faithfulness.ts`<br>`10dab1939c7e9eb49b8725edfea754eb783a932710bcfae259c318f056ca0267`                         | Source-support assembly and claim-result reduction concepts                                            | Adapt to website, every product, offer, goal, and deterministic validation; exclude eval persistence and direct provider call                                     |
| `src/lib/claude/prompts/eval/faithfulness.ts`<br>`1f723b70ee61d712427e988425bf88fc7e8f902b0b1382694bc39b15ce2ecc04`          | Claim-evaluation stage contract                                                                        | Adapt only after the prompt/IP gate; never transfer the literal prompt by default                                                                                 |

`src/lib/claude/prompt-versions.ts` may inform a new manual prompt-version
registry, but its values and historical commentary are rewrite-only and are not
allowlisted source.

## Renderer candidates

| Source and SHA-256                                                                                               | Allowed behaviour                                                                                         | Punch adaptation                                                                                                                          |
| ---------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `src/lib/email/palette.ts`<br>`7a181b66f687165accccaa434e6898976e22aa2b6671462b98261c1eb69b8466`                 | Canvas, card, panel, accent, and contrast palette derivation                                              | Adapt to a small Punch render-style type; remove application-token and Sentry coupling                                                    |
| `src/lib/email/blocks/_shared.ts`<br>`ff3392ccb027d537919bee28e6cbb2c97ac09b6018c892d1cf7e6e243365c0ec`          | Type scale, email-safe font stack, palette armour, body/heading/link/button styles                        | Adapt pure export styles only; exclude selection attributes, editor fields, placeholders, and affordances                                 |
| `src/lib/email/blocks/item-rows.tsx`<br>`7a260b725841096ad0cc8c279cab6345ae81d31b89d02f654b7233201353050c`       | Balanced rows, centred short rows, explicit widths, Outlook image width, and responsive stacking geometry | Adapt or split into pure row geometry plus export React rendering; remove editor context and item-selection attributes                    |
| `src/lib/email/render-blueprint.tsx`<br>`a9679b521b91c9ef36afe306d48e4981cf0f9fcecf6ea6b58556e12f2113b1dc`       | Cards-on-canvas root, responsive CSS, export rendering, and one contrast closing CTA surface              | Adapt to export-only context and eight-block dispatcher; rewrite compliance chrome and image handling; remove preview/application imports |
| `src/lib/email/dispatch-block.tsx`<br>`15d40dad0c4af991318ba147c980f1a5876566f6a6f140bc7e7cecd6ca4bdf42`         | Exhaustive discriminated-union dispatch and `assertNever` pattern                                         | Adapt to exactly eight approved blocks                                                                                                    |
| `src/lib/email/blocks/header-standard.tsx`<br>`bd80f71b83343f2eacfddba3302294599be1d24b492651e462874c92dcd21ea4` | Banner, cleared logo/wordmark, and quiet utility-link composition                                         | Adapt; remove preview attributes and validate logo/utility URLs                                                                           |
| `src/lib/email/blocks/hero-stacked.tsx`<br>`72295d0236262f01ab0f820aaf7be18356447f9be6dc8491c8bc26f913c1e213`    | Flush optional image, headline/body/primary-CTA composition                                               | Rewrite export-only leaf; remove editable text and placeholder renderer                                                                   |
| `src/lib/email/blocks/heading.tsx`<br>`7e8cae4a7f450dcbdc712f8800c35bae3bed53dadb2ca55c77f2801ef19f2993`         | H2/H3 hierarchy and optional panel emphasis                                                               | Rewrite export-only leaf                                                                                                                  |
| `src/lib/email/blocks/body-paragraph.tsx`<br>`414b84651f0a135801d9ec5e9354beb39335bc5a701506c5e29236118f7085fd`  | Body rhythm and restricted inline Markdown                                                                | Rewrite export-only leaf and validate every link                                                                                          |
| `src/lib/email/blocks/product-feature.tsx`<br>`f4d82d9442162606a69c5453cb123b40f3ceed0218c424774738297e1725a578` | Product spotlight hierarchy and prominent CTA                                                             | Adapt with required `productId`; replace placeholder art with validated image or deliberate image-free layout                             |
| `src/lib/email/blocks/product-grid.tsx`<br>`c1f6e037bdf74f4adb2f04a152bb19de97305f0caf7a0de3bd1bc16f03c29d14`    | Product-card hierarchy and multi-product grid behaviour                                                   | Rewrite export-only leaf around allowlisted row geometry; require `productId` and CTA per item; remove all editor state                   |
| `src/lib/email/blocks/discount-code.tsx`<br>`a3d4b493c4423ce388539f098f787ce45fc0182b7ce054065c170407de6fdc8e`   | Guarded promotion-code panel                                                                              | Adapt; render only explicit observed offer fields and remove preview attributes                                                           |
| `src/lib/email/blocks/cta-block.tsx`<br>`f846130b2b901b8905023cea6a10b5ff6368cdb6bb95bd2ae44258f833305bd1`       | One/two-button closing region and spacing                                                                 | Rewrite export-only leaf; remove editable text                                                                                            |
| `src/lib/email/blueprint-schema.ts`<br>`72e112832762d4c9c405fa5d43ec1e0d693f100e68e67757580cf155732d6ca4`        | Discriminated-union schema pattern                                                                        | Rewrite for eight blocks, deterministic IDs, 40-block maximum, required product IDs and CTAs, and strict URLs                             |
| `src/lib/email/blueprint-types.ts`<br>`101c2f07657a3fbe7c57b21e6c14fac95bf9a43d39b0c139377b2ea351d6bc6b`         | Export-render type concepts                                                                               | Rewrite from Zod schemas; remove editor callbacks, selection state, unused blocks, and identity-free products                             |
| `src/lib/email/markdown.tsx`<br>`ce870687c3da001db2ae76dc97695003f91f7b4989bf9e9dd883ca30477d3fe0`               | Restricted Markdown-to-email rendering concept                                                            | Rewrite safe Markdown path; exclude TipTap serialisation and validate links                                                               |
| `src/lib/email/image-integrity.ts`<br>`6e17a8f5c0a55254e8ab84e2ba637d749f37143c84a9419da68646f1f102013f`         | Image validation pass concept                                                                             | Rewrite with per-product evidence; remove global provenance and placeholder-box behaviour                                                 |
| `src/lib/email/resolve-flow-fields.ts`<br>`1137deb155e5fe563b99334db944a97f59ebd88e55b4e134032030ed0bab59a4`     | Section-wide slot-alignment concept                                                                       | Adapt for product-grid only; product CTAs are always present and editor overrides are absent                                              |

The following render-check modules are adapt-only:

| Source and SHA-256                                                                                             | Allowed checks                                                                              |
| -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `src/lib/eval/render-checks.ts`<br>`30f8cfc09b36ad6d2c08ab549c9b1e46da62ac9b83b96affd653128e58fce3f0`          | Check orchestration, 44px CTA floor, 14px content/12px chrome floors, 102,400-byte HTML cap |
| `src/lib/eval/render-checks-contrast.ts`<br>`99dc4bf643643161da455f85fabb8724c00d00d26d19f07b60f04f0ae416bd08` | 4.5:1 normal and 3:1 large-text contrast checks                                             |
| `src/lib/eval/render-checks-layout.ts`<br>`77b9e50722d6c5c514f9724a8ec71a27df850973a14a2ae861d60cb16fc885a6`   | Maximum four columns, explicit widths, and fixed-image overflow checks                      |
| `src/lib/eval/render-dom.ts`<br>`f3db91beb9f8457644a35867d54a847008cfbd9d0fb2fbd5102bf2daa03ec2b6`             | Inline-style and DOM measurement helpers                                                    |

Punch must use its own stable block/column/CTA markers; it must not depend on
React Email's private DOM attributes or positional `<hr>` mapping.

## Allowlist exclusions

The allowlist explicitly excludes:

- every path not named above;
- all current prompt literal text until a separate prompt/IP clearance records
  an exact destination and disposition;
- `proxy-fetch.ts`, worker code, API routes, Inngest handlers, persistence,
  Supabase, Sentry, Brevo, R2, authentication, onboarding, settings, and UI;
- editor, TipTap, preview, selection, affordance, block-factory, and hosted-icon
  code;
- `footer-standard`, `info-strip`, `article-preview`, `quote-block`,
  `callout-card`, system emails, and non-approved blocks;
- every private fixture, snapshot, eval corpus, rating, result, trace,
  diagnostic capture, and development preview;
- every current asset, logo, icon, screenshot, external reference export, and
  real-brand palette;
- the source lockfile, `node_modules`, Git history, configuration, environment
  files, deployment files, and repository instructions.

Changing this closed list requires Plamen's approval and a documentation-only
allowlist amendment before the new source is copied or adapted.
