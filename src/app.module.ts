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
import { SalesModule } from './sales/sales.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const dbHost = configService.get<string>('DATABASE_HOST') || 'localhost';
        const dbPort = configService.get<number>('DATABASE_PORT') || 5432;
        const dbUser = configService.get<string>('DATABASE_USER');
        console.log("DB USER =>", dbUser);
        const dbPassword = configService.get<string>('DATABASE_PASSWORD');
        const dbName = configService.get<string>('DATABASE_NAME');

        if (!dbUser || !dbPassword || !dbName) {
          console.error('⚠️  Missing database configuration!');
          console.error('Please set the following environment variables:');
          if (!dbUser) console.error('  - DATABASE_USER');
          if (!dbPassword) console.error('  - DATABASE_PASSWORD');
          if (!dbName) console.error('  - DATABASE_NAME');
          console.error('See .env.example for reference');
        }

        return {
          type: 'postgres',
          host: dbHost,
          port: dbPort,
          username: dbUser,
          password: String(dbPassword || ''),
          database: dbName,
          entities: [User, Purchase, PurchaseItem],
          synchronize: configService.get<string>('NODE_ENV') === 'development',
          logging: configService.get<string>('NODE_ENV') === 'development',
        };
      },
      inject: [ConfigService],
    }),
    UsersModule,
    AuthModule,
    PurchaseModule,
    PurchaseItemModule,
    SalesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
