import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { join } from 'path';
import * as express from 'express';
import { createLogger } from '@astro/logger';
import { AppModule } from './app/app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const nestLogger = createLogger('astro-service');
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
    logger: nestLogger,
    rawBody: true, // keep raw body for payment webhook signature verification
  });

  app.useLogger(app.get(Logger));
  app.useGlobalFilters(new HttpExceptionFilter());

  const configService = app.get(ConfigService);
  const corsOrigin = configService.get<string>('CORS_ORIGIN');
  app.enableCors(
    corsOrigin
      ? { origin: corsOrigin.split(',').map((o) => o.trim()), credentials: true }
      : undefined,
  );
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  const port = configService.get<number>('PORT') ?? 8002;

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Astro Service API')
    .setDescription('API documentation for astrology calculations and predictions')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Provide JWT token from auth-service',
      },
      'bearer',
    )
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  const swaggerAssetsPath = join(process.cwd(), 'node_modules', 'swagger-ui-dist');
  app.use('/swagger-ui', express.static(swaggerAssetsPath));

  SwaggerModule.setup('api-docs', app, document, {
    customSiteTitle: 'Astro Service API Docs',
    swaggerOptions: {
      persistAuthorization: true,
    },
    customCssUrl: '/swagger-ui/swagger-ui.css',
    customJs: [
      '/swagger-ui/swagger-ui-bundle.js',
      '/swagger-ui/swagger-ui-standalone-preset.js',
    ],
  });

  await app.listen(port, '0.0.0.0');
  nestLogger.log(`Astro service listening on http://localhost:${port}`);
  nestLogger.log(`Swagger docs available at http://localhost:${port}/api-docs`);
}

bootstrap();
