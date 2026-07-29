import { describe, expect, it } from "vitest";

import { renderCampaignHtml } from "../../src/rendering/render-campaign-html.js";
import {
  countOccurrences,
  createGridProducts,
  escapePattern,
  FIXED_CAMPAIGN,
  transformCampaign,
} from "./support.js";

const GRID_CASES = [
  {
    columns: 2,
    imageWidth: "240",
    itemCount: 2,
    rows: [{ cellWidth: "50%", itemCount: 2, rowWidth: "100%" }],
  },
  {
    columns: 3,
    imageWidth: "153",
    itemCount: 3,
    rows: [{ cellWidth: "33.3333%", itemCount: 3, rowWidth: "100%" }],
  },
  {
    columns: 4,
    imageWidth: "110",
    itemCount: 6,
    rows: [
      { cellWidth: "25%", itemCount: 4, rowWidth: "100%" },
      { cellWidth: "50%", itemCount: 2, rowWidth: "50%" },
    ],
  },
] as const;

/** Verifies the table widths and product ownership markers for every grid row. */
function expectGridRows(
  html: string,
  items: ReturnType<typeof createGridProducts>,
  rows: (typeof GRID_CASES)[number]["rows"],
): void {
  let itemOffset = 0;
  for (const [rowIndex, row] of rows.entries()) {
    expect(html).toMatch(
      new RegExp(
        `data-punch-grid-row-table="${rowIndex + 1}"[^>]*width="${escapePattern(row.rowWidth)}"`,
        "u",
      ),
    );

    for (const item of items.slice(itemOffset, itemOffset + row.itemCount)) {
      expect(html).toMatch(
        new RegExp(
          `data-punch-grid-column="${item.productId}"[^>]*width="${escapePattern(row.cellWidth)}"`,
          "u",
        ),
      );
    }
    itemOffset += row.itemCount;
  }
}

describe("checkpoint 3 grid geometry", () => {
  it.each(GRID_CASES)(
    "renders a $columns-column grid with correct row geometry",
    async (testCase) => {
      const items = createGridProducts(testCase.itemCount);
      const campaign = transformCampaign(FIXED_CAMPAIGN, (block) =>
        block.type === "product-grid"
          ? { ...block, columns: testCase.columns, items }
          : block,
      );

      const html = await renderCampaignHtml(campaign);

      expect(html).toContain(`data-punch-grid-columns="${testCase.columns}"`);
      expect(
        countOccurrences(html, `width="${testCase.imageWidth}"`),
      ).toBeGreaterThanOrEqual(testCase.itemCount);
      expectGridRows(html, items, testCase.rows);
    },
  );

  it("renders level-three headings and two campaign actions", async () => {
    const campaign = transformCampaign(FIXED_CAMPAIGN, (block) => {
      if (block.type === "heading") {
        return { ...block, level: 3 };
      }
      if (block.type === "cta-block") {
        return {
          ...block,
          actions: [
            ...block.actions,
            {
              label: "View the collection",
              href: "https://kiln-and-leaf.example.com/collections/table",
            },
          ],
        };
      }
      return block;
    });

    const html = await renderCampaignHtml(campaign);

    expect(html).toContain("<h3");
    expect(countOccurrences(html, 'data-punch-role="cta"')).toBe(5);
  });
});
