import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserDetails } from '../entities/user-details.entity';
import { UserDetailsService } from './user-details.service';
import { UserDetailsController } from './user-details.controller';
import { InternalApiKeyGuard } from '../common/guards/internal-api-key.guard';

@Module({
  imports: [TypeOrmModule.forFeature([UserDetails])],
  controllers: [UserDetailsController],
  providers: [UserDetailsService, InternalApiKeyGuard],
  exports: [UserDetailsService],
})
export class UserDetailsModule {}
