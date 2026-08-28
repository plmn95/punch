import {
  createAnthropicProvider,
  generateCampaign,
  writeCampaignOutput,
} from "punch-email";

const apiKey = process.env.ANTHROPIC_API_KEY;
if (!apiKey) {
  throw new Error("Set ANTHROPIC_API_KEY before running this example.");
}

const result = await generateCampaign(
  {
    website: "https://example.com",
    products: ["https://example.com/products/first-product"],
    goal: "sales",
  },
  { provider: createAnthropicProvider({ apiKey }) },
);

await writeCampaignOutput(result, "./campaign");
