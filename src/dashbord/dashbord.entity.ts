

// import { ApiProperty } from '@nestjs/swagger';
// import { IsNumber } from 'class-validator';
// import { Type } from 'class-transformer';
// import { Column, ForeignKey, JoinColumn, ManyToOne } from 'typeorm';
// import { OrderItem } from 'src/order-item/order-item.entity';

// export class Dashbord {
//     @ApiProperty({
//         description: "Today's Revenue",
//         example: 1000.50,
//     })
//     @IsNumber({ maxDecimalPlaces: 2 })
//     @Type(() => Number)
//     todayRevenue: number;
    
//     @ForeignKey(() => OrderItem)
//     @JoinColumn({ name: 'OrderItem' })
//     OrderItem: OrderItem;


//     @ApiProperty({
//         description: "Today's Orders",
//         example: 5,
//     })
//     @IsNumber()
//     @Type(() => Number)
//     todayOrders: number;

//     @ApiProperty({
//         description: "Monthly Revenue",
//         example: 25000.75,
//     })
//     @IsNumber({ maxDecimalPlaces: 2 })
//     @Type(() => Number)
//     monthlyRevenue: number;

//     @ApiProperty({
//         description: "Monthly Orders",
//         example: 40,
//     })
//     @IsNumber()
//     @Type(() => Number)
//     monthlyOrders: number;
// }

import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsArray, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { OrderItem } from 'src/billing/order-item.entity';

export class Dashbord {
    @ApiProperty()
    @IsNumber()
    todayRevenue: number;

    @ApiProperty()
    @IsNumber()
    todayOrders: number;

    @ApiProperty()
    @IsNumber()
    monthlyRevenue: number;

    @ApiProperty()
    @IsNumber()
    monthlyOrders: number;

    @ApiProperty()
    @IsNumber()
    totalRevenue: number;

    @ApiProperty()
    @IsNumber()
    totalOrders: number;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsNumber()
    dateRangeRevenue?: number;

    @ApiProperty({ required: false })
    @IsOptional()
    @IsNumber()
    dateRangeOrders?: number;

    @ApiProperty({ type: () => [OrderItem] })
    @IsArray()
    orderItems: OrderItem[];
}
