import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PurchaseItemService } from './purchase-item.service';
import { PurchaseItemController } from './purchase-item.controller';
import { PurchaseItem } from './purchase-item.entity';
import { Purchase } from '../purchase/purchase.entity';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([PurchaseItem, Purchase]),
    AuthModule,
    UsersModule,
  ],
  controllers: [PurchaseItemController],
  providers: [PurchaseItemService],
  exports: [PurchaseItemService],
})
export class PurchaseItemModule {}
