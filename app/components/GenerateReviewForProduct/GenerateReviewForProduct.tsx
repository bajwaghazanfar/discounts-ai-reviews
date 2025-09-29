import { Button } from "@shopify/polaris";
import { ProductPicker } from "../ProductPicker/ProductPicker";
import { useCallback } from "react";
import { generateReviewsForProduct } from "app/models/reivew.server";
import { useFetcher } from "@remix-run/react";

export function GenerateReviewForProduct() {
  const fetcher = useFetcher();
  const handleMainProductSelect = (
    selectedProduct:
      | { id: string; title: string; descriptionHtml: string }[]
      | null,
  ) => {
    if (selectedProduct && selectedProduct.length > 0) {
      const product = selectedProduct[0];
      const formData = new FormData();
      formData.append("productId", product.id);
      fetcher.submit(formData, { method: "post" });
    }
  };

  return (
    <ProductPicker
      multiple={1}
      buttonText="Generate reviews for a product"
      onSelect={handleMainProductSelect}
    />
  );
}
