// import { Module } from '@nestjs/common';
// import { DashbordService } from './dashbord.service';
// import { DashbordController } from './dashbord.controller';

// @Module({
//   controllers: [DashbordController],
//   providers: [DashbordService],
// })
// export class DashbordModule {}


import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashbordService } from './dashbord.service';
import { DashbordController } from './dashbord.controller';
// import { Order } from 'src/order/order.entity';
import { OrderItem } from 'src/billing/order-item.entity';
import { Product } from 'src/products/product.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([ OrderItem, Product])
  ],
  controllers: [DashbordController],
  providers: [DashbordService],
})
export class DashbordModule {}
