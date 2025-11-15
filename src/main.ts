import { Logger, ValidationPipe } from "@nestjs/common";
import { NestFactory, Reflector } from "@nestjs/core";
import * as bodyParser from "body-parser";
import * as dotenv from "dotenv";
import { AppModule } from "./app.module";
import { setupSwagger } from "./swagger";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";

// Polyfill for crypto module
if (typeof global.crypto === "undefined") {
  const crypto = require("crypto");
  global.crypto = crypto;
}

async function bootstrap() {
  const logger = new Logger("E-commerce Server");
  dotenv.config();
  const app = await NestFactory.create(AppModule);

  // Get instances of required services
  const reflector = app.get(Reflector);
  const jwtService = app.get(JwtService);
  const configService = app.get(ConfigService);

  // Other global configurations
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    })
  );

  setupSwagger(app);

  // CORS configuration
  app.enableCors({
    origin: "*",
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    allowedHeaders: "Content-Type,Accept,Authorization",
    credentials: true,
  });

  // Body parser configuration
  app.use(bodyParser.json({ limit: "50mb" }));
  app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));

  await app.listen(process.env.PORT || 3000, () =>
    logger.log(`Server is running on ${process.env.PORT || 3000}`)
  );
}

bootstrap();
