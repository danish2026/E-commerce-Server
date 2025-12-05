import { ApiProperty } from '@nestjs/swagger';
import {
    ArrayMinSize,
    IsArray,
    IsEnum,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsString,
    IsUUID,
    Min,
    ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentType } from '../../common/enums/payment-type.enum';

export class CreateOrderItemDto {
    @ApiProperty({
        description: 'Product identifier',
        example: '123e4567-e89b-12d3-a456-426614174000',
    })
    @IsUUID()
    productId: string;

    @ApiProperty({
        description: 'Quantity to bill (units)',
        example: 2,
    })
    @IsNumber({ maxDecimalPlaces: 2 })
    @Type(() => Number)
    @Min(1)
    quantity: number;
}

export class CreateOrderDto {
    @ApiProperty({
        description: 'Customer name for the invoice',
        example: 'John Doe',
        required: false,
    })
    @IsOptional()
    @IsString()
    customerName?: string | null;

    @ApiProperty({
        description: 'Customer phone number',
        example: '+91-9876543210',
        required: false,
    })
    @IsOptional()
    @IsString()
    customerPhone?: string | null;

    @ApiProperty({
        description: 'Discount applied to the order',
        example: 50,
        required: false,
    })
    @IsOptional()
    @IsNumber({ maxDecimalPlaces: 2 })
    @Type(() => Number)
    @Min(0)
    discount?: number;

    @ApiProperty({
        description: 'Payment method used for the order',
        enum: PaymentType,
        example: PaymentType.CASH,
    })
    @IsNotEmpty()
    @IsEnum(PaymentType)
    paymentType: PaymentType;

    @ApiProperty({
        description: 'Order line items with product reference and quantity',
        type: [CreateOrderItemDto],
    })
    @IsArray()
    @ArrayMinSize(1)
    @ValidateNested({ each: true })
    @Type(() => CreateOrderItemDto)
    items: CreateOrderItemDto[];
}
