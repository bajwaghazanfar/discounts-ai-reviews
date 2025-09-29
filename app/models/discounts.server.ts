import { DiscountMethod } from "app/types/types";
import {
  CREATE_CODE_DISCOUNT,
  CREATE_AUTOMATIC_DISCOUNT,
  UPDATE_CODE_DISCOUNT,
  UPDATE_AUTOMATIC_DISCOUNT,
  GET_DISCOUNT,
  GET_ALL_DISCOUNTS,
} from "../graphql/discounts";
import { authenticate } from "../shopify.server";
import type { DiscountClass } from "../types/admin.types";

interface BaseDiscount {
  functionId?: string;
  title: string;
  combinesWith: {
    orderDiscounts: boolean;
    productDiscounts: boolean;
    shippingDiscounts: boolean;
  };
  discountClasses: DiscountClass[];
  startsAt: Date;
  endsAt: Date | null;
}

interface DiscountConfiguration {
  mainProductId: string;
  productGiftIds?: string[];
}

interface UserError {
  code?: string;
  message: string;
  field?: string[];
}

export async function createCodeDiscount(
  request: Request,
  baseDiscount: BaseDiscount,
  code: string,
  usageLimit: number | null,
  appliesOncePerCustomer: boolean,
  configuration: DiscountConfiguration,
) {
  const { admin } = await authenticate.admin(request);
  const response = await admin.graphql(CREATE_CODE_DISCOUNT, {
    variables: {
      discount: {
        ...baseDiscount,
        title: code,
        code,
        usageLimit,
        appliesOncePerCustomer,
        metafields: [
          {
            namespace: "$app:example-discounts--ui-extension",
            key: "function-configuration",
            type: "json",
            value: JSON.stringify({
              mainProductId: configuration.mainProductId,
              productGiftIds: configuration.productGiftIds,
            }),
          },
        ],
      },
    },
  });

  const responseJson = await response.json();

  return {
    errors: responseJson.data.discountCreate?.userErrors as UserError[],
    discount: responseJson.data.discountCreate?.codeAppDiscount,
  };
}

export async function createAutomaticDiscount(
  request: Request,
  baseDiscount: BaseDiscount,
  configuration: DiscountConfiguration,
) {
  const { admin } = await authenticate.admin(request);
  const response = await admin.graphql(CREATE_AUTOMATIC_DISCOUNT, {
    variables: {
      discount: {
        ...baseDiscount,
        metafields: [
          {
            namespace: "$app:example-discounts--ui-extension",
            key: "function-configuration",
            type: "json",
            value: JSON.stringify({
              mainProductId: configuration.mainProductId,
              productGiftIds: configuration.productGiftIds,
            }),
          },
        ],
      },
    },
  });

  const responseJson = await response.json();

  return {
    errors: responseJson.data.discountCreate?.userErrors as UserError[],
  };
}

export async function updateCodeDiscount(
  request: Request,
  id: string,
  baseDiscount: BaseDiscount,
  code: string,
  usageLimit: number | null,
  appliesOncePerCustomer: boolean,
  configuration: {
    metafieldId: string;
    cartLinePercentage: number;
    orderPercentage: number;
    deliveryPercentage: number;
    collectionIds?: string[];
  },
) {
  const { admin } = await authenticate.admin(request);
  const discountId = id.includes("gid://")
    ? id
    : `gid://shopify/DiscountCodeNode/${id}`;

  const response = await admin.graphql(UPDATE_CODE_DISCOUNT, {
    variables: {
      id: discountId,
      discount: {
        ...baseDiscount,
        title: code,
        code,
        usageLimit,
        appliesOncePerCustomer,
        metafields: [
          {
            id: configuration.metafieldId,
            value: JSON.stringify({
              cartLinePercentage: configuration.cartLinePercentage,
              orderPercentage: configuration.orderPercentage,
              deliveryPercentage: configuration.deliveryPercentage,
              collectionIds:
                configuration.collectionIds?.map((id) =>
                  id.includes("gid://") ? id : `gid://shopify/Collection/${id}`,
                ) || [],
            }),
          },
        ],
      },
    },
  });

  const responseJson = await response.json();
  return {
    errors: responseJson.data.discountUpdate?.userErrors as UserError[],
  };
}

export async function updateAutomaticDiscount(
  request: Request,
  id: string,
  baseDiscount: BaseDiscount,
  configuration: {
    metafieldId: string;
    mainProductId: string;
    productGiftIds?: string[];
  },
) {
  const { admin } = await authenticate.admin(request);
  const discountId = id.includes("gid://")
    ? id
    : `gid://shopify/DiscountAutomaticApp/${id}`;

  const response = await admin.graphql(UPDATE_AUTOMATIC_DISCOUNT, {
    variables: {
      id: discountId,
      discount: {
        ...baseDiscount,
        metafields: [
          {
            id: configuration.metafieldId,
            value: JSON.stringify({
              mainProductId: configuration.mainProductId,
              productGiftIds: configuration.productGiftIds,
            }),
          },
        ],
      },
    },
  });

  const responseJson = await response.json();
  return {
    errors: responseJson.data.discountUpdate?.userErrors as UserError[],
  };
}

export async function getDiscount(request: Request, id: string) {
  const { admin } = await authenticate.admin(request);
  const response = await admin.graphql(GET_DISCOUNT, {
    variables: {
      id: `${id}`,
    },
  });

  const responseJson = await response.json();
  if (
    !responseJson.data.discountNode ||
    !responseJson.data.discountNode.discount
  ) {
    return { discount: null };
  }

  const method =
    responseJson.data.discountNode.discount.__typename === "DiscountCodeApp"
      ? DiscountMethod.Code
      : DiscountMethod.Automatic;

  const {
    title,
    codes,
    combinesWith,
    usageLimit,
    appliesOncePerCustomer,
    startsAt,
    endsAt,
    discountClasses,
  } = responseJson.data.discountNode.discount;
  const configuration = JSON.parse(
    responseJson.data.discountNode.configurationField.value,
  );

  return {
    discount: {
      title,
      method,
      code: codes?.nodes[0]?.code ?? "",
      combinesWith,
      discountClasses,
      usageLimit: usageLimit ?? null,
      appliesOncePerCustomer: appliesOncePerCustomer ?? false,
      startsAt,
      endsAt,
      configuration: {
        ...configuration,
        metafieldId: responseJson.data.discountNode.configurationField.id,
      },
    },
  };
}

export async function getAllDiscounts(request: Request) {
  const { admin } = await authenticate.admin(request);
  const response = await admin.graphql(GET_ALL_DISCOUNTS);
  const responseJson = await response.json();
  return responseJson.data.discountNodes;
}
