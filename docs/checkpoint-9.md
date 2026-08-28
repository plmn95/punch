# Phase 2 checkpoint 9

Status: implemented local review candidate. This checkpoint adds conservative,
source-aware validation for factual claims outside structured product fields.

## Boundary

- Baseline: checkpoint-8 commit `bec4ade`.
- Plamen authorised completion of the extraction and generation engine on 28
  August 2026.
- The implementation and fictional tests are independently authored for Punch.
  No private source, prompt, fixture, asset or campaign was copied or adapted.

This checkpoint evaluates a bounded set of commerce claims that are unsafe to
infer from style or general model confidence. It does not claim to recognise
every possible factual statement or replace human review.

## Claim ownership

Product-feature and product-grid text is checked against the explicitly bound
product. Subject, preheader and identity-free blocks are campaign-level; a
factual claim there must be supported by every supplied product it implicitly
describes.

The deterministic validator covers:

- in-stock, out-of-stock, preorder, backorder and discontinued language;
- percentage promotion language and deadline/urgency phrases;
- free shipping, warranty and money-back guarantees;
- bestseller and award claims;
- organic, sustainability, eco-friendly and handmade claims; and
- clinical or scientific proof claims.

Availability requires the exact observed state. Unknown or conflicted evidence
cannot support a claim. Percentage and urgency language requires a promotion
goal and an exact match in the structured offer. Selected high-risk product
claims require exact text in observed product description evidence; inferred
voice and inferred descriptions are not factual support.

Issue objects contain only a static code and semantic location. They never
contain generated claim text, source evidence, URLs, prompts or provider
content.

## Repair and final acceptance

Emit and revision apply the claim validator through the existing one-attempt
structured repair boundary. A second invalid result fails closed. Critique and
revision prompts now explicitly name the observed-evidence policy and advance
to version 4.

The selected campaign is checked again after the final stage. A successful
public result records both `campaign-grounding` and `campaign-claims` checks
before rendering and output publication.

## Public composition surface

The root package now exposes the semantic renderer and deterministic claim,
grounding and rendered-output validators alongside `generateCampaign()`. This
makes the engine useful as a complete command and as composable TypeScript
infrastructure without introducing an application shell or provider plugin
framework.

## Fictional proof

New tests prove:

- exact product availability passes and mismatched, unknown or campaign-wide
  mixed availability fails;
- a sales campaign cannot invent a discount;
- a promotion can use its structured percentage but cannot substitute another;
- a selected high-risk claim fails without observed product copy and passes
  only with exact observed support;
- issues contain no claim or evidence text;
- invalid availability is repaired before critique; and
- an unsupported claim inside the sole revision receives only that stage's one
  structured repair, not another critique or semantic revision.

## Remaining release work

The engine checkpoints are complete. The remaining work is public packaging:
licence and contributor files, README and examples, CI, dependency and
candidate scans, tarball/import/binary smoke tests, GitHub presentation,
history review and remote verification.
