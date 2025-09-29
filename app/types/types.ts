import { Product } from "@prisma/client";

// These enums are used as API types
export enum DiscountMethod {
  Code = "CODE",
  Automatic = "AUTOMATIC",
}

export enum RequirementType {
  None = "NONE",
  Subtotal = "SUBTOTAL",
  Quantity = "QUANTITY",
}

export interface IPaginationMeta {
  currentPage: number;
  pageSize: number;
  totalItems: number; // Total number of reviews available for the product
  totalPages: number;
}
export interface IPaginatedReviewsResponse {
  /** The Product object containing the paginated list of reviews. */
  product: Product | null; // Use '| null' because findFirst might return null
  averageRating: string;

  /** Metadata describing the pagination state. */
  meta: IPaginationMeta;
}

export interface IReviewsResponse {
  product: Product | null;
  averageRating: string;
}
