import { CacheModule } from "@nestjs/cache-manager";
import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import { ScheduleModule } from "@nestjs/schedule";
import type { StringValue } from "ms";
import { DatabaseModule } from "./database/database.module";
import { SharedModule } from "./shared/shared.module";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";

@Module({
  imports: [
    // Core/Configuration Modules
    ConfigModule.forRoot({ isGlobal: true }),
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET || "your-default-secret",
      signOptions: { expiresIn: (process.env.JWT_EXPIRY || "1h") as StringValue },
    }),
    ScheduleModule.forRoot(),
    CacheModule.register({ isGlobal: true }),
    DatabaseModule,
    SharedModule,
    // Add your feature modules here
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
