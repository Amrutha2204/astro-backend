import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Session } from '../entities/session.entity';
import { SessionsService } from './sessions.service';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [TypeOrmModule.forFeature([Session]), JwtModule],
  providers: [SessionsService],
  exports: [SessionsService],
})
export class SessionsModule {}

