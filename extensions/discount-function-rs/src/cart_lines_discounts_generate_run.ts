// @ts-check

import {
  CartInput,
  CartLinesDiscountsGenerateRunResult,
  ProductDiscountSelectionStrategy,
} from "../generated/api";

/**
 * @typedef {import("../generated/api").Input} CartInput
 * @typedef {import("../generated/api").CartLinesDiscountsGenerateRunResult} CartLinesDiscountsGenerateRunResult
 * @typedef {import("../generated/api").CartLine} CartLine
 */

/**
 * cartLinesDiscountsGenerateRun
 * @param {CartInput} input - The CartInput
 * @returns {CartLinesDiscountsGenerateRunResult} - The function result with discounts.
 */
export function cartLinesDiscountsGenerateRun(
  input: CartInput,
): CartLinesDiscountsGenerateRunResult {
  const { mainProduct, productGiftIds } = parseMetafield(
    input.discount.metafield,
  );

  if (!mainProduct || productGiftIds.length === 0) {
    return { operations: [] };
  }

  let mainProductCartLine = null;
  let giftCartLine = [];

  for (const line of input.cart.lines) {
    console.log(
      line.id,
      line.merchandise.product.id,
      mainProduct,
      "ASKJDLFALKDS",
    );
    const productId =
      "product" in line.merchandise ? line.merchandise.product.id : null;

    if (!productId) continue;

    if (productId === mainProduct) {
      mainProductCartLine = line;
    }

    if (productGiftIds.includes(productId)) {
      giftCartLine.push(line);
    }
  }

  if (!mainProductCartLine) {
    return { operations: [] };
  }

  const candidates = [];

  // ✅ BOGO: Every 2 units => 1 free
  const quantity = mainProductCartLine.quantity;
  const freeUnits = Math.floor(quantity / 2);

  if (freeUnits > 0) {
    candidates.push({
      message: "Buy One Get One Free",
      targets: [
        {
          cartLine: {
            id: mainProductCartLine.id,
            quantity: freeUnits,
          },
        },
      ],
      value: {
        percentage: {
          value: 100,
        },
      },
    });
  }

  // ✅ Free Gift: only 1 of the first matching gift
  giftCartLine.map((line) => {
    candidates.push({
      message: "Free Gift",
      targets: [
        {
          cartLine: {
            id: line.id,
            quantity: 1,
          },
        },
      ],
      value: {
        percentage: {
          value: 100,
        },
      },
    });
  });

  if (candidates.length === 0) {
    return { operations: [] };
  }

  return {
    operations: [
      {
        productDiscountsAdd: {
          candidates: candidates,
          selectionStrategy: ProductDiscountSelectionStrategy.All,
        },
      },
    ],
  };
}

/**
 * Parses the function configuration metafield JSON.
 */
function parseMetafield(metafield) {
  try {
    console.log(metafield, "METAFIELD");
    const value = JSON.parse(metafield?.value || "{}");
    console.log(value.mainProductId, "mainProductId");
    console.log(value.productGiftIds, "productGiftIds");
    return {
      mainProduct: value.mainProductId ?? null,
      productGiftIds: value.productGiftIds ?? [],
    };
  } catch (error) {
    console.error("Error parsing metafield", error, metafield);
    return {
      mainProduct: null,
      productGiftIds: [],
    };
  }
}
