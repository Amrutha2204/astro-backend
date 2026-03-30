import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { join } from 'path';
import { LoggerModule } from '@astro/logger';
import { AuthModule } from '../auth/auth.module';
import { GuestsModule } from '../guests/guests.module';
import { UsersModule } from '../users/users.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [join(process.cwd(), 'apps/auth-service/.env')],
    }),
    LoggerModule.forRoot('auth-service'),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('DB_HOST') ?? 'localhost',
        port: Number(config.get<string>('DB_PORT') ?? 5432),
        username: config.get<string>('DB_USER') ?? '',
        password: String(config.get<string>('DB_PASSWORD') ?? ''),
        database: config.get<string>('DB_NAME') ?? '',
        autoLoadEntities: true,
        synchronize: true,
      }),
    }),
    UsersModule,
    AuthModule,
    GuestsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
