import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { createLogger } from '@astro/logger';
import { AppModule } from './app/app.module';

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

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT') ?? 8001;
  await app.listen(port);
  nestLogger.log(`Auth service listening on http://localhost:${port}`);
}

bootstrap();
