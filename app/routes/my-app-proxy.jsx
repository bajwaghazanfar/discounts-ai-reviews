import { authenticate } from "../shopify.server";
import {
  getPaginatedReviewsByProductId,
  getReviewsByProductId,
} from "../models/reivew.server";

export const loader = async ({ request }) => {
  const { liquid, session } = await authenticate.public.appProxy(request);
  const url = new URL(request.url);
  const productId = url.searchParams.get("product_id");
  const getAllReviews = url.searchParams.get("get_all_reviews");
  const currentPage = url.searchParams.get("current_page");
  const pageSize = url.searchParams.get("page_size");
  if (!productId) {
    return null;
  }
  let result;
  if (getAllReviews == "true") {
    const reviews = await getReviewsByProductId(request, productId);

    result = {
      data: reviews,
    };
  } else {
    const reviews = await getPaginatedReviewsByProductId(
      request,
      productId,
      currentPage != undefined ? parseInt(currentPage) : 1,
      pageSize != undefined ? parseInt(pageSize) : 10,
    );
    result = {
      data: reviews,
    };
  }
  return result;
};
