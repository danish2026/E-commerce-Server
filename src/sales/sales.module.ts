import { Module } from '@nestjs/common';
import { SalesController } from './sales.controller';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [AuthModule, UsersModule],
  controllers: [SalesController],
})
export class SalesModule {}

