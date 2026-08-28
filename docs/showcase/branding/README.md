# One campaign, two brand profiles

These are real browser captures of Punch's HTML renderer, not image-generated
mockups. Both use the same fictional Soft Orbit campaign. Only the brand
settings and viewport differ; the product, copy, price and destination links
are unchanged.

| Preview                          | Brand settings         | Capture       | Maximum README display width |
| -------------------------------- | ---------------------- | ------------- | ---------------------------- |
| [Blue desktop](blue-desktop.jpg) | [blue.json](blue.json) | 820 × 1000 px | 520 px                       |
| [Dark mobile](dark-mobile.jpg)   | [dark.json](dark.json) | 390 × 1000 px | 250 px                       |

The JPEGs are original browser captures with no extra compression or upscaling.
They show the upper part of each email; the complete HTML includes the closing
CTA and Punch's compliance placeholders. The mobile layout is a real responsive
render, not a resized desktop screenshot. Installed fonts may affect line breaks
on another machine.

## Reproduce the HTML without an API key

From the repository root, after installing dependencies:

```bash
npm run build

node dist/cli/bin.js render \
  --campaign docs/showcase/branding/campaign.json \
  --brand docs/showcase/branding/blue.json \
  --output ./showcase-blue

node dist/cli/bin.js render \
  --campaign docs/showcase/branding/campaign.json \
  --brand docs/showcase/branding/dark.json \
  --output ./showcase-dark
```

Both output directories must be new. Open each `email.html` in a browser, or
add `--interactive` to review settings and open a preview through the CLI.
To try a different accent, add `--primary-colour "#006644"`; explicit flags
override the selected profile.

## Provenance and limits

[`campaign.json`](campaign.json) is the public
[single-product renderer fixture](../../../tests/fixtures/checkpoint-4/single-product.json)
with the placeholder product image omitted. It intentionally demonstrates
Punch's image-free rendering and requires no external image requests. Its
reserved `.example.com` links are fictional, not working shop destinations.

The screenshots were captured from the same content with local fixture links
for browser interaction checks. The committed campaign keeps the original
reserved-domain destinations; this does not change the visible rendering.

The profiles are explicit inputs, not evidence of automatic website detection.
No AI call, fresh source fetch or product-grounding claim is made by this
showcase. The render command produces `render-only` validation and zero model
usage. Browser verification is not certification across all email clients.

The separate [Northstar Goods live-generation record](../README.md) retains the
original end-to-end generation evidence. See [brand settings](../../brand-settings.md)
for detection behaviour, contrast checks and the TypeScript integration.
