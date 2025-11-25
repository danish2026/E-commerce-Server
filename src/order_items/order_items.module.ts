import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
// import { OrdersService } from './order_items.service';

// import { OrdersController } from './order_items.controller';
import { Order } from './order.entity';
import { OrderItem } from 'src/order_item/order_item.entity';
import { Product } from '../products/product.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Order, OrderItem, Product])],
  controllers: [],
  providers: [OrdersService],
})
export class OrdersModule {}
