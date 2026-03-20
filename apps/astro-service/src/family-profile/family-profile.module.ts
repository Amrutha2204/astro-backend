import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FamilyProfile } from './entities/family-profile.entity';
import { FamilyProfileService } from './family-profile.service';
import { FamilyProfileController } from './family-profile.controller';

@Module({
  imports: [TypeOrmModule.forFeature([FamilyProfile])],
  controllers: [FamilyProfileController],
  providers: [FamilyProfileService],
  exports: [FamilyProfileService],
})
export class FamilyProfileModule {}
