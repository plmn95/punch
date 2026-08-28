# Contributing to Punch

Thanks for helping make grounded email generation more useful and dependable.

## Before starting

Open an issue before a large change. Small fixes can go directly to a focused
pull request. Punch `0.1.x` stays deliberately narrow: it is an engine and CLI,
not an ESP, catalogue crawler, visual editor or hosted application.

All examples and tests must use newly fictional brands, products, URLs and
copy. Use reserved domains such as `example.com`; never submit customer data,
private prompts, generated client campaigns, credentials or proprietary assets.

## Local setup

```bash
npm ci
npm run check
```

Use Node.js 24 or newer. Tests must not require a live provider key or public
network access.

## Pull requests

- Keep one concept per change.
- Add or update deterministic tests for changed behaviour.
- Keep provider credentials and raw source/provider payloads out of logs,
  errors, fixtures and traces.
- Preserve stable product identity and the required-product invariant.
- Do not add raw model-generated HTML or MJML.
- Run `npm run check` and `npm run pack:check` before requesting review.
- Explain the user-visible consequence and any remaining limitation.

By contributing, you agree that your contribution is licensed under the MIT
licence in this repository.
