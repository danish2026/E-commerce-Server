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
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateProductDto {
  @ApiProperty({ description: 'Product name', example: 'Sugar 1Kg' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ description: 'SKU - unique', example: 'SUG001' })
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
    example: 'Tata',
    required: false,
  })
  @IsOptional()
  @IsString()
  brand?: string | null;

  @ApiProperty({
    description: 'Unit of measurement',
    example: 'KG',
    enum: ['PCS', 'KG', 'BOX', 'LTR', 'PACK'],
  })
  @IsNotEmpty()
  @IsString()
  @IsIn(['PCS', 'KG', 'BOX', 'LTR', 'PACK'])
  unit: string;

  @ApiProperty({
    description: 'Cost Price (purchase rate)',
    example: 40.5,
  })
  @IsNotEmpty()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Type(() => Number)
  @Min(0)
  costPrice: number;

  @ApiProperty({
    description: 'Selling Price (MRP / billing rate)',
    example: 45.0,
  })
  @IsNotEmpty()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Type(() => Number)
  @Min(0)
  sellingPrice: number;

  @ApiProperty({
    description: 'Available stock',
    example: 100,
  })
  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  stock: number;

  @ApiProperty({
    description: 'GST percentage',
    example: 5,
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
    description: 'Expiry Date',
    example: '2025-12-31',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  expiryDate?: string | null;

  @ApiProperty({
    description: 'HSN Code',
    example: '11010000',
    required: false,
  })
  @IsOptional()
  @IsString()
  hsnCode?: string | null;

  @ApiProperty({
    description: 'Barcode number',
    example: '1234567890123',
    required: false,
  })
  @IsOptional()
  @IsString()
  barcode?: string | null;

  @ApiProperty({
    description: 'Product image URL',
    example: 'https://example.com/sugar.jpg',
    required: false,
  })
  @IsOptional()
  @IsString()
  imageUrl?: string | null;
}
