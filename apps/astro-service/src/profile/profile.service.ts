import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Profile } from './entities/profile.entity';
import { CreateProfileDto } from './dto/create-profile.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { getCoordinatesFromCity } from '../common/utils/coordinates.util';

@Injectable()
export class ProfileService {
  private readonly logger = new Logger(ProfileService.name);

  constructor(
    @InjectRepository(Profile)
    private readonly profileRepository: Repository<Profile>,
  ) {}

  async create(userId: string, createProfileDto: CreateProfileDto) {
    try {
      if (createProfileDto.isPrimary) {
        await this.unsetPrimaryProfiles(userId);
      }

      const coordinates =
        createProfileDto.latitude && createProfileDto.longitude
          ? { lat: createProfileDto.latitude, lng: createProfileDto.longitude }
          : getCoordinatesFromCity(createProfileDto.birthPlace);

      const profile = this.profileRepository.create({
        userId,
        name: createProfileDto.name,
        dob: new Date(createProfileDto.dob),
        birthPlace: createProfileDto.birthPlace,
        birthTime: createProfileDto.birthTime,
        latitude: coordinates.lat,
        longitude: coordinates.lng,
        timezone: createProfileDto.timezone,
        isPrimary: createProfileDto.isPrimary ?? false,
        notes: createProfileDto.notes,
      });

      const saved = await this.profileRepository.save(profile);

      if (!createProfileDto.isPrimary) {
        const hasPrimary = await this.hasPrimaryProfile(userId);
        if (!hasPrimary) {
          saved.isPrimary = true;
          await this.profileRepository.save(saved);
        }
      }

      return saved;
    } catch (error) {
      this.logger.error(`Error creating profile: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to create profile');
    }
  }

  async findAll(userId: string) {
    try {
      return this.profileRepository.find({
        where: { userId },
        order: { isPrimary: 'DESC', createdAt: 'DESC' },
      });
    } catch (error) {
      this.logger.error(`Error fetching profiles: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to fetch profiles');
    }
  }

  async findOne(userId: string, id: string) {
    try {
      const profile = await this.profileRepository.findOne({
        where: { id, userId },
      });

      if (!profile) {
        throw new NotFoundException('Profile not found');
      }

      return profile;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Error fetching profile: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to fetch profile');
    }
  }

  async update(userId: string, id: string, updateProfileDto: UpdateProfileDto) {
    try {
      const profile = await this.findOne(userId, id);

      if (updateProfileDto.isPrimary && !profile.isPrimary) {
        await this.unsetPrimaryProfiles(userId);
      }

      if (updateProfileDto.birthPlace && !updateProfileDto.latitude) {
        const coordinates = getCoordinatesFromCity(updateProfileDto.birthPlace);
        updateProfileDto.latitude = coordinates.lat;
        updateProfileDto.longitude = coordinates.lng;
      }

      Object.assign(profile, {
        ...updateProfileDto,
        dob: updateProfileDto.dob ? new Date(updateProfileDto.dob) : profile.dob,
      });

      return this.profileRepository.save(profile);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Error updating profile: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to update profile');
    }
  }

  async remove(userId: string, id: string) {
    try {
      const profile = await this.findOne(userId, id);

      await this.profileRepository.remove(profile);

      const hasPrimary = await this.hasPrimaryProfile(userId);
      if (!hasPrimary) {
        const firstProfile = await this.profileRepository.findOne({
          where: { userId },
          order: { createdAt: 'ASC' },
        });
        if (firstProfile) {
          firstProfile.isPrimary = true;
          await this.profileRepository.save(firstProfile);
        }
      }

      return { message: 'Profile deleted successfully' };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Error deleting profile: ${error.message}`, error.stack);
      throw new BadRequestException('Failed to delete profile');
    }
  }

  async getPrimaryProfile(userId: string) {
    try {
      const profile = await this.profileRepository.findOne({
        where: { userId, isPrimary: true },
      });

      if (!profile) {
        const firstProfile = await this.profileRepository.findOne({
          where: { userId },
          order: { createdAt: 'ASC' },
        });
        return firstProfile;
      }

      return profile;
    } catch (error) {
      this.logger.error(
        `Error fetching primary profile: ${error.message}`,
        error.stack,
      );
      return null;
    }
  }

  private async unsetPrimaryProfiles(userId: string) {
    await this.profileRepository.update(
      { userId, isPrimary: true },
      { isPrimary: false },
    );
  }

  private async hasPrimaryProfile(userId: string): Promise<boolean> {
    const count = await this.profileRepository.count({
      where: { userId, isPrimary: true },
    });
    return count > 0;
  }
}

