import type { Campaign } from "../core/schemas/index.js";
import {
  gridCellWidth,
  gridImageRole,
  gridImageWidth,
  gridRowWidth,
  type RenderImageRole,
} from "../rendering/render-contract.js";
import {
  collectElementContexts,
  collectStartTags,
  exactAttribute,
  type GeneratedElementContext,
  type GeneratedStartTag,
} from "./generated-html.js";

const FIXED_IMAGE_WIDTHS = {
  feature: 520,
  "grid-2": gridImageWidth(2),
  "grid-3": gridImageWidth(3),
  "grid-4": gridImageWidth(4),
  hero: 520,
  logo: 160,
} satisfies Record<RenderImageRole, number>;

type ExpectedImage = {
  readonly alt: string;
  readonly role: RenderImageRole;
  readonly url: string;
  readonly width: number;
};

/** Finds one block's structural start-tag boundary. */
function blockTag(
  tags: GeneratedStartTag[],
  blockId: string,
): GeneratedStartTag | undefined {
  return tags.find(
    (tag) =>
      tag.name === "tr" &&
      exactAttribute(tag, "data-punch-block-id") === blockId,
  );
}

/** Returns one generated block scope without reading marker-like visible text. */
function blockScope(campaign: Campaign, html: string, blockIndex: number) {
  const block = campaign.blocks[blockIndex];
  if (block === undefined) {
    return "";
  }
  const tags = collectStartTags(html);
  const start = blockTag(tags, block.id)?.index;
  const nextBlock = campaign.blocks[blockIndex + 1];
  const nextIndex =
    nextBlock === undefined ? undefined : blockTag(tags, nextBlock.id)?.index;
  const compliance = tags.find(
    (tag) => exactAttribute(tag, "data-punch-compliance") !== undefined,
  )?.index;
  const end = nextIndex ?? compliance;
  return start === undefined || end === undefined || end <= start
    ? ""
    : html.slice(start, end);
}

/** Returns the exact generated row scopes in order. */
function gridRowScopes(scope: string) {
  const rowTags = collectStartTags(scope, "tr").filter(
    (tag) => exactAttribute(tag, "data-punch-grid-row") !== undefined,
  );
  return rowTags.map((tag, index) => ({
    row: exactAttribute(tag, "data-punch-grid-row"),
    scope: scope.slice(tag.index, rowTags[index + 1]?.index ?? scope.length),
  }));
}

/** Returns the nearest generated ancestor with one element name. */
function nearestAncestor(
  context: GeneratedElementContext,
  name: string,
): GeneratedStartTag | undefined {
  return [...context.ancestors].reverse().find((tag) => tag.name === name);
}

/** Returns every direct table cell in the row that owns the marked grid cells. */
function directGridCells(scope: string): GeneratedStartTag[] {
  const contexts = collectElementContexts(scope);
  const markedCell = contexts.find(
    ({ tag }) =>
      tag.name === "td" &&
      exactAttribute(tag, "data-punch-grid-column") !== undefined,
  );
  const ownerRow = markedCell && nearestAncestor(markedCell, "tr");
  return ownerRow === undefined
    ? []
    : contexts.flatMap((context) =>
        (context.tag.name === "td" || context.tag.name === "th") &&
        nearestAncestor(context, "tr")?.index === ownerRow.index
          ? [context.tag]
          : [],
      );
}

/** Checks one grid row's exact items, table, cells, images, and widths. */
function gridRowPasses(
  block: Extract<Campaign["blocks"][number], { type: "product-grid" }>,
  row: ReturnType<typeof gridRowScopes>[number],
  index: number,
): boolean {
  const items = block.items.slice(
    index * block.columns,
    (index + 1) * block.columns,
  );
  const rowTables = collectStartTags(row.scope, "table").filter(
    (tag) => exactAttribute(tag, "data-punch-grid-row-table") !== undefined,
  );
  const cells = directGridCells(row.scope);
  const images = collectStartTags(row.scope, "img");
  const rowTable = rowTables[0];
  return (
    row.row === String(index + 1) &&
    rowTables.length === 1 &&
    rowTable !== undefined &&
    exactAttribute(rowTable, "width") ===
      gridRowWidth(items.length, block.columns) &&
    cells.length === items.length &&
    cells.every(
      (cell, itemIndex) =>
        cell.name === "td" &&
        exactAttribute(cell, "colspan") === undefined &&
        exactAttribute(cell, "rowspan") === undefined &&
        exactAttribute(cell, "data-punch-grid-column") ===
          items[itemIndex]?.productId &&
        exactAttribute(cell, "width") === gridCellWidth(items.length),
    ) &&
    images.every(
      (image) =>
        exactAttribute(image, "data-punch-image-role") ===
        gridImageRole(block.columns),
    )
  );
}

/** Checks one product grid's exact rows, cells, roles, and widths. */
function gridBlockPasses(
  block: Extract<Campaign["blocks"][number], { type: "product-grid" }>,
  scope: string,
): boolean {
  const gridTables = collectStartTags(scope, "table").filter(
    (tag) => exactAttribute(tag, "data-punch-grid-columns") !== undefined,
  );
  const rows = gridRowScopes(scope);
  const gridTable = gridTables[0];
  if (
    gridTables.length !== 1 ||
    gridTable === undefined ||
    exactAttribute(gridTable, "data-punch-grid-columns") !==
      String(block.columns) ||
    rows.length !== Math.ceil(block.items.length / block.columns)
  ) {
    return false;
  }

  return rows.every((row, index) => gridRowPasses(block, row, index));
}

/** Checks all image roles, widths, and responsive safeguards. */
function expectedImageInventory(campaign: Campaign): ExpectedImage[] {
  const images: ExpectedImage[] = [];
  for (const block of campaign.blocks) {
    if (block.type === "header-standard" && block.logo !== undefined) {
      images.push({ ...block.logo, role: "logo", width: 160 });
    }
    if (block.type === "hero-stacked" && block.image !== undefined) {
      images.push({ ...block.image, role: "hero", width: 520 });
    }
    if (block.type === "product-feature" && block.image !== undefined) {
      images.push({ ...block.image, role: "feature", width: 520 });
    }
    if (block.type === "product-grid") {
      for (const product of block.items) {
        if (product.image !== undefined) {
          images.push({
            ...product.image,
            role: gridImageRole(block.columns),
            width: gridImageWidth(block.columns),
          });
        }
      }
    }
  }
  return images;
}

/** Checks exact campaign image inventory, roles, widths, and safeguards. */
function imageGeometryPasses(campaign: Campaign, html: string): boolean {
  const expected = expectedImageInventory(campaign);
  const actual = collectStartTags(html, "img");
  return (
    actual.length === expected.length &&
    actual.every((tag, index) => {
      const image = expected[index];
      const role = exactAttribute(tag, "data-punch-image-role") as
        RenderImageRole | undefined;
      const width = Number(exactAttribute(tag, "width"));
      const style = exactAttribute(tag, "style") ?? "";
      return (
        image !== undefined &&
        role === image.role &&
        exactAttribute(tag, "src") === image.url &&
        exactAttribute(tag, "alt") === image.alt &&
        width === image.width &&
        role !== undefined &&
        FIXED_IMAGE_WIDTHS[role] === image.width &&
        style.includes("height:auto") &&
        style.includes("max-width:100%")
      );
    })
  );
}

/** Checks every fixed grid and image geometry requirement. */
export function gridGeometryPasses(campaign: Campaign, html: string): boolean {
  const gridsPass = campaign.blocks.every((block, index) =>
    block.type === "product-grid"
      ? gridBlockPasses(block, blockScope(campaign, html, index))
      : true,
  );
  return gridsPass && imageGeometryPasses(campaign, html);
}
