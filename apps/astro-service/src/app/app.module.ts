import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { join } from 'path';
import { LoggerModule } from '@astro/logger';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HoroscopeModule } from '../horoscope/horoscope.module';
import { KundliModule } from '../kundli/kundli.module';
import { NatalChartModule } from '../natal-chart/natal-chart.module';
import { TransitsModule } from '../transits/transits.module';
import { HoroscopeRuleModule } from '../horoscope-rule/horoscope-rule.module';
import { CalendarModule } from '../calendar/calendar.module';
import { AstrologyEngineModule } from '../astrology-engine/astrology-engine.module';
import { DashaModule } from '../dasha/dasha.module';
import { DoshaModule } from '../dosha/dosha.module';
import { CompatibilityModule } from '../compatibility/compatibility.module';
import { RemediesModule } from '../remedies/remedies.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [join(process.cwd(), 'apps/astro-service/.env')],
    }),
    LoggerModule.forRoot('astro-service'),
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
        synchronize: false,
      }),
    }),
    HoroscopeModule,
    KundliModule,
    NatalChartModule,
    TransitsModule,
    HoroscopeRuleModule,
    CalendarModule,
    AstrologyEngineModule,
    DashaModule,
    DoshaModule,
    CompatibilityModule,
    RemediesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
