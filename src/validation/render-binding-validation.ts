import type { Campaign, ProductPresentation } from "../core/schemas/index.js";
import { formatMoney } from "../rendering/render-contract.js";
import {
  collectStartTags,
  exactAttribute,
  markedElementTexts,
  type GeneratedStartTag,
} from "./generated-html.js";

type ProductScope = {
  readonly productId: string;
  readonly scope: string;
};

/** Collects every semantic product presentation in render order. */
function collectProducts(campaign: Campaign): ProductPresentation[] {
  return campaign.blocks.flatMap((block) => {
    if (block.type === "product-feature") {
      return [block];
    }
    return block.type === "product-grid" ? block.items : [];
  });
}

/** Returns structural boundaries that follow one product table. */
function followingBoundaries(
  tags: GeneratedStartTag[],
  productIndex: number,
): number[] {
  return tags.flatMap((tag) => {
    if (tag.index <= productIndex) {
      return [];
    }
    const isProduct =
      exactAttribute(tag, "data-punch-product-id") !== undefined;
    const isBlock = exactAttribute(tag, "data-punch-block-id") !== undefined;
    const isCompliance =
      exactAttribute(tag, "data-punch-compliance") !== undefined;
    return isProduct || isBlock || isCompliance ? [tag.index] : [];
  });
}

/** Slices product scopes using only generated structural attributes. */
function collectProductScopes(html: string): ProductScope[] {
  const tags = collectStartTags(html);
  const productTags = tags.filter(
    (tag) =>
      tag.name === "table" &&
      exactAttribute(tag, "data-punch-product-id") !== undefined,
  );
  return productTags.flatMap((tag) => {
    const productId = exactAttribute(tag, "data-punch-product-id");
    if (productId === undefined) {
      return [];
    }
    const boundaries = followingBoundaries(tags, tag.index);
    const end = boundaries.length === 0 ? html.length : Math.min(...boundaries);
    return [{ productId, scope: html.slice(tag.index, end) }];
  });
}

/** Checks one optional marked product fact against its rendered text. */
function optionalFactPasses(
  scope: string,
  marker: string,
  productId: string,
  expected: string | undefined,
): boolean {
  const values = markedElementTexts(scope, marker, productId);
  return expected === undefined
    ? values.length === 0
    : values.length === 1 && values[0] === expected;
}

/** Checks the exact name, description, and displayed price for one product. */
function productFactsPass(
  product: ProductPresentation,
  scope: string,
): boolean {
  const names = markedElementTexts(
    scope,
    "data-punch-product-name-for",
    product.productId,
  );
  return (
    names.length === 1 &&
    names[0] === product.name &&
    optionalFactPasses(
      scope,
      "data-punch-product-description-for",
      product.productId,
      product.description,
    ) &&
    optionalFactPasses(
      scope,
      "data-punch-product-price-for",
      product.productId,
      product.price === undefined ? undefined : formatMoney(product.price),
    )
  );
}

/** Checks the only product-scope anchor against its ID, URL, and label. */
function productCtaPasses(
  product: ProductPresentation,
  scope: string,
): boolean {
  const anchors = collectStartTags(scope, "a");
  const labels = markedElementTexts(
    scope,
    "data-punch-cta-for",
    product.productId,
  );
  const anchor = anchors[0];
  return (
    anchors.length === 1 &&
    anchor !== undefined &&
    exactAttribute(anchor, "data-punch-cta-for") === product.productId &&
    exactAttribute(anchor, "href") === product.cta.href &&
    labels.length === 1 &&
    labels[0] === product.cta.label
  );
}

/** Checks the only product-scope image against its state and exact fields. */
function productImagePasses(
  product: ProductPresentation,
  scope: string,
): boolean {
  const table = collectStartTags(scope, "table")[0];
  const images = collectStartTags(scope, "img");
  if (table === undefined) {
    return false;
  }
  if (product.image === undefined) {
    return (
      images.length === 0 &&
      exactAttribute(table, "data-punch-image-state") === "image-free"
    );
  }
  const image = images[0];
  return (
    images.length === 1 &&
    image !== undefined &&
    exactAttribute(table, "data-punch-image-state") === "image" &&
    exactAttribute(image, "data-punch-image-for") === product.productId &&
    exactAttribute(image, "src") === product.image.url &&
    exactAttribute(image, "alt") === product.image.alt
  );
}

/** Checks one complete campaign-to-render product association. */
function productScopePasses(
  product: ProductPresentation,
  scope: string,
): boolean {
  return (
    productFactsPass(product, scope) &&
    productCtaPasses(product, scope) &&
    productImagePasses(product, scope)
  );
}

/** Checks ordered product facts, CTA, and image binding for one campaign. */
export function productBindingPasses(
  campaign: Campaign,
  html: string,
): boolean {
  const products = collectProducts(campaign);
  const scopes = collectProductScopes(html);
  return (
    products.length === scopes.length &&
    products.every(
      (product, index) =>
        scopes[index]?.productId === product.productId &&
        productScopePasses(product, scopes[index]?.scope ?? ""),
    )
  );
}
