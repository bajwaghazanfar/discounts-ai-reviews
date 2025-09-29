import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import {
  Page,
  Button,
  Layout,
  Card,
  Text,
  BlockStack,
  InlineStack,
  Box,
  DataTable,
} from "@shopify/polaris";

import { getFunctions } from "../models/functions.server";
import { returnToDiscounts } from "../utils/navigation";
import { getAllDiscounts } from "app/models/discounts.server";
import { GenerateReviewForProduct } from "app/components/GenerateReviewForProduct/GenerateReviewForProduct";
import {
  generateReviewsForProduct,
  getAllProductsWithReviews,
} from "app/models/reivew.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const functions = await getFunctions(request);
  const discounts = await getAllDiscounts(request);
  const productsWithReviews = await getAllProductsWithReviews(request);
  return {
    functions: functions,
    discounts: discounts,
    reviews: productsWithReviews,
  };
};

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const productId = formData.get("productId") as string;
  if (!productId) {
    return { error: "No product ID", status: 400 };
  }
  try {
    const generatedReviews = await generateReviewsForProduct(
      request,
      productId,
      50,
    );

    return { reviews: generatedReviews, status: 200 };
  } catch (error) {
    console.error("Failed to generate reviews:", error);
    return { error: "Failed to generate reviews", status: 500 };
  }
}

export default function Index() {
  const { functions, discounts, reviews } = useLoaderData<typeof loader>();

  console.log(functions, discounts, reviews);
  const transformData = (functionId: string) => {
    console.log(functionId, "FunctionIDDD");
    const filteredDiscounts = discounts.nodes.filter((discount) => {
      return discount.discount.appDiscountType.functionId === functionId;
    });

    const mappedData = filteredDiscounts.map((discount) => {
      return [
        discount.discount.title,
        discount.discount.startsAt,
        discount.discount.endsAt ?? "-",
        discount.discount.status,
        discount.discount.appDiscountType.functionId,
        <Button
          url={`/app/discount/${
            discount.discount.appDiscountType.functionId
          }/${encodeURIComponent(discount.id)}`}
          variant="secondary"
        >
          Edit
        </Button>,
      ];
    });

    return mappedData;
  };

  const tranformReviewRowData = () => {
    const transformedData = reviews.map((review) => {
      // Return an array for each row, with the cell data inside
      return [
        review.id,
        review.reviews.length.toString(),
        <Button
          url={`/app/review/${encodeURIComponent(review.id)}`}
          variant="secondary"
        >
          Edit
        </Button>,
      ];
    });

    return transformedData;
  };
  return (
    <Page title="Discount Functions">
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                Welcome to Discount Functions
              </Text>
              <Text as="p" variant="bodyMd">
                Create and manage custom discount functions for your store. Use
                these functions to implement complex discount logic and pricing
                rules.
              </Text>
              <Box paddingBlockStart="400">
                <InlineStack gap="300">
                  <Button onClick={returnToDiscounts}>
                    View all discounts
                  </Button>
                </InlineStack>
              </Box>
            </BlockStack>
          </Card>
        </Layout.Section>

        <Layout.Section>
          {functions != null &&
          functions != undefined &&
          functions.length > 0 &&
          discounts != null &&
          discounts != undefined &&
          discounts.nodes.length > 0 ? (
            <BlockStack gap="400">
              {functions.map((item) => (
                <Card key={item.id}>
                  <InlineStack align="space-between">
                    <Text as="span" variant="bodyMd" fontWeight="bold">
                      {item.title}
                    </Text>
                    <Text as="span" variant="bodyMd" fontWeight="bold">
                      {item.apiVersion}
                    </Text>
                    <Button
                      variant="primary"
                      url={`/app/discount/${item.id}/new`}
                    >
                      Create discount
                    </Button>
                  </InlineStack>

                  <DataTable
                    columnContentTypes={[
                      "text",
                      "text",
                      "text",
                      "text",
                      "text",
                      "text",
                    ]}
                    headings={[
                      "Title",
                      "Starts At",
                      "Ends At",
                      "Status",
                      "Function ID",
                      "Action",
                    ]}
                    rows={transformData(item.id)}
                    totals={[]}
                  />
                </Card>
              ))}
            </BlockStack>
          ) : (
            <Text as="p" variant="bodyMd">
              No functions found, you might need to deploy your app.
            </Text>
          )}
        </Layout.Section>

        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                View All your generated reviews
              </Text>
              <Text as="p" variant="bodyMd">
                Take a look at all generated reviews below
              </Text>
              <Box paddingBlockStart="400">
                <InlineStack gap="300">
                  <GenerateReviewForProduct />
                </InlineStack>
              </Box>
            </BlockStack>

            {reviews != undefined && reviews != null && reviews.length > 0 ? (
              <DataTable
                columnContentTypes={["text", "numeric", "text"]}
                headings={["Product Id", "Review Count", "Action"]}
                rows={tranformReviewRowData()}
                totals={[]}
              />
            ) : (
              <Text as="p" variant="bodyMd">
                No revies found.
              </Text>
            )}
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
