export const CLI_HELP = `Punch — grounded ecommerce email generation

Usage:
  punch                     Start the guide in an interactive terminal
  punch generate --website <url> --product <url>... --goal <goal> --output <directory>
  punch render --campaign <campaign.json> --output <new-directory>

Required:
  --website <url>           Brand website
  --product <url>           Product page; repeat one to six times
  --goal <goal>             sales | product-launch | promotion
  --output <directory>      New output directory

Optional:
  --brand <profile.json>    Load saved brand settings
  --save-brand <new-file>   Save the final settings as a reusable JSON profile
  --primary-colour <hex>    Override the primary colour (#RRGGBB)
  --background-colour <hex> Override the email background
  --text-colour <hex>       Override text (must pass contrast checks)
  --heading-font <family>   Override one heading font family
  --body-font <family>      Override one body font family
  --interactive             Review branding and preview even with complete inputs
  --instructions <text>     Additional bounded campaign direction
  --offer <text>            Required with the promotion goal
  --discount-code <code>    Structured promotion code
  --offer-ends-at <iso>     ISO-8601 promotion deadline with offset
  --trace                   Write redacted structured stage traces
  --json                    Emit exactly one JSON result on stdout
  --force                   Fail closed unless atomic replacement is supported
  --no-interactive          Never prompt (also implied by --json, CI or piped input)
  --help                    Show this help
  --version                 Show the installed version

Environment:
  ANTHROPIC_API_KEY         Required for generation; never written to output

Render reuses existing campaign copy and needs no API key or AI call.
Its validation covers rendering, not fresh product or claim grounding.
Manual flags override a saved profile, which overrides detected website styles.
Custom fonts are named with fallbacks; font files are not downloaded or embedded.
`;
