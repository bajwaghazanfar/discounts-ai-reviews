import { useActionData, useLoaderData, useNavigation } from "@remix-run/react";
import {
  BlockStack,
  Box,
  Button,
  Card,
  DataTable,
  InlineStack,
  Layout,
  Page,
  Text,
} from "@shopify/polaris";
import { DiscountMethod } from "app/types/types";
import { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { returnToDiscounts } from "app/utils/navigation";
import {
  getPaginatedReviewsByProductId,
  UploadImageToReview,
} from "app/models/reivew.server";
import { Product, Review } from "@prisma/client";
import { reverse } from "dns";
import { ImageUpload } from "app/components/ImageUpload/ImageUpload";
import { CommentNotSpamUserErrorCode } from "app/types/admin.types";

export const action = async ({ params, request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const file = formData.get("file") as File;
  const reviewId = Number(formData.get("reviewId"));

  if (!file || !reviewId) {
    return { error: "Missing file or reviewId", status: 400 };
  }

  const imageUrl = await UploadImageToReview(request, reviewId, file);

  return null;
};

interface ProductWithReview {
  id: string;
  title: string;
  reviews: Review[];
}
interface LoaderData {
  data: ProductWithReview;
}
export const loader = async ({ params, request }: LoaderFunctionArgs) => {
  const { productId } = params;

  if (productId != undefined) {
    const productsWithReviews = await getPaginatedReviewsByProductId(
      request,
      productId,
    );
    return { data: productsWithReviews };
  } else {
    return null;
  }
};
export default function EditDiscount() {
  const navigation = useNavigation();
  const { data } = useLoaderData<LoaderData>();
  console.log(data, "data");
  const transformReviewRowData = () => {
    console.log(data);
    return data.product.reviews.map((review) => [
      review.author,
      new Date(review.createdAt).toLocaleDateString(),
      review.imageUrl ? (
        <img src={review.imageUrl} alt="Review" width={50} />
      ) : (
        "No image"
      ),
      review.rating.toFixed(1),
      review.title,
      review.testimonial,
      <ImageUpload reviewId={review.id} existingImageUrl={review.imageUrl} />,
    ]);
  };
  return (
    <Page title="Discount Functions">
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                View All your generated reviews for {data.title}
              </Text>
              <Text as="p" variant="bodyMd">
                Take a look at all generated reviews below
              </Text>
            </BlockStack>

            {
              <DataTable
                columnContentTypes={[
                  "text",
                  "text",
                  "text",
                  "numeric",
                  "text",
                  "text",
                ]}
                headings={[
                  "Author",
                  "Created At",
                  "Image",
                  "Rating",
                  "Title",
                  "Testimonial",
                  "Actions",
                ]}
                rows={transformReviewRowData()}
                totals={[]}
              />
            }
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
