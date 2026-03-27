import { PartialType } from '@nestjs/swagger';
import { CreateFamilyProfileDto } from './create-family-profile.dto';

export class UpdateFamilyProfileDto extends PartialType(CreateFamilyProfileDto) {}
