import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsEnum,
  IsDateString,
  Min,
  IsOptional,
} from 'class-validator';

export enum PaymentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  PARTIAL = 'PARTIAL',
  OVERDUE = 'OVERDUE',
}

export class CreatePurchaseDto {
  @ApiProperty({
    description: 'Supplier name or ID',
    example: 'Supplier ABC',
  })
  @IsString()
  @IsNotEmpty({ message: 'Supplier is required' })
  supplier: string;

  @ApiProperty({
    description: 'Buyer name or ID',
    example: 'Buyer XYZ',
  })
  @IsString()
  @IsNotEmpty({ message: 'Buyer is required' })
  buyer: string;

  @ApiProperty({
    description: 'GST amount or percentage',
    example: 18.0,
  })
  @IsNumber({}, { message: 'GST must be a number' })
  @IsNotEmpty({ message: 'GST is required' })
  @Min(0, { message: 'GST must be a positive number' })
  gst: number;

  @ApiProperty({
    description: 'Purchase amount',
    example: 10000.0,
  })
  @IsNumber({}, { message: 'Amount must be a number' })
  @IsNotEmpty({ message: 'Amount is required' })
  @Min(0, { message: 'Amount must be a positive number' })
  amount: number;

  @ApiProperty({
    description: 'Quantity of items',
    example: 10,
  })
  @IsNumber({}, { message: 'Quantity must be a number' })
  @IsNotEmpty({ message: 'Quantity is required' })
  @Min(1, { message: 'Quantity must be at least 1' })
  quantity: number;

  @ApiProperty({
    description: 'Payment status',
    enum: PaymentStatus,
    example: PaymentStatus.PENDING,
  })
  @IsEnum(PaymentStatus, { message: 'Invalid payment status' })
  @IsNotEmpty({ message: 'Payment status is required' })
  paymentStatus: PaymentStatus;

  @ApiProperty({
    description: 'Due date for payment',
    example: '2024-12-31',
  })
  @IsDateString({}, { message: 'Due date must be a valid date' })
  @IsNotEmpty({ message: 'Due date is required' })
  dueDate: string;

  @ApiPropertyOptional({
    description: 'Total amount (calculated automatically if not provided)',
    example: 11800.0,
  })
  @IsNumber({}, { message: 'Total amount must be a number' })
  @IsOptional()
  @Min(0, { message: 'Total amount must be a positive number' })
  totalAmount?: number;
}
