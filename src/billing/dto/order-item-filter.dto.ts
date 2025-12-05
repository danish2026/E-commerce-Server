import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsDateString, IsInt, Min, Max, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class OrderItemFilterDto {
  @ApiPropertyOptional({
    description: 'Search by order ID, customer name, or customer phone',
    example: 'John Doe',
  })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({
    description: 'Return order items with createdAt on or after this date',
    example: '2024-01-01',
  })
  @IsDateString({}, { message: 'fromDate must be a valid date string' })
  @IsOptional()
  fromDate?: string;

  @ApiPropertyOptional({
    description: 'Return order items with createdAt on or before this date',
    example: '2024-12-31',
  })
  @IsDateString({}, { message: 'toDate must be a valid date string' })
  @IsOptional()
  toDate?: string;

  @ApiPropertyOptional({
    description: 'Filter by minimum subtotal (totalAmount)',
    example: 100,
  })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @IsOptional()
  minSubtotal?: number;

  @ApiPropertyOptional({
    description: 'Filter by maximum subtotal (totalAmount)',
    example: 1000,
  })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @IsOptional()
  maxSubtotal?: number;

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



