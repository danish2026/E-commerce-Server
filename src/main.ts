import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { configureApp } from './app.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  await configureApp(app);
  
  const port = Number(process.env.PORT) || 3001;
  await app.listen(port, '0.0.0.0');

  console.log(`🚀 Backend server running on http://10.71.150.29:${port}/api`);
  console.log(`📚 Swagger documentation available at http://10.71.150.29:${port}/api-docs`);
}
bootstrap();
