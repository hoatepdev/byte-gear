import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Product } from '../product.schema';

/**
 * Standard API response for single product operations
 */
export class ProductResponseDto {
  @ApiProperty()
  _id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  slug: string;

  @ApiProperty()
  category: string;

  @ApiProperty()
  price: number;

  @ApiProperty()
  discountPrice: number;

  @ApiProperty()
  discountPercent: number;

  @ApiPropertyOptional()
  description?: string;

  @ApiProperty({ type: [String] })
  images: string[];

  @ApiProperty()
  attributes: Record<string, any>;

  @ApiProperty()
  averageRating: number;

  @ApiProperty()
  ratingsCount: number;

  @ApiProperty()
  stock: number;

  @ApiProperty()
  soldQuantity: number;

  @ApiPropertyOptional()
  event?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

/**
 * Paginated response for product list endpoints
 */
export class PaginatedProductResponseDto {
  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  total: number;

  @ApiProperty()
  totalPages: number;

  @ApiProperty({ type: [ProductResponseDto] })
  data: Product[];
}

/**
 * Response for successful product deletion
 */
export class ProductDeleteResponseDto {
  @ApiProperty({ example: 'Product deleted successfully' })
  message: string;
}

/**
 * Response for top selling product
 */
export class TopSellingProductResponseDto {
  @ApiProperty()
  _id: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ type: [String] })
  images: string[];

  @ApiProperty()
  soldQuantity: number;
}
