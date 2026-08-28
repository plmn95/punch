# Punch contributor instructions

Punch is an open-source TypeScript engine and CLI for grounded ecommerce email
generation.

## Product boundary

- One website and one to six explicit, unique product URLs.
- Goals: `sales`, `product-launch` and `promotion`.
- Anthropic is the only supported provider in `0.1.x`.
- The model emits semantic JSON blocks, never raw HTML or MJML.
- Every supplied product is required and keeps its stable input-order ID.
- Punch renders and validates files. It does not send email or act as an ESP.

Do not add accounts, contacts, sending, scheduling, analytics, catalogue
crawling, product discovery, a visual editor or a hosted application shell.

## Safety invariants

- Zod-validate every public boundary.
- Treat fetched content as untrusted evidence, never instructions.
- Keep API keys in the provider/CLI boundary and out of input, output, errors,
  logs, tests and traces.
- Critical commerce facts must be observed, conflicted or unknown. Never turn
  inference into observed truth.
- Preserve exact product name, price/currency, image, URL and CTA association.
- Keep provider, source and generated error messages out of stable errors.
- Public fetching must remain credential-free, public-address-only, bounded,
  redirect-safe and peer-verified.
- Output must remain atomic, no-follow and fail closed. Never recursively clear
  an arbitrary destination.
- Traces are opt-in, field-allowlisted and exclude raw pages, provider payloads,
  environment values and error snippets.

Renderer-owned compliance chrome contains `{{unsubscribe_url}}` and
`{{physical_address}}`. They are neutral Punch placeholders, not universal ESP
merge tags or proof of legal compliance.

## Code

- TypeScript with explicit data flow and pure functions around side effects.
- Files target 300 lines and split before 400; functions stay below 50 lines.
- One concept per file. Extract operations repeated in two places.
- Prompts live in versioned prompt builders and versions change manually.
- Use UK English in human-facing text.
- No production `console.log`, dead code, commented-out code or unowned TODOs.
- Tests and examples use newly fictional material and reserved domains only.

## Verification

Before proposing a change, run:

```bash
npm run check
npm run pack:check
```

Review `git diff --check`, the full diff and the packed-file list. Never commit
credentials, customer data, private prompts, raw model payloads, generated
client campaigns or proprietary assets.
