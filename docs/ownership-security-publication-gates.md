# Punch ownership, security, and publication gates

Status: active Phase 2 gate register. No private source transfer, public
licence, remote, publication, or package release is currently approved.

## Gate semantics

- `Closed`: named evidence exists and the named owner accepted it.
- `Open`: evidence or owner acceptance is missing; the affected action is
  blocked.
- `Deferred`: the gate cannot be evaluated until a later checkpoint produces a
  candidate.
- `Hold`: a terminal gate that remains closed to action even if technical
  checks pass, until Plamen explicitly approves it.

Technical success never closes an ownership, visual, legal, remote, or
publication decision on Plamen's behalf. Any newly discovered private,
third-party, customer, security, or licensing material reopens the relevant
gate.

## Current register

| ID     | Gate                                                   | Status   | Owner                                  | Evidence required to close                                                                                                                                                                |
| ------ | ------------------------------------------------------ | -------- | -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| BND-1  | `0.1.0` product and extraction boundary                | Closed   | Plamen                                 | 29 July 2026 approval record with SHA-256 `631ddb064357fd503e6877fcdc7ef9a2a97a41fb893393e13e169ade037b953c`                                                                              |
| SRC-1  | Private source pin and closed allowlist, planning only | Closed   | Plamen                                 | Source commit `1853897ce1325de262cc3b5b9a430abe0452d8ad`; exact file/function hashes in the allowlist; no transfer authority                                                              |
| P1-REV | Phase 1 documentation baseline review                  | Closed   | Plamen                                 | Plamen approved commit `a299cdf11abaec0c93ccec19e894f320f5ee74fe` on 29 July 2026                                                                                                         |
| P2-C1  | Phase 2 checkpoint 1 review                            | Closed   | Plamen                                 | Plamen approved commit `7225f2b3ab6adac669f842558912167c854ec876` on 29 July 2026                                                                                                         |
| P2-C2  | Phase 2 checkpoint 2 review                            | Closed   | Plamen                                 | Plamen approved commit `20c83ca4f300eda4a1d82751a206c8ed46704a39` on 29 July 2026                                                                                                         |
| P2-C3  | Phase 2 checkpoint 3 review                            | Closed   | Plamen                                 | Plamen approved commit `ce0e9305181579d599a64a2171bc9c7a0a54e638` on 29 July 2026                                                                                                         |
| P2-C4  | Phase 2 checkpoint 4 review                            | Closed   | Plamen                                 | Plamen approved commit `205236ec9ad0b1c196c222ed19ac46e560d0f831` and its eight exact rendered states on 29 July 2026                                                                     |
| P2-C5  | Phase 2 checkpoint 5 review                            | Open     | Plamen                                 | Exact local extraction commit, hardened-fetch/security evidence, deterministic parser and model-fallback proof, input-to-generation integration, package review, and Plamen approval      |
| OWN-1  | Copyright ownership/assignment for code candidates     | Open     | Plamen or designated rights reviewer   | Written evidence covering every copied/adapted source surface, including employee/contractor assignment and intentional open-source redistribution                                        |
| IP-1   | Prompt and model-material rights                       | Open     | Plamen or designated rights reviewer   | Per-prompt authorship, assignment, public-release decision, content review, source hash, destination, and transfer/rewrite disposition                                                    |
| NAME-1 | Punch name, package name, and marks                    | Open     | Plamen                                 | Search and decision for repository, package registry, binary name, domain/mark conflicts, and required attribution                                                                        |
| LIC-1  | Punch project licence                                  | Open     | Plamen or designated rights reviewer   | Chosen licence, compatibility review for transferred code and dependencies, notices policy, and reviewed `LICENSE`/notice files                                                           |
| FIX-1  | Fictional fixtures and tests                           | Open     | Implementation reviewer                | Newly authored provenance ledger and scan proving no customer, real-brand, private-eval, or copied campaign material                                                                      |
| AST-1  | Bundled assets                                         | Deferred | Plamen                                 | Empty asset set or per-asset creator/source/licence/modification/redistribution ledger; no source/Punchline/placeholder assets                                                            |
| DEP-1  | Dependency and supply-chain review                     | Open     | Implementation reviewer                | Fresh lockfile; direct/transitive licence and notice inventory; vulnerability, install-script, maintenance, version, provenance, and packed-size review                                   |
| SEC-1  | Candidate secret, PII, and private-reference scan      | Deferred | Security reviewer designated by Plamen | Clean working-tree, Git-object, generated-output, and package-tarball scans plus manual review; findings resolved without recording secret values                                         |
| SEC-2  | Hardened public fetching                               | Closed   | Implementation reviewer                | Checkpoint-5 hardened-fetch matrix and independent security PASS recorded in `docs/checkpoint-5.md`                                                                                       |
| SEC-3  | Source-content and prompt-injection containment        | Open     | Implementation reviewer                | Tests proving fetched content cannot change instructions, tools, provider/model, paths, stages, or policy; bounded/delimited model input; malicious fictional fixture passes safely       |
| SEC-4  | Product identity and factual grounding                 | Deferred | Implementation reviewer                | Single- and six-product tests proving required coverage, no unknown IDs, no cross-product fact/image/link/CTA mixing, conflict handling, and unsupported-claim failure                    |
| SEC-5  | Filesystem and output safety                           | Deferred | Implementation reviewer                | Tests for traversal, symlink swap/TOCTOU, hard links, forged marker, special files, cross-filesystem/unsupported exchange, permissions, interruption, rollback, and arbitrary directories |
| SEC-6  | Provider, credential, deadline, and error safety       | Open     | Implementation reviewer                | Injected-provider, deadline, cancellation, JSON stdout, and secret/PII canary tests across errors, campaign, validation, and traces; no key reads in core                                 |
| PRIV-1 | Trace and data disclosure                              | Deferred | Plamen                                 | Field-level allowlists, versioned redaction policy, opt-in/cap/deletion behaviour, canary tests, no raw payloads/snippets, and Anthropic/remote-image disclosure                          |
| CMP-1  | Compliance-placeholder documentation                   | Deferred | Plamen                                 | Public docs state placeholder replacement is necessary but not sufficient and assign consent, identity, address, unsubscribe, destination, and jurisdiction responsibility to callers     |
| PKG-1  | Package contents and reproducibility                   | Open     | Implementation reviewer                | Clean clone/install/build/test; binary/import smoke tests; deterministic packed-file list; tarball inspection; no instructions, traces, private refs, fixtures, or unapproved assets      |
| QA-1   | Functional release quality                             | Deferred | Plamen                                 | All six fictional evaluations, deterministic validators, failure artefacts, explicit CLI, output writer, and documented checks pass                                                       |
| VIS-1  | Standalone email visual quality                        | Closed   | Plamen                                 | Plamen approved checkpoint-4 commit `205236ec9ad0b1c196c222ed19ac46e560d0f831` and all 820px/390px image and image-free renders on 29 July 2026                                           |
| DOC-1  | Public documentation and claims                        | Deferred | Plamen                                 | Install/use/privacy/compliance/security/limitations documentation reviewed; no claim that output is automatically ready to send                                                           |
| HIST-1 | Public-history boundary                                | Open     | Plamen                                 | Decision whether internal Phase 1 extraction records are public; review proves no private source history, object, patch, or unapproved internal path is reachable                         |
| REM-1  | Remote creation                                        | Hold     | Plamen                                 | Separate explicit approval naming host, repository, owner, visibility, initial history, and remote name                                                                                   |
| PUB-1  | First push/publication                                 | Hold     | Plamen                                 | All applicable gates closed, exact candidate commit identified, final diff/tarball reviewed, and separate explicit push/publication authority                                             |

“Security reviewer” and “rights reviewer” are roles, not presumed third
parties. Plamen may perform or designate them.

Checkpoint 2 supplies reviewed provenance and a clean delta scan for its one
fixed fictional fixture. `FIX-1` remains Open because the later six-case
fictional evaluation set does not yet exist. The fixture-specific association
proof does not close `SEC-4`, and one deterministic campaign does not close
`QA-1` or `VIS-1`.

Checkpoint 3 independently implements the export-only renderer without a
private-source transfer. Its fixture-specific structural proof and dependency
inventory do not close `DEP-1`, `PKG-1`, `SEC-4`, `QA-1`, or `VIS-1`.

Plamen approved checkpoint 3's exact local commit on 29 July 2026. Checkpoint 4
adds independently written renderer quality, two newly fictional campaign
fixtures, eight deterministic final-HTML checks, adversarial validator review,
and exact Chrome-reviewed desktop/mobile evidence. Plamen approved its exact
commit and all eight rendered states on 29 July 2026, closing `P2-C4` and
`VIS-1`. This does not close `FIX-1`, `DEP-1`, `PKG-1`, `SEC-4`, or `QA-1`.

Checkpoint 5 independently adds hardened fetching, deterministic source
extraction, bounded brand-tone classification, and an internal
extraction-to-generation connection. Its adversarial matrix and independent
security review close `SEC-2`. `P2-C5`, `SEC-3`, `SEC-4`, `SEC-6`, `DEP-1`,
`PKG-1`, and the broader release gates remain open, deferred, or held.

## Ownership extraction ledger

Before every `Extract` or `Adapt` action, add a reviewed pre-transfer ledger
entry with:

- authorised Phase 2 task identifier and exact scope;
- allowlist row and source SHA-256;
- named functions or line-bounded surface;
- author(s) and employment/contract assignment evidence;
- third-party or copied influence, if any;
- destination path and expected modification;
- dependency and licence implications;
- `extract`, `adapt`, or `rewrite` disposition;
- reviewer and date.

After the change is committed, append a post-transfer review record with the
Punch commit, destination diff, candidate-scan result, tests, and any deviation.
Do not try to place a commit's own future hash inside that commit.

Repository access, Git authorship, or current possession is not ownership
evidence. If ownership is unclear, the only safe default is an independent
Punch rewrite from the public product/schema requirement, with no copied source
text.

The same ledger discipline applies to prompt bodies. General generation
architecture can be retained, but literal prompt wording remains held until
IP-1 closes.

## Fixture and asset rules

All tests and examples must use newly fictional material:

- invented brands and products;
- reserved domains such as `example.com`, `example.org`, or a local fixture
  origin;
- newly authored factual descriptions and campaign copy;
- newly authored price/currency conflicts and malicious instructions;
- generated or self-created images with recorded rights, when an image is
  necessary.

Do not lightly rename a real brand, shuffle a private campaign, recolour a
private palette, or regenerate a snapshot and call it fictional. The
provenance record must show independent creation.

Punch `0.1.0` can ship without bundled imagery. Omitting assets is preferred to
publishing uncertain logos, icons, screenshots, fonts, product photos, or
placeholder-service dependencies.

## Security acceptance criteria

### Network boundary

One shared fetcher must protect brand HTML, product HTML, and stylesheet
requests. It must:

- accept only credential-free `http:` and `https:` URLs;
- reject userinfo, local paths, `file:`, sockets, ambient cookies, proxies, and
  private/non-routable IPv4 and IPv6;
- reject a hostname when any resolved A/AAAA answer is non-public, pin an
  accepted public address, verify the connected peer, and repeat all checks for
  every redirect;
- fetch stylesheets only from the exact final website origin—scheme, hostname,
  and effective port—not an eTLD+1 “site”; ignore CSS imports and script
  execution;
- apply DNS, peer, redirect-origin, MIME, byte, deadline, and cancellation
  checks independently to every stylesheet;
- enforce per-response and total document, redirect, concurrency, compressed,
  decompressed, and time limits;
- share cancellation across fetch and provider work.

Tests must cover loopback, link-local, RFC1918, unique-local IPv6, IPv4-mapped
IPv6, alternate numeric encodings, mixed public/private answers, DNS rebinding,
redirect-to-private, cross-origin CSS and redirect escape,
oversized/chunked/compression-bomb responses, wrong MIME, slow streams, and
abort cleanup.

### Model boundary

- Sanitise, delimit, and length-limit all source and user fields.
- Label source content as untrusted evidence, never instructions.
- Source content cannot select tools, model, provider, prompt version, network
  targets, file paths, output policy, or validation outcome.
- Zod schemas and deterministic validators remain authoritative after every
  model call and repair.
- Critical facts are observed, conflicted, or unknown; no model inference
  promotes them to observed truth.
- Critique/revision receives per-product evidence and revises at most once.

### Product binding

For every input product ID, deterministic validation compares:

- canonical source URL;
- name;
- amount and currency as one fact;
- image URL;
- availability when stated;
- CTA URL;
- structured offer association.

A campaign fails if a product is omitted, an unknown product appears, a fact
moves between products, or a product CTA points elsewhere. Good prose or model
confidence cannot override this failure.

### Filesystem and traces

- Resolve and validate every output component before writing.
- Never follow a destination link, write through a hard link, or recursively
  clear an arbitrary path.
- Revalidate directory identity immediately before publication to catch
  symlink swaps and other time-of-check/time-of-use changes.
- Stage output on the destination filesystem and publish only a complete
  validated set.
- `--force` requires a compatible marker, exact artifact list and digests, no
  unrelated entries, and an atomic directory exchange. Fail closed when
  exchange is unsupported; never merge or overwrite files in place.
- Traces are opt-in, artifact-field-allowlisted, byte-capped, and redacted under
  a manifest-recorded policy version.
- Traces exclude raw pages, response headers, environment values, provider/model
  payloads, free-form completions, and error snippets.
- Secret and PII canaries must not survive into errors, `campaign.json`,
  `validation.json`, or any trace artifact.
- Rejected HTML is trace-only and explicitly invalid in
  `trace/manifest.json`.

## Candidate and history scans

Before any remote is created, scan both the candidate working tree and every
reachable Punch Git object for:

- credentials, API keys, tokens, cookies, connection strings, and private
  endpoints;
- email addresses, personal data, customer/merchant names, and private domains;
- Punchline-hosted/R2 URLs, absolute private paths, `.env` values, and source
  repository metadata;
- excluded prompts, fixtures, snapshots, assets, generated campaigns, and
  instruction/mailbox files;
- large or unexpected binaries;
- dependency/vendor trees and build outputs.

Repeat the scan against the exact package tarball and generated example output.
Report findings as categories and locations, never by echoing a secret value.

A prior planning-time screen of the private source history found no
high-confidence credential in 2,828 blobs across 417 commits, with 15 binary
objects and roughly 47.6 MB inspected. That is negative context only. The
private history is never publishable, and the exact Punch candidate still
requires SEC-1.

## Licence and dependency review

Before selecting a project licence:

1. Close OWN-1 and IP-1 for anything transferred.
2. Inventory direct and transitive dependency licences and notices.
3. Review copied/adapted comments, tests, algorithms, and generated material.
4. Decide whether extraction records and private-source references remain in
   public history.
5. Review the proposed `LICENSE`, package metadata, notices, and documentation
   together.

Known candidate package licence metadata is only a starting point. A source
package being MIT or BSD licensed does not prove that Punch's own private code,
prompts, fixtures, or assets may be relicensed.

## Compliance and privacy gate

Public documentation must state:

- Punch generates files and does not send email;
- `{{unsubscribe_url}}` and `{{physical_address}}` are neutral Punch template
  placeholders, not universal ESP merge tags;
- callers must translate and populate them and satisfy all destination,
  consent, identity, address, unsubscribe, and jurisdiction requirements;
- output is not ready for lawful sending merely because validation passed;
- bounded source content is sent to Anthropic;
- remote images in HTML may be requested by an eventual recipient's email
  client;
- traces may contain business/product content and require careful retention.

This is product disclosure and release gating, not a claim of legal advice or
universal compliance.

## Publication sequence

No step may be skipped:

1. Obtain Plamen's review approval for the Phase 1 documentation commit.
2. Before each source transfer, close ownership and prompt/IP gates for that
   exact surface and obtain a separately authorised Phase 2 task.
3. Complete the incremental Phase 2 checkpoints on local Punch history.
4. Close remaining licence, fixture, asset, dependency, security, privacy,
   compliance, package, factual, and visual gates.
5. Build and inspect the exact clean candidate, reachable Git objects,
   generated examples, and package tarball.
6. Record the exact candidate commit and unresolved non-blocking limitations.
7. Obtain Plamen's approval of the candidate, licence, initial public-history
   boundary, remote host/owner/name/visibility, and publication plan.
8. Under separate authority, create the remote.
9. Under separate authority, push the exact approved history.
10. Verify remote visibility, reachable objects, default branch, release
    contents, package contents, and published checks.

Step 1 and Phase 2 checkpoints 1–4 are complete. Checkpoint 5 has entered local
review; no later checkpoint or steps 2–10 are authorised or complete. The
absence of a remote is an intentional safety condition, not missing work.
