import { describe, expect, it } from "vitest";

import {
  CampaignBlockPayloadSchema,
  CampaignDraftPayloadSchema,
  CampaignSchema,
  CritiqueResultSchema,
  CritiqueOutputPayloadSchema,
  RevisionOutputPayloadSchema,
  normaliseCampaignDraft,
  normaliseCritiqueOutput,
} from "../../src/core/schemas/index.js";
import {
  createCampaignPayload,
  createCritiquePayload,
  createRevisionPayload,
} from "../factories.js";

const MINIMAL_BLOCKS = [
  {
    type: "header-standard",
    brandName: "Fictional Merchant",
    homeUrl: "https://merchant.example.com",
  },
  {
    type: "hero-stacked",
    heading: "A fictional collection",
  },
  {
    type: "heading",
    level: 2,
    text: "Choose a product",
  },
  {
    type: "body-paragraph",
    markdown: "Newly authored fixture copy.",
  },
  {
    type: "product-feature",
    productId: "product-01",
    name: "Fictional Product",
    cta: {
      label: "View product",
      href: "https://merchant.example.com/products/item",
    },
  },
  {
    type: "product-grid",
    columns: 2,
    items: [
      {
        productId: "product-01",
        name: "Fictional Product One",
        cta: {
          label: "View one",
          href: "https://merchant.example.com/products/one",
        },
      },
      {
        productId: "product-02",
        name: "Fictional Product Two",
        cta: {
          label: "View two",
          href: "https://merchant.example.com/products/two",
        },
      },
    ],
  },
  {
    type: "discount-code",
    code: "SAVE10",
  },
  {
    type: "cta-block",
    actions: [
      {
        label: "Visit shop",
        href: "https://merchant.example.com",
      },
    ],
  },
] as const;

describe("semantic campaign blocks", () => {
  it("accepts the minimal shape of all eight allowed blocks", () => {
    MINIMAL_BLOCKS.forEach((block) => {
      expect(CampaignBlockPayloadSchema.parse(block).type).toBe(block.type);
    });
  });

  it("rejects unknown blocks, extra keys, and missing product CTAs", () => {
    expect(() =>
      CampaignBlockPayloadSchema.parse({
        type: "raw-html",
        html: "<p>unsafe</p>",
      }),
    ).toThrow();
    expect(() =>
      CampaignBlockPayloadSchema.parse({
        ...MINIMAL_BLOCKS[2],
        unexpected: true,
      }),
    ).toThrow();
    const withoutCta = Object.fromEntries(
      Object.entries(MINIMAL_BLOCKS[4]).filter(([key]) => key !== "cta"),
    );
    expect(() => CampaignBlockPayloadSchema.parse(withoutCta)).toThrow();
  });

  it("enforces grid size, columns, unique products, and item CTAs", () => {
    const grid = MINIMAL_BLOCKS[5];
    expect(() =>
      CampaignBlockPayloadSchema.parse({ ...grid, columns: 1 }),
    ).toThrow();
    expect(() =>
      CampaignBlockPayloadSchema.parse({ ...grid, items: [grid.items[0]] }),
    ).toThrow();
    expect(() =>
      CampaignBlockPayloadSchema.parse({
        ...grid,
        items: [grid.items[0], grid.items[0]],
      }),
    ).toThrow("only once");
    const withoutCta = Object.fromEntries(
      Object.entries(grid.items[1]).filter(([key]) => key !== "cta"),
    );
    expect(() =>
      CampaignBlockPayloadSchema.parse({
        ...grid,
        items: [grid.items[0], withoutCta],
      }),
    ).toThrow();
  });
});

describe("campaign and stage schemas", () => {
  it("assigns deterministic block IDs for the same ordered payload", () => {
    const payload = createCampaignPayload();
    const first = normaliseCampaignDraft(payload);
    const second = normaliseCampaignDraft(payload);

    expect(first).toEqual(second);
    expect(first.blocks.map((block) => block.id)).toEqual([
      "block-01",
      "block-02",
      "block-03",
      "block-04",
    ]);
    expect(CampaignSchema.parse(first)).toEqual(first);
  });

  it("rejects unique block and issue IDs that do not match their positions", () => {
    const campaign = normaliseCampaignDraft(createCampaignPayload());
    const misplacedBlocks = campaign.blocks.map((block, index) => ({
      ...block,
      id: index === 0 ? "block-02" : index === 1 ? "block-01" : block.id,
    }));
    expect(() =>
      CampaignSchema.parse({ ...campaign, blocks: misplacedBlocks }),
    ).toThrow("follow block order");

    const critique = normaliseCritiqueOutput(createCritiquePayload("blocking"));
    expect(() =>
      CritiqueResultSchema.parse({
        issues: critique.issues.map((issue) => ({
          ...issue,
          id: "issue-02",
        })),
      }),
    ).toThrow("follow issue order");
  });

  it("requires a product block and one to forty total blocks", () => {
    const payload = createCampaignPayload();
    expect(() =>
      CampaignDraftPayloadSchema.parse({
        ...payload,
        blocks: [MINIMAL_BLOCKS[0]],
      }),
    ).toThrow("product-bearing");
    expect(() =>
      CampaignDraftPayloadSchema.parse({ ...payload, blocks: [] }),
    ).toThrow();
    expect(() =>
      CampaignDraftPayloadSchema.parse({
        ...payload,
        blocks: Array.from({ length: 41 }, () => MINIMAL_BLOCKS[4]),
      }),
    ).toThrow();
  });

  it("permits discount-code blocks only for promotion", () => {
    const sales = createCampaignPayload();
    expect(() =>
      CampaignDraftPayloadSchema.parse({
        ...sales,
        blocks: [...sales.blocks, MINIMAL_BLOCKS[6]],
      }),
    ).toThrow("promotion goal");
    expect(() =>
      CampaignDraftPayloadSchema.parse(createCampaignPayload("promotion")),
    ).not.toThrow();
  });

  it("assigns deterministic issue IDs and bounds revision references", () => {
    const critique = normaliseCritiqueOutput(createCritiquePayload("blocking"));
    expect(critique.issues[0]?.id).toBe("issue-01");
    expect(() =>
      CritiqueOutputPayloadSchema.parse({
        issues: Array.from(
          { length: 21 },
          () => createCritiquePayload("advisory").issues[0],
        ),
      }),
    ).toThrow();
    expect(() =>
      RevisionOutputPayloadSchema.parse({
        ...createRevisionPayload(),
        addressedIssueIds: ["issue-01", "issue-01"],
      }),
    ).toThrow("unique");
  });
});
