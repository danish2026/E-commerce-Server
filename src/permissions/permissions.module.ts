import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PermissionsController } from './permissions.controller';
import { PermissionsService } from './permissions.service';
import { Permission } from './permission.entity';
import { Role } from './role.entity';
import { RolePermission } from './role-permission.entity';
import { UsersModule } from '../users/users.module';
import { NestJwtModule } from '../jwt/jwt.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Permission, Role, RolePermission]),
    UsersModule,
    NestJwtModule,
  ],
  controllers: [PermissionsController],
  providers: [PermissionsService],
  exports: [PermissionsService],
})
export class PermissionsModule {}

