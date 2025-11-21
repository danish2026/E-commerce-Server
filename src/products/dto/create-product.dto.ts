import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsUUID,
  IsNumber,
  IsIn,
  MaxLength,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateProductDto {
  @ApiProperty({
    description: 'Product name',
    example: 'iPhone 15 Pro',
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Stock Keeping Unit (SKU) - must be unique',
    example: 'IPH15PRO-256-BLK',
  })
  @IsNotEmpty()
  @IsString()
  sku: string;

  @ApiProperty({
    description: 'Category ID (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsNotEmpty()
  @IsUUID()
  categoryId: string;

  @ApiProperty({
    description: 'Brand name',
    example: 'Apple',
    required: false,
  })
  @IsOptional()
  @IsString()
  brand?: string | null;

  @ApiProperty({
    description: 'Unit of measurement',
    example: 'PCS',
    enum: ['PCS', 'KG', 'BOX'],
  })
  @IsNotEmpty()
  @IsString()
  @IsIn(['PCS', 'KG', 'BOX'])
  unit: string;

  @ApiProperty({
    description: 'GST percentage (0-100)',
    example: 18.0,
    minimum: 0,
    maximum: 100,
  })
  @IsNotEmpty()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  @Type(() => Number)
  gstPercentage: number;

  @ApiProperty({
    description: 'HSN Code',
    example: '85171200',
    required: false,
  })
  @IsOptional()
  @IsString()
  hsnCode?: string | null;

  @ApiProperty({
    description: 'Barcode',
    example: '1234567890123',
    required: false,
  })
  @IsOptional()
  @IsString()
  barcode?: string | null;

  @ApiProperty({
    description: 'Product image URL',
    example: 'https://example.com/images/product.jpg',
    required: false,
  })
  @IsOptional()
  @IsString()
  imageUrl?: string | null;
}
