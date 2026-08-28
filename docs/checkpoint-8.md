# Phase 2 checkpoint 8

Status: implemented local review candidate. This checkpoint makes the existing
engine usable through one explicit command and one public TypeScript API.

## Boundary

- Baseline: `177521fa38ea35e27dd05dcef0f5ea8b253e90ef`.
- Plamen authorised the checkpoint, MIT licensing, public repository work and
  the exact Git operations on 28 August 2026.
- The implementation is an independent Punch change. No private Punchline
  source, fixture, prompt, asset or history was copied or adapted.
- Guided input and email sending remain excluded.

## Public workflow

`generateCampaign()` now composes the existing hardened extraction, semantic
generation, deterministic grounding and standalone renderer. It accepts the
official provider returned by `createAnthropicProvider()` and never reads an
API key itself.

The `punch generate` binary accepts the complete explicit input contract,
preserves repeated product order and never prompts. `--json` writes exactly one
terminal JSON value to stdout. Help and version invocations do not require
credentials. SIGINT and SIGTERM cancel the shared engine signal.

The Anthropic adapter is the only SDK boundary. It owns the current pinned
model ID, disables SDK retries, passes the engine abort signal, normalises token
usage and translates SDK failures without retaining provider payloads, raw
messages or credentials.

## Output publication

A valid invocation publishes a complete sibling staging directory and renames
it atomically into a previously absent destination:

```text
campaign/
├── email.html
├── campaign.json
└── validation.json
```

`--trace` additionally writes allowlisted, structured stage files and a
versioned manifest. Traces exclude raw pages, provider requests and responses,
environment values and error snippets.

The writer rejects an existing destination, linked or non-directory parent
components, unsafe artifact names, linked files and changed parent identity.
It removes only its unguessable task-owned staging directory after failure.
`--force` deliberately fails closed: the supported Node filesystems do not
provide the required portable atomic directory exchange, so Punch never falls
back to an in-place or two-step replacement.

## Package decision

- package and binary: `punch-email` / `punch`;
- release version: `0.1.0`;
- runtime: ESM on Node 24 or newer;
- provider SDK: exact `@anthropic-ai/sdk@0.122.0`, MIT;
- default model: `claude-sonnet-5`;
- project licence decision: MIT, approved by Plamen on 28 August 2026.

The npm registry returned no existing `punch-email` package on the review date.
This is availability evidence, not a trademark conclusion or a registry
reservation.

## Verification

Fresh checkpoint verification on 28 August 2026:

- formatter, lint with zero warnings, TypeScript and build passed;
- all 35 test files and 270 tests passed, including hardened localhost network
  transport tests run outside the filesystem sandbox;
- focused CLI, output and provider coverage added nine passing tests;
- the provider canary test proves raw authentication text and the supplied key
  do not survive the adapter boundary;
- the dry-run package contains 207 allowlisted build/package entries, is 95,199
  compressed bytes and 545,374 unpacked bytes;
- npm audit initially identified two vulnerable transitive development/runtime
  utilities; both were updated within their declared compatible ranges and the
  resulting install reports zero vulnerabilities; and
- the optional macOS-only `fsevents` install script remains unapproved and is
  not part of Punch runtime code.

## Remaining gate

Checkpoint 9 must add deterministic, source-aware evaluation of availability,
promotion and other unsupported factual claims in campaign prose. Public
documentation, package/import/binary smoke tests, candidate/history scans and
remote verification remain publication work after that checkpoint.
