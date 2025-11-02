import { Product } from '../product.schema';

/**
 * Pagination and filtering parameters for product queries
 */
export interface FindAllProductsParams {
  page: number;
  limit: number;
  search?: string;
  sortBy?: string;
  fields?: string;
  event?: string;
  category?: string;
  attributesRaw?: string;
}

/**
 * Options for finding related products
 */
export interface FindRelatedProductsOptions {
  page: number;
  limit: number;
  search?: string;
  sortBy?: string;
  fields?: string;
}

/**
 * Paginated response structure for product lists
 */
export interface PaginatedProductResponse<T = Product> {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  data: T[];
}

/**
 * MongoDB filter object for product queries
 */
export interface ProductFilter {
  $or?: Array<{
    name?: { $regex: string; $options: string };
    description?: { $regex: string; $options: string };
  }>;
  category?: string;
  event?: string;
  [key: string]: any; // For dynamic attribute filters
}

/**
 * Parsed attributes for filtering
 */
export interface ParsedAttributes {
  [key: string]: string[];
}

/**
 * Sort configuration for MongoDB queries
 */
export type SortConfig = Record<string, 1 | -1>;

/**
 * MongoDB projection for selecting specific fields
 */
export type FieldProjection = Record<string, 1>;

/**
 * Price range filter for related products
 */
export interface PriceRangeFilter {
  $gte: number;
  $lte: number;
}

/**
 * Comment with type-safe structure (includes _id for existing comments)
 */
export interface CommentWithId {
  _id: string;
  userId: string;
  content: string;
  images: string[];
  rating: number;
  likes: string[];
  replies: ReplyWithId[];
  createdAt: Date;
}

/**
 * Reply with type-safe structure (includes _id for existing replies)
 */
export interface ReplyWithId {
  _id: string;
  userId: string;
  content: string;
  images: string[];
  likes: string[];
  createdAt: Date;
}

/**
 * New comment data structure (before saving to database)
 */
export interface NewCommentData {
  userId: string;
  content: string;
  images: string[];
  rating: number;
  createdAt: Date;
  likes: string[];
  replies: ReplyWithId[];
}

/**
 * New reply data structure (before saving to database)
 */
export interface NewReplyData {
  _id: string;
  userId: string;
  content: string;
  images: string[];
  likes: string[];
  createdAt: Date;
}

/**
 * Product update data with optional fields
 */
export interface ProductUpdateData {
  name?: string;
  slug?: string;
  category?: string;
  price?: number;
  discountPrice?: number;
  discountPercent?: number;
  description?: string;
  attributes?: Record<string, any>;
  images?: string[];
  stock?: number;
  event?: string;
}

/**
 * Top selling product response (limited fields)
 */
export interface TopSellingProduct {
  _id?: string;
  name: string;
  images: string[];
  soldQuantity: number;
}
