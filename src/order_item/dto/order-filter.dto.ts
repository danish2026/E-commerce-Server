import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsDateString, IsInt, Min, Max, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentType } from '../../common/enums/payment-type.enum';

export class OrderFilterDto {
  @ApiPropertyOptional({
    description: 'Free text search across order number, customer name, and customer phone',
    example: 'ORD-123',
  })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({
    description: 'Return orders with createdAt on or after this date',
    example: '2024-01-01',
  })
  @IsDateString({}, { message: 'fromDate must be a valid date string' })
  @IsOptional()
  fromDate?: string;

  @ApiPropertyOptional({
    description: 'Return orders with createdAt on or before this date',
    example: '2024-12-31',
  })
  @IsDateString({}, { message: 'toDate must be a valid date string' })
  @IsOptional()
  toDate?: string;

  @ApiPropertyOptional({
    description: 'Filter orders by payment type',
    enum: PaymentType,
    example: PaymentType.CASH,
  })
  @IsEnum(PaymentType, { message: 'Invalid payment type' })
  @IsOptional()
  paymentType?: PaymentType;

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

