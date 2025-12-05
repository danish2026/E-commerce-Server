import { INestApplication, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export async function configureApp(app: INestApplication): Promise<void> {
  const allowedOrigins = [
    process.env.FRONTEND_URL,
    'https://e-commerce-web-omega-six.vercel.app',
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:8080',
    'http://localhost:4200',
  ].filter(Boolean);

  app.enableCors({
    origin: (origin, callback) => {
      const isDevelopment = process.env.NODE_ENV !== 'production';
      
      if (!origin) {
        // Allow requests with no origin (like mobile apps or curl requests)
        callback(null, true);
      } else if (isDevelopment) {
        // In development, allow localhost and network IP addresses
        if (origin.startsWith('http://localhost:') || 
            origin.startsWith('http://127.0.0.1:') ||
            origin.startsWith('http://10.71.150.29:') ||
            origin.startsWith('http://192.168.') ||
            origin.startsWith('http://10.')) {
          callback(null, true);
        } else if (allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      } else if (allowedOrigins.includes(origin)) {
        // In production, only allow explicitly listed origins
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('E-commerce API')
    .setDescription('API documentation for the E-commerce application')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document, {
    customSiteTitle: 'E-commerce API Docs',
  });
}

