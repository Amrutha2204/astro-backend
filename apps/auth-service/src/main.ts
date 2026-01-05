import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { join } from 'path';
import * as express from 'express';
import { createLogger } from '@astro/logger';
import { AppModule } from './app/app.module';
import { HttpErrorFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const nestLogger = createLogger('auth-service');
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
    logger: nestLogger,
  });

  app.useLogger(app.get(Logger));
  app.enableCors();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.useGlobalFilters(new HttpErrorFilter());

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT') ?? 8001;

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Auth Service API')
    .setDescription('API documentation for authentication and guest onboarding')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Provide JWT token',
      },
      'bearer',
    )
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  const swaggerAssetsPath = join(process.cwd(), 'node_modules', 'swagger-ui-dist');
  app.use('/swagger-ui', express.static(swaggerAssetsPath));

  SwaggerModule.setup('api-docs', app, document, {
    customSiteTitle: 'Auth Service API Docs',
    swaggerOptions: {
      persistAuthorization: true,
    },
    customCssUrl: '/swagger-ui/swagger-ui.css',
    customJs: [
      '/swagger-ui/swagger-ui-bundle.js',
      '/swagger-ui/swagger-ui-standalone-preset.js',
    ],
  });

  await app.listen(port);
  nestLogger.log(`Auth service listening on http://localhost:${port}`);
}

bootstrap();
