import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderItemService } from './order-item.service';
import { OrderItemController } from './order-item.controller';
import { OrderItem } from './order-item.entity';
import { Product } from '../products/product.entity';

@Module({
  imports: [TypeOrmModule.forFeature([OrderItem, Product])],
  controllers: [OrderItemController],
  providers: [OrderItemService],
})
export class OrderItemModule { }
