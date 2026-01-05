import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserDetails } from '../entities/user-details.entity';
import { UserDetailsService } from './user-details.service';

@Module({
  imports: [TypeOrmModule.forFeature([UserDetails])],
  providers: [UserDetailsService],
  exports: [UserDetailsService],
})
export class UserDetailsModule {}
