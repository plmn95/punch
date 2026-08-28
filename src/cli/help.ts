export const CLI_HELP = `Punch — grounded ecommerce email generation

Usage:
  punch generate --website <url> --product <url>... --goal <goal> --output <directory>

Required:
  --website <url>           Brand website
  --product <url>           Product page; repeat one to six times
  --goal <goal>             sales | product-launch | promotion
  --output <directory>      New output directory

Optional:
  --instructions <text>     Additional bounded campaign direction
  --offer <text>            Required with the promotion goal
  --discount-code <code>    Structured promotion code
  --offer-ends-at <iso>     ISO-8601 promotion deadline with offset
  --trace                   Write redacted structured stage traces
  --json                    Emit exactly one JSON result on stdout
  --force                   Fail closed unless atomic replacement is supported
  --no-interactive          Explicitly disable guided input
  --help                    Show this help
  --version                 Show the installed version

Environment:
  ANTHROPIC_API_KEY         Required for generation; never written to output
`;
