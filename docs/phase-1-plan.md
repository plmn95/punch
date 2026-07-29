# Punch Phase 1 plan

Status: approved documentation/bootstrap phase. No runtime extraction,
dependency installation, remote creation, or publication is authorised.

## Authority and pinned inputs

- Product approval: Plamen, 29 July 2026.
- Approval record SHA-256:
  `631ddb064357fd503e6877fcdc7ef9a2a97a41fb893393e13e169ade037b953c`.
- Private source repository:
  `/Users/plamenhadzhiev/repos/12startups/memo`.
- Pinned source commit:
  `1853897ce1325de262cc3b5b9a430abe0452d8ad`.
- Approved extraction-plan SHA-256:
  `872c81e19bc96aa8c71dbf5c9377fe6043324a00dec85452cb6563d3f27d21d2`.
- Punch repository:
  `/Users/plamenhadzhiev/repos/12startups/punch`.
- Repository state for Phase 1: local, empty-history, `main`, no remote.

Punchline development is retired. Punchline remains a private, read-only source
of implementation evidence at the pinned commit; it is not Punch's repository,
history, application shell, planning system, or instruction authority.

## Phase 1 objective

Create a reviewable boundary for Punch before any private implementation is
copied or adapted:

1. Ratify the `0.1.0` contract.
2. Pin the source commit.
3. Define a closed file/function extraction allowlist.
4. Classify candidate source, prompts, fixtures, assets, and dependencies as
   extract, adapt, rewrite, or exclude.
5. Establish Punch's independent durable instructions.
6. Define the private candidate bootstrap and incremental Phase 2 sequence.
7. Record ownership, security, licence, asset, package, visual, and publication
   gates.

## Ratified `0.1.0` boundary

Punch is one TypeScript package with:

- one canonical non-interactive `punch generate` command;
- one optional guided TTY flow over the same canonical path;
- one brand website;
- one to six explicit, unique product URLs;
- `sales`, `product-launch`, and `promotion` goals;
- one injected Anthropic provider;
- emit → critique → conditional revise;
- stable product IDs and deterministic product association;
- conservative structural, factual, claim, link, and render validation;
- responsive standalone `email.html` as the primary result;
- `campaign.json`, `validation.json`, and optional traces.

The product promise is:

> One command turns a brand website and one to six explicitly supplied product
> pages into a grounded, responsive ecommerce email.

### Every supplied product is required

Every supplied product is required campaign content.

A valid campaign:

- includes every supplied product at least once;
- includes no unknown product;
- keeps each name, price, currency, image, description, CTA, and URL associated
  with the correct product ID;
- may repeat or feature products when the hierarchy remains coherent;
- fails rather than silently omitting or mixing a product.

Optional editorial product selection is a future mode, not `0.1.0`.

### Goal meanings

- `sales`: an evergreen campaign intended to sell existing products without
  inferring a discount, sale, promotion, urgency, code, or deadline.
- `product-launch`: a new product, collection, drop, or restock.
- `promotion`: a campaign around explicit supplied offer details.

### Provider boundary

The core campaign function receives a configured provider object:

```ts
const result = await generateCampaign(input, {
  provider: createAnthropicProvider({
    apiKey: process.env.ANTHROPIC_API_KEY,
  }),
  trace: false,
});
```

This keeps SDK configuration and credentials outside the campaign engine
without creating a public provider-plugin system.

### Guided CLI boundary

Guided mode is desirable final polish, not an engine or release blocker.

- It uses the canonical normaliser, schemas, validators, engine, renderer, and
  output handler.
- It owns no business logic or goal mapping.
- Complete explicit commands, CI, pipes, non-TTY use, `--json`,
  `--no-interactive`, and help never prompt.
- It shows the equivalent explicit command before confirmation.
- It is deferred if it cannot remain a thin input adapter.

### Compliance placeholders

Renderer-owned compliance chrome contains Punch template placeholders:

```text
{{unsubscribe_url}}
{{physical_address}}
```

They are not universal ESP syntax. Translation and replacement are necessary
but not sufficient for lawful sending. Callers remain responsible for consent,
identity, address, unsubscribe, destination, and jurisdiction requirements.

### Invalid output

If final validation fails:

- top-level `email.html` is absent;
- `validation.json` is written;
- `campaign.json` may be written with `invalid` status;
- normal trace artifacts are written only with `--trace`;
- `trace/rejected-email.html` may be retained with `--trace`, clearly marked
  invalid in `trace/manifest.json`.

## Generated email scope

The generated block allowlist is:

1. `header-standard`;
2. `hero-stacked`;
3. `heading`;
4. `body-paragraph`;
5. `product-feature`;
6. `product-grid`;
7. `discount-code`;
8. `cta-block`.

Physical address and unsubscribe are fixed renderer chrome. Editorial,
testimonial, statistics, callout, social-footer, editor, and hosted-icon
surfaces are excluded.

Supported campaign structures include:

- single-product hero and spotlight;
- one featured product with supporting products;
- two-to-six-product grids;
- product collections or selections;
- repeated product sections when coherent;
- campaign-level introduction and conclusion;
- correct product-level CTAs.

## Phase 1 artifacts

| Artifact                                       | Purpose                                                            |
| ---------------------------------------------- | ------------------------------------------------------------------ |
| `AGENTS.md`                                    | Punch-only durable product, engineering, safety, and Git authority |
| `docs/phase-1-plan.md`                         | Approved boundary, authority, sequence, and review gate            |
| `docs/extraction-allowlist.md`                 | Closed file/function candidate list                                |
| `docs/candidate-classification.md`             | Source, prompt, fixture, asset, and dependency disposition         |
| `docs/bootstrap-specification.md`              | Local repository, module, CLI, artifact, and checkpoint design     |
| `docs/ownership-security-publication-gates.md` | Evidence gates before copying and publication                      |

No runtime code, prompt body, fixture, snapshot, asset, dependency, or package
manifest belongs in the Phase 1 commit.

## Phase 2 checkpoint order

Phase 2 is not authorised by this plan. When separately approved, it proceeds
through reviewable checkpoints:

1. Port the semantic schemas and generation engine.
2. Produce valid campaign JSON from one fixed, newly fictional fixture.
3. Port the export-only renderer against that fixed campaign fixture.
4. Produce strong standalone HTML without live extraction.
5. Connect brand and product extraction to generation.
6. Add stable product IDs and product-to-block binding.
7. Add deterministic cross-product validation.
8. Connect the explicit CLI and output writer.
9. Add deeper claim validation and revision behaviour.

Do not combine fetching, extraction, generation, rendering, grounding,
validation, CLI, and packaging into one undifferentiated step.

Each checkpoint must keep every supplied product required. Checkpoint 6 adds
explicit identity metadata; earlier fixed fixtures must already preserve all
products by construction and cannot be treated as safe for general input until
checkpoints 6–7 pass.

## Phase 1 completion gate

Phase 1 is ready for review when:

- only the six named documentation artifacts exist;
- Git history contains one local documentation-only commit;
- no remote is configured;
- no private source, prompt body, fixture, snapshot, asset, or history was
  copied;
- every candidate category has an explicit disposition;
- unresolved ownership/security/licence/publication gates name an owner and
  required evidence;
- Phase 2 remains unstarted.

Approval of Phase 1 does not authorise Phase 2, a remote, publication, or
package release.
