import {
  Min,
  IsString,
  IsNumber,
  IsOptional,
  IsNotEmpty,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProductDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  name: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  slug: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  category: string;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  @Type(() => Number)
  price: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  discountPrice?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  discountPercent?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description:
      'JSON string of attributes object. Example: {"brand":"Razer","color":"Black"}',
  })
  @IsString()
  @IsNotEmpty()
  attributes: string;

  @ApiProperty({
    default: 0,
    minimum: 0,
  })
  @Min(0)
  @IsNumber()
  @Type(() => Number)
  stock: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  event?: string;
}
