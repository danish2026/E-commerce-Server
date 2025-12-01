import { ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateDashboardDto {
    @ApiProperty({
        description: "Today's total revenue",
        example: 1200.50,
    })
    @IsNumber({ maxDecimalPlaces: 2 })
    @Type(() => Number)
    todayRevenue: number;

    @ApiProperty({
        description: "Today's total orders",
        example: 5,
    })
    @IsNumber()
    @Type(() => Number)
    todayOrders: number;

    @ApiProperty({
        description: "This month's total revenue",
        example: 25000.75,
    })
    @IsNumber({ maxDecimalPlaces: 2 })
    @Type(() => Number)
    monthlyRevenue: number;

    @ApiProperty({
        description: "Total number of orders in this month",
        example: 42,
    })
    @IsNumber()
    @Type(() => Number)
    monthlyOrders: number;
}
