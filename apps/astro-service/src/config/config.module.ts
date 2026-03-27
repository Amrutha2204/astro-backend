import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppConfig } from './app-config.entity';
import { AppConfigService } from './config.service';

@Module({
  imports: [TypeOrmModule.forFeature([AppConfig])],
  providers: [AppConfigService],
  exports: [AppConfigService],
})
export class AppConfigModule {}
