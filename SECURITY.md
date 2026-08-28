# Security policy

## Reporting a vulnerability

Please do not open a public issue for a suspected vulnerability. Use GitHub's
private vulnerability reporting for this repository. Include the affected
version, reproduction conditions, impact and a minimal proof that contains no
real credentials or customer data.

You should receive an acknowledgement within seven days. No bounty programme
or response-time guarantee is currently offered.

## Supported version

Security fixes target the latest `0.1.x` release and the current `main` branch.

## Security model

Punch accepts untrusted public webpages and sends bounded, normalised evidence
to Anthropic. Its network layer rejects non-public addresses, credential-bearing
URLs, unsafe redirects, unsupported response types and responses outside fixed
budgets. Generated semantic data is Zod-validated and then checked against
source evidence before rendering.

API keys are accepted by the Anthropic adapter at construction or read by the
CLI from `ANTHROPIC_API_KEY`. They are not ordinary campaign input and must not
be placed in URLs, instructions, traces or committed files.

Traces can contain normalised business and product information. They are opt-in
and should be retained only as long as needed. Punch does not archive raw pages
or raw provider requests and responses in output artifacts.

## Deployment responsibility

Punch generates files and does not send email. Operators remain responsible
for reviewing generated content, replacing compliance placeholders, protecting
output files and credentials, and meeting the requirements of their provider,
destination and jurisdiction.
