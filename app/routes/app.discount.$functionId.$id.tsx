import { useActionData, useLoaderData, useNavigation } from "@remix-run/react";
import { Page, Text } from "@shopify/polaris";
import {
  createAutomaticDiscount,
  createCodeDiscount,
  getDiscount,
  updateAutomaticDiscount,
} from "app/models/discounts.server";
import { DiscountMethod } from "app/types/types";
import { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { returnToDiscounts } from "app/utils/navigation";
import { DiscountForm } from "app/components/DiscountForm/DiscountForm";
import { getProductByIds } from "app/models/products.server";
import { NotFoundPage } from "app/components/NotFoundPage/NotFoundPage";

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

// [START build-the-ui.add-action]
export const action = async ({ params, request }: ActionFunctionArgs) => {
  const { id, functionId } = params;
  if (!id) throw new Error("No discount ID provided");

  const formData = await request.formData();
  const discountData = formData.get("discount");
  if (!discountData || typeof discountData !== "string") {
    throw new Error("No discount data provided");
  }

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

  result = await updateAutomaticDiscount(
    request,
    id,
    baseDiscount,
    configuration,
  );

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

interface LoaderData {
  discount: {
    title: string;
    method: DiscountMethod;
    code: string;
    combinesWith: {
      orderDiscounts: boolean;
      productDiscounts: boolean;
      shippingDiscounts: boolean;
    };
    discountClasses: DiscountClass[];
    usageLimit: number | null;
    appliesOncePerCustomer: boolean;
    startsAt: string;
    endsAt: string | null;
    configuration: {
      mainProductId: string;
      metafieldId?: string;
      productGiftIds?: string[];
    };
  } | null;
  mainProduct: Product;
  productGifts: Product[];
}

export const loader = async ({ params, request }: LoaderFunctionArgs) => {
  const { functionId, id } = params;

  if (!id) throw new Error("No discount ID provided");

  const { discount } = await getDiscount(request, id);

  const productGifts = discount?.configuration?.productGiftIds
    ? await getProductByIds(request, discount.configuration.productGiftIds)
    : [];
  const mainProduct = discount?.configuration?.mainProductId
    ? await getProductByIds(request, [discount?.configuration?.mainProductId])
    : [];

  return { discount, productGifts, mainProduct: mainProduct[0] };
};

export default function EditDiscount() {
  const actionData = useActionData<ActionData>();
  const {
    mainProduct,
    productGifts,
    discount: rawDiscount,
  } = useLoaderData<LoaderData>();
  const navigation = useNavigation();
  const isLoading = navigation.state === "submitting";
  const submitErrors =
    actionData?.errors?.map((error) => ({
      ...error,
      field: error.field || [],
    })) || [];

  if (!rawDiscount) {
    return <NotFoundPage />;
  }

  // Transform the discount data to match expected types
  const initialData = {
    ...rawDiscount,
    method: rawDiscount.method,
    discountClasses: rawDiscount.discountClasses,
    combinesWith: {
      orderDiscounts: rawDiscount.combinesWith.orderDiscounts,
      productDiscounts: rawDiscount.combinesWith.productDiscounts,
      shippingDiscounts: rawDiscount.combinesWith.shippingDiscounts,
    },
    usageLimit: rawDiscount.usageLimit,
    appliesOncePerCustomer: rawDiscount.appliesOncePerCustomer,
    startsAt: rawDiscount.startsAt,
    endsAt: rawDiscount.endsAt,
    configuration: {
      ...rawDiscount.configuration,
      mainProductId: rawDiscount.configuration.mainProductId,
      productGiftIds: rawDiscount.configuration.productGiftIds || [],
      metafieldId: rawDiscount.configuration.metafieldId,
    },
  };

  return (
    <Page>
      <ui-title-bar title={`Edit ${rawDiscount.title}`}>
        <button variant="breadcrumb" onClick={returnToDiscounts}>
          Discounts
        </button>
      </ui-title-bar>

      <DiscountForm
        initialData={initialData}
        mainProduct={mainProduct}
        productGifts={productGifts}
        isEditing={true}
        isLoading={isLoading}
        submitErrors={submitErrors}
        success={actionData?.success}
      />
    </Page>
  );
}
