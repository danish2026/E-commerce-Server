import { PartialType, ApiProperty } from '@nestjs/swagger';
import { CreateOrderItemDto } from './create-order-item.dto';
import { IsOptional, IsString, IsNumber, IsEnum, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentType } from '../../common/enums/payment-type.enum';

export class UpdateOrderItemDto extends PartialType(CreateOrderItemDto) {
	@ApiProperty({ description: 'Customer name for the invoice', example: 'John Doe', required: false })
	@IsOptional()
	@IsString()
	customerName?: string | null;

	@ApiProperty({ description: 'Customer phone number', example: '+91-9876543210', required: false })
	@IsOptional()
	@IsString()
	customerPhone?: string | null;

	@ApiProperty({ description: 'Discount applied to the order', example: 50, required: false })
	@IsOptional()
	@IsNumber({ maxDecimalPlaces: 2 })
	@Type(() => Number)
	@Min(0)
	discount?: number;

	@ApiProperty({ description: 'Payment method used for the order', enum: PaymentType, required: false })
	@IsOptional()
	@IsEnum(PaymentType)
	paymentType?: PaymentType;
}
