import {
  Button,
  BlockStack,
  InlineStack,
  Link,
  Divider,
} from "@shopify/polaris";
import { DeleteIcon } from "@shopify/polaris-icons";
import { useCallback } from "react";
interface Product {
  id: string;
  title: string;
}

interface ResourcePickerResponse {
  id: string;
  title: string;
}

interface SingleProductPickerProps {
  onSelect: (selectedProduct: { id: string; title: string } | null) => void;
  selectedProductId: string;
  product?: Product;
  buttonText?: string;
  multiple: boolean | number;
}

export function SingleProductPicker({
  onSelect,
  selectedProductId,
  product,
  buttonText = "Select products",
  multiple,
}: SingleProductPickerProps) {
  const handleSelect = useCallback(async () => {
    const selected = await window.shopify.resourcePicker({
      type: "product",
      action: "select",
      multiple: multiple,
      selectionIds: [
        {
          id: selectedProductId,
        },
      ],
    });

    if (selected) {
      const selectProducts = selected.map(
        (product: ResourcePickerResponse) => ({
          id: product.id,
          title: product.title,
        }),
      );
      onSelect(selectProducts[0]);
    }
  }, [selectedProductId, onSelect]);

  const handleRemove = useCallback(
    (product: Product) => {
      onSelect(null);
    },
    [onSelect, product],
  );

  const selectProductsText = "1 selected";

  return (
    <BlockStack gap="400">
      <Button onClick={handleSelect}>
        {buttonText}
        {selectProductsText}
      </Button>
      {product && (
        <BlockStack gap="200" key={product.id}>
          <InlineStack blockAlign="center" align="space-between">
            <Link
              url={`shopify://admin/products/${product.id.split("/").pop()}`}
              monochrome
              removeUnderline
            >
              {product.title}
            </Link>
            <Button
              variant="tertiary"
              onClick={() => handleRemove(product)}
              icon={DeleteIcon}
            />
          </InlineStack>
          <Divider />
        </BlockStack>
      )}
    </BlockStack>
  );
}
