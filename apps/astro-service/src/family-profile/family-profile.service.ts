import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FamilyProfile } from './entities/family-profile.entity';
import { CreateFamilyProfileDto } from './dto/create-family-profile.dto';
import { UpdateFamilyProfileDto } from './dto/update-family-profile.dto';

export interface FamilyProfileResponse {
  id: string;
  userId: string;
  name: string;
  dob: string;
  birthPlace: string;
  birthTime: string;
  relation: string | null;
  createdAt: string;
  updatedAt: string;
}

function toResponse(p: FamilyProfile): FamilyProfileResponse {
  return {
    id: p.id,
    userId: p.userId,
    name: p.name,
    dob: p.dob instanceof Date ? p.dob.toISOString().split('T')[0] : String(p.dob),
    birthPlace: p.birthPlace,
    birthTime: p.birthTime,
    relation: p.relation ?? null,
    createdAt: p.createdAt instanceof Date ? p.createdAt.toISOString() : String(p.createdAt),
    updatedAt: p.updatedAt instanceof Date ? p.updatedAt.toISOString() : String(p.updatedAt),
  };
}

@Injectable()
export class FamilyProfileService {
  constructor(
    @InjectRepository(FamilyProfile)
    private readonly repo: Repository<FamilyProfile>,
  ) {}

  async findAllByUserId(userId: string): Promise<FamilyProfileResponse[]> {
    const list = await this.repo.find({
      where: { userId },
      order: { createdAt: 'ASC' },
    });
    return list.map(toResponse);
  }

  async findOne(id: string, userId: string): Promise<FamilyProfileResponse> {
    const profile = await this.repo.findOne({ where: { id, userId } });
    if (!profile) {
      throw new HttpException('Family profile not found', HttpStatus.NOT_FOUND);
    }
    return toResponse(profile);
  }

  async create(userId: string, dto: CreateFamilyProfileDto): Promise<FamilyProfileResponse> {
    const profile = this.repo.create({
      userId,
      name: dto.name,
      dob: new Date(dto.dob),
      birthPlace: dto.birthPlace,
      birthTime: dto.birthTime ?? '12:00:00',
      relation: dto.relation ?? null,
    });
    const saved = await this.repo.save(profile);
    return toResponse(saved);
  }

  async update(id: string, userId: string, dto: UpdateFamilyProfileDto): Promise<FamilyProfileResponse> {
    const profile = await this.repo.findOne({ where: { id, userId } });
    if (!profile) {
      throw new HttpException('Family profile not found', HttpStatus.NOT_FOUND);
    }
    if (dto.name != null) profile.name = dto.name;
    if (dto.dob != null) profile.dob = new Date(dto.dob);
    if (dto.birthPlace != null) profile.birthPlace = dto.birthPlace;
    if (dto.birthTime != null) profile.birthTime = dto.birthTime;
    if (dto.relation !== undefined) profile.relation = dto.relation ?? null;
    const saved = await this.repo.save(profile);
    return toResponse(saved);
  }

  async remove(id: string, userId: string): Promise<void> {
    const profile = await this.repo.findOne({ where: { id, userId } });
    if (!profile) {
      throw new HttpException('Family profile not found', HttpStatus.NOT_FOUND);
    }
    await this.repo.remove(profile);
  }
}
