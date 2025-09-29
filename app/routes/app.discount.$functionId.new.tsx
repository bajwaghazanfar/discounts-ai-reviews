import { useActionData, useLoaderData, useNavigation } from "@remix-run/react";
import { Page, Text } from "@shopify/polaris";
import {
  createAutomaticDiscount,
  createCodeDiscount,
} from "app/models/discounts.server";
import { DiscountMethod } from "app/types/types";
import { ActionFunctionArgs } from "@remix-run/node";
import { returnToDiscounts } from "app/utils/navigation";
import { DiscountForm } from "app/components/DiscountForm/DiscountForm";

export enum DiscountClass {
  /**
   * The discount is combined with an
   * [order discount](https://help.shopify.com/manual/discounts/combining-discounts/discount-combinations)
   * class.
   */
  Order = "ORDER",
  /**
   * The discount is combined with a
   * [product discount](https://help.shopify.com/manual/discounts/combining-discounts/discount-combinations)
   * class.
   */
  Product = "PRODUCT",
  /**
   * The discount is combined with a
   * [shipping discount](https://help.shopify.com/manual/discounts/combining-discounts/discount-combinations)
   * class.
   */
  Shipping = "SHIPPING",
}

export const loader = async () => {
  // Initially load with empty collections since none are selected yet
  return { mainProduct: "", productGiftIds: [] };
};

// [START build-the-ui.add-action]
export const action = async ({ params, request }: ActionFunctionArgs) => {
  const { functionId } = params;

  const formData = await request.formData();
  const discountData = formData.get("discount");
  if (!discountData || typeof discountData !== "string")
    throw new Error("No discount data provided");

  const {
    title,
    method,
    code,
    combinesWith,
    usageLimit,
    appliesOncePerCustomer,
    startsAt,
    endsAt,
    configuration,
  } = JSON.parse(discountData);

  const baseDiscount = {
    functionId,
    title,
    combinesWith,
    discountClasses: [DiscountClass.Product],
    startsAt: new Date(startsAt),
    endsAt: endsAt && new Date(endsAt),
  };

  let result;

  if (method === DiscountMethod.Code) {
    result = await createCodeDiscount(
      request,
      baseDiscount,
      code,
      usageLimit,
      appliesOncePerCustomer,
      {
        mainProductId: configuration.mainProductId,
        productGiftIds: configuration.productGiftIds,
      },
    );
  } else {
    result = await createAutomaticDiscount(request, baseDiscount, {
      mainProductId: configuration.mainProductId,
      productGiftIds: configuration.productGiftIds,
    });
  }

  if (result.errors?.length > 0) {
    return { errors: result.errors };
  }
  return { success: true };
};
// [END build-the-ui.add-action]

interface ActionData {
  errors?: {
    code?: string;
    message: string;
    field: string[];
  }[];
  success?: boolean;
}

type Product = {
  title: string;
  id: string;
};
interface LoaderData {
  mainProduct: Product;
  productGiftIds: Product[];
}

export default function CreateNewDiscount() {
  const actionData = useActionData<ActionData>();
  const { mainProduct, productGiftIds } = useLoaderData<LoaderData>();
  const navigation = useNavigation();
  const isLoading = navigation.state === "submitting";
  const submitErrors = actionData?.errors || [];

  if (actionData?.success) {
    returnToDiscounts();
  }

  const initialData = {
    title: "",
    method: DiscountMethod.Code,
    code: "",
    discountClasses: [],
    combinesWith: {
      orderDiscounts: false,
      productDiscounts: false,
      shippingDiscounts: false,
    },
    usageLimit: null,
    appliesOncePerCustomer: false,
    startsAt: new Date(),
    endsAt: null,
    configuration: {
      mainProductId: "",
      productGiftIds: [],
    },
  };
  return (
    <Page>
      <ui-title-bar title="Create product, order, and shipping discount">
        <button variant="breadcrumb" onClick={returnToDiscounts}>
          Discounts
        </button>
      </ui-title-bar>

      <DiscountForm
        initialData={initialData}
        mainProduct={mainProduct}
        productGifts={productGiftIds}
        isLoading={isLoading}
        submitErrors={submitErrors}
        success={actionData?.success}
      />
    </Page>
  );
}
