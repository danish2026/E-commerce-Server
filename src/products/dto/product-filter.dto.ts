import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt, Min, Max, IsUUID, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export class ProductFilterDto {
  @ApiPropertyOptional({
    description: 'Free text search across product name, SKU, and brand',
    example: 'sugar',
  })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by category ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsOptional()
  categoryId?: string;

  @ApiPropertyOptional({
    description: 'Filter products expiring within specified days (e.g., 30 for products expiring in 30 days)',
    example: 30,
    minimum: 1,
  })
  @Type(() => Number)
  @IsInt({ message: 'ExpiringWithinDays must be an integer' })
  @Min(1, { message: 'ExpiringWithinDays must be at least 1' })
  @IsOptional()
  expiringWithinDays?: number;

  @ApiPropertyOptional({
    description: 'Page number (starts from 1)',
    example: 1,
    minimum: 1,
    default: 1,
  })
  @Type(() => Number)
  @IsInt({ message: 'Page must be an integer' })
  @Min(1, { message: 'Page must be at least 1' })
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    example: 10,
    minimum: 1,
    maximum: 100,
    default: 10,
  })
  @Type(() => Number)
  @IsInt({ message: 'Limit must be an integer' })
  @Min(1, { message: 'Limit must be at least 1' })
  @Max(100, { message: 'Limit cannot exceed 100' })
  @IsOptional()
  limit?: number = 10;
}

