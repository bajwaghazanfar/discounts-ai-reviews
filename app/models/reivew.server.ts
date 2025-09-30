import db from "../db.server";
import { GoogleGenAI } from "@google/genai";
import { getProductByIds } from "./products.server";
import { authenticate } from "app/shopify.server";
import { uploadImageToShopify } from "./shopify-utils.server";
import { IPaginatedReviewsResponse, IReviewsResponse } from "app/types/types";
import { Product } from "@prisma/client";

export async function getPaginatedReviewsByProductId(
  request: Request,
  id: string,
  page: number = 1,
  pageSize: number = 10,
): Promise<IPaginatedReviewsResponse> {
  console.log(page, pageSize);
  let constructedId = "";
  if (id.includes("gid://shopify/Product")) {
    constructedId = id;
  } else {
    constructedId = `gid://shopify/Product/${id}`;
  }

  const skip = (page - 1) * pageSize;

  const productWithReviewsNoFilter = await db.product.findFirst({
    where: { id: constructedId },
    include: { reviews: true },
  });
  let averageRating = 0;

  if (productWithReviewsNoFilter != null) {
    const total = productWithReviewsNoFilter.reviews.reduce(
      (sum, r) => sum + r.rating,
      0,
    );
    averageRating = total / productWithReviewsNoFilter.reviews.length;
  }
  const productWithReviews = await db.product.findFirst({
    where: { id: constructedId },
    include: {
      reviews: {
        skip: skip,
        take: pageSize,
        orderBy: [
          { imageUrl: "desc" },
          { like: "desc" },
          { rating: "desc" },
          { createdAt: "desc" },
        ],
      },
    },
  });

  const totalReviews = await db.review.count({
    where: { productId: constructedId },
  });

  const totalPages = Math.ceil(totalReviews / pageSize);

  return {
    product: productWithReviews,
    averageRating: averageRating.toFixed(2),
    meta: {
      currentPage: page,
      pageSize: pageSize,
      totalItems: totalReviews,
      totalPages: totalPages,
    },
  };
}

export async function getReviewsByProductId(
  request: Request,
  id: string,
): Promise<IReviewsResponse | null> {
  let constructedId = "";
  if (id.includes("gid://shopify/Product")) {
    constructedId = id;
  } else {
    constructedId = `gid://shopify/Product/${id}`;
  }

  const productWithReviews = await db.product.findFirst({
    where: { id: constructedId },
    include: { reviews: true },
  });

  if (!productWithReviews) {
    return null;
  }
  let averageRating = 0;
  const total = productWithReviews.reviews.reduce(
    (sum, r) => sum + r.rating,
    0,
  );
  averageRating = total / productWithReviews.reviews.length;
  return {
    product: productWithReviews,
    averageRating: averageRating.toFixed(2),
  };
}

export async function getAllProductsWithReviews(request: Request) {
  // 1. Fetch all products and include their related reviews
  const productsWithReviews = await db.product.findMany({
    include: {
      reviews: true, // This tells Prisma to also fetch all related review records
    },
  });

  return productsWithReviews;
}

export async function generateReviewsForProduct(
  request: Request,
  productId: string,
  numberOfReviews: number,
) {
  const product = await getProductByIds(request, [productId]);

  const reviews = await generateReviewViaPrompt(
    product[0].description,
    product[0].id,
    numberOfReviews,
  );

  const parsedReviews = JSON.parse(reviews);

  // Use a transaction to ensure both operations succeed or fail together.
  await db.$transaction(async (prisma) => {
    // 1. Create the product if it doesn't exist, or just use the existing one.
    // The upsert method is perfect for this.
    await prisma.product.upsert({
      where: { id: productId },
      update: {}, // We don't need to update anything on an existing product here
      create: { id: productId, title: product[0].title }, // Create the product with just the ID
    });
    await prisma.review.createMany({
      data: parsedReviews,
    });
  });

  return true;
}

const generateReviewViaPrompt = async (
  description: string,
  id: string,
  numberOfReviews: number,
) => {
  const ai = new GoogleGenAI({
    apiKey: process.env.GOOGLE_API_KEY,
  });
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: `Generate ${numberOfReviews} review for a product with the following description: "${description}". `,
    config: {
      systemInstruction: `You are a helpful assistant that generates product reviews. The reviews must be in JSON format and adhere to the following structure: { "rating": number, "author": string,"title" :string, "imageUrl": string, "productId": string, "testimonial": string, "like":int }. The title should be a maximum of 5 words.The description should be maximum 40 words. Make sure you make the Image URL an empty string. The rating is between 1-5 but out of the amount you generate, generate a mixture of numbers but more 4 and 5. For the productId field use this productId:${id}. For like make it a decent numbe somewhere between 10 - 100. For companyResponse make it a meaningful response based off of the testimonial you have generated, only include a company response for some of them(15%-20% of them). With the testimonal, make it more human like, so some gramattical errors etc.. `,
      responseMimeType: "application/json",
      responseSchema: {
        type: "array",
        items: {
          type: "object",
          properties: {
            rating: {
              type: "number",
              minimum: 1,
              maximum: 5,
            },
            author: {
              type: "string",
            },
            imageUrl: {
              type: "string",
            },
            productId: {
              type: "string",
            },
            testimonial: {
              type: "string",
              maxLength: 100,
            },
            title: {
              type: "string",
              maxLength: 100,
            },
            companyResponse: {
              type: "string",
              maxLength: 100,
            },
            like: {
              type: "int",
            },
          },
          required: [
            "rating",
            "author",
            "imageUrl",
            "productId",
            "testimonial",
            "title",
            "like",
          ],
        },
      },
    },
  });
  return response.candidates[0].content?.parts[0].text;
};

export async function UploadImageToReview(
  request: Request,
  reviewId: number,
  file: File,
) {
  const { admin } = await authenticate.admin(request);
  const url = await uploadImageToShopify(request, file);

  await db.review.update({
    where: { id: reviewId },
    data: {
      imageUrl: url,
    },
  });

  return true;
}
