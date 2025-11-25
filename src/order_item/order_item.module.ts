import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderItemService } from './order_item.service';
import { OrderItemController } from './order_item.controller';
import { OrderItem } from './order_item.entity';
import { Order } from './order.entity';
import { ProductsModule } from '../products/products.module';
import { Product } from '../products/product.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([OrderItem, Order, Product]),
    ProductsModule,
  ],
  controllers: [OrderItemController],
  providers: [OrderItemService],
  exports: [OrderItemService],
})
export class OrderItemModule {}
