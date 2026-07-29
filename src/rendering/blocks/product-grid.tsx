import type {
  ProductGridBlock,
  ProductPresentation,
} from "../../core/schemas/index.js";
import { EMAIL_WIDTH } from "../render-contract.js";
import { sectionCellStyle } from "../styles.js";
import { BlockFrame, ProductCard } from "./shared.js";

const GRID_HORIZONTAL_PADDING = 80;
const CARD_HORIZONTAL_PADDING = 20;

type ProductGridProps = {
  readonly block: ProductGridBlock;
};

/** Splits products into deterministic rows while preserving their order. */
function createRows(
  items: readonly ProductPresentation[],
  columns: number,
): ProductPresentation[][] {
  const rows: ProductPresentation[][] = [];

  for (let index = 0; index < items.length; index += columns) {
    rows.push(items.slice(index, index + columns));
  }

  return rows;
}

/** Formats an email-table percentage without unstable trailing precision. */
function percentage(value: number): string {
  return `${Number(value.toFixed(4))}%`;
}

/** Renders a centred row whose effective product width follows the grid columns. */
function ProductRow({
  columns,
  items,
  rowIndex,
}: {
  readonly columns: number;
  readonly items: readonly ProductPresentation[];
  readonly rowIndex: number;
}) {
  const rowWidth = percentage((items.length / columns) * 100);
  const cellWidth = percentage(100 / items.length);
  const imageWidth = Math.floor(
    (EMAIL_WIDTH - GRID_HORIZONTAL_PADDING) / columns - CARD_HORIZONTAL_PADDING,
  );

  return (
    <tr data-punch-grid-row={rowIndex + 1}>
      <td align="center" style={{ padding: "0" }}>
        <table
          border={0}
          cellPadding={0}
          cellSpacing={0}
          className="punch-mobile-row"
          data-punch-grid-row-table={rowIndex + 1}
          role="presentation"
          style={{ borderCollapse: "collapse", width: rowWidth }}
          width={rowWidth}
        >
          <tbody>
            <tr>
              {items.map((product) => (
                <td
                  className="punch-mobile-column"
                  data-punch-grid-column={product.productId}
                  key={product.productId}
                  style={{ padding: "10px", verticalAlign: "top" }}
                  width={cellWidth}
                >
                  <ProductCard imageWidth={imageWidth} product={product} />
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </td>
    </tr>
  );
}

/** Renders ordered products in balanced, responsive presentation-table rows. */
export function ProductGrid({ block }: ProductGridProps) {
  const rows = createRows(block.items, block.columns);

  return (
    <BlockFrame
      blockId={block.id}
      blockType={block.type}
      cellStyle={sectionCellStyle}
    >
      <table
        border={0}
        cellPadding={0}
        cellSpacing={0}
        data-punch-grid-columns={block.columns}
        role="presentation"
        style={{ borderCollapse: "collapse", width: "100%" }}
        width="100%"
      >
        <tbody>
          {rows.map((items, rowIndex) => (
            <ProductRow
              columns={block.columns}
              items={items}
              key={items.map((item) => item.productId).join(":")}
              rowIndex={rowIndex}
            />
          ))}
        </tbody>
      </table>
    </BlockFrame>
  );
}
