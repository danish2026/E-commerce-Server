import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsNotEmpty, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePurchaseItemDto {
  @ApiProperty({
    description: 'Item name',
    example: 'Laptop',
  })
  @IsString()
  @IsNotEmpty({ message: 'Item is required' })
  item: string;

  @ApiPropertyOptional({
    description: 'Item description',
    example: 'HP Pavilion 14-inch',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Quantity of items',
    example: 2,
    minimum: 1,
  })
  @Type(() => Number)
  @IsNumber({}, { message: 'Quantity must be a number' })
  @IsNotEmpty({ message: 'Quantity is required' })
  @Min(1, { message: 'Quantity must be at least 1' })
  quantity: number;

  @ApiProperty({
    description: 'Price per item',
    example: 55000.0,
    minimum: 0,
  })
  @Type(() => Number)
  @IsNumber({}, { message: 'Price must be a number' })
  @IsNotEmpty({ message: 'Price is required' })
  @Min(0, { message: 'Price must be a positive number' })
  price: number;

  @ApiProperty({
    description: 'Total price of items',
    example: 110000.0,
  })
  @Type(() => Number)
  @IsNumber({}, { message: 'Total must be a number' })
  @IsNotEmpty({ message: 'Total is required' })
  @Min(0, { message: 'Total must be a positive number' })
  total: number;

  @ApiPropertyOptional({
    description: 'Purchase ID to link this item to a purchase',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  @IsOptional()
  purchaseId?: string;

  @ApiPropertyOptional({
    description: 'Supplier name (used to find matching purchase)',
    example: 'Supplier ABC',
  })
  @IsString()
  @IsOptional()
  supplier?: string;

  @ApiPropertyOptional({
    description: 'Buyer name (used to find matching purchase)',
    example: 'Buyer XYZ',
  })
  @IsString()
  @IsOptional()
  buyer?: string;
}