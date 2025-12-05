import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { User } from './users/user.entity';
import { PurchaseModule } from './purchase/purchase.module';
import { Purchase } from './purchase/purchase.entity';
import { PurchaseItemModule } from './purchase-item/purchase-item.module';
import { PurchaseItem } from './purchase-item/purchase-item.entity';
import { CategoriesModule } from './categories/categories.module';
import { Category } from './categories/category.entity';
import { ProductsModule } from './products/products.module';
import { Product } from './products/product.entity';
import { PermissionsModule } from './permissions/permissions.module';
import { Permission } from './permissions/permission.entity';
import { Role } from './permissions/role.entity';
import { RolePermission } from './permissions/role-permission.entity';
import { OrderItemModule } from './billing/order-item.module';
import { OrderItem } from './billing/order-item.entity';
import { DashbordModule } from './dashbord/dashbord.module';
// import { ReportModule } from './report/report.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const dbHost = configService.get<string>('DB_HOST') || 'localhost';
        const dbPort = configService.get<number>('DB_PORT') || 3306;
        const dbUser = configService.get<string>('DATABASE_USER');
        console.log("DB USER =>", dbUser);
        const dbPassword = configService.get<string>('DATABASE_PASSWORD');
        const dbName = configService.get<string>('DB_NAME') || configService.get<string>('DATABASE_NAME');

        if (!dbUser || !dbPassword || !dbName) {
          console.error('⚠️  Missing database configuration!');
          console.error('Please set the following environment variables:');
          if (!dbUser) console.error('  - DATABASE_USER');
          if (!dbPassword) console.error('  - DATABASE_PASSWORD');
          if (!dbName) console.error('  - DB_NAME or DATABASE_NAME');
          console.error('See .env.example for reference');
        }

        return {
          type: 'postgres',
          host: dbHost,
          port: dbPort,
          username: dbUser,
          password: String(dbPassword || ''),
          database: dbName,
          entities: [User, Purchase, PurchaseItem, Category, Product, OrderItem, Permission, Role, RolePermission],
          synchronize: configService.get<string>('NODE_ENV') === 'development',
          logging: false,
        };
      },
      inject: [ConfigService],
    }),
    UsersModule,
    AuthModule,
    PurchaseModule,
    PurchaseItemModule,
    CategoriesModule,
    ProductsModule,
    OrderItemModule,
    PermissionsModule,
    DashbordModule,
    // ReportModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
