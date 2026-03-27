import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'crypto';
import { EntityManager, Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { UserDetails } from '../entities/user-details.entity';

@Injectable()
export class UserDetailsService {
  constructor(
    @InjectRepository(UserDetails)
    private readonly userDetailsRepository: Repository<UserDetails>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findById(id: string) {
    return this.userDetailsRepository.findOne({
      where: { id },
      relations: ['user'],
    });
  }

  async findByUserId(userId: string) {
    return this.userDetailsRepository.findOne({
      where: { user: { id: userId } },
      relations: ['user'],
    });
  }

  /**
   * Returns user details for GET /me. When no row exists, returns 200-style stub with user and null birth fields.
   * Always returns a plain object with dob, birthPlace, birthTime as strings (or null) so clients get a consistent shape.
   */
  async getMeOrEmpty(userId: string): Promise<{
    id: string | null;
    user: User;
    guestName: string | null;
    dob: string | null;
    birthPlace: string | null;
    birthTime: string | null;
    createdAt?: Date | string | null;
    updatedAt?: Date | string | null;
  }> {
    const details = await this.findByUserId(userId);
    if (details) {
      const dobStr =
        details.dob instanceof Date
          ? details.dob.toISOString().split('T')[0]
          : details.dob
            ? String(details.dob).split('T')[0]
            : null;
      return {
        id: details.id,
        user: details.user!,
        guestName: details.guestName ?? null,
        dob: dobStr,
        birthPlace: details.birthPlace ?? null,
        birthTime: details.birthTime ?? null,
        createdAt: details.createdAt,
        updatedAt: details.updatedAt,
      };
    }

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new Error('User not found');
    return {
      id: null,
      user,
      guestName: null,
      dob: null,
      birthPlace: null,
      birthTime: null,
      createdAt: null,
      updatedAt: null,
    };
  }

  async createForUser(
    user: User,
    payload: { dob: Date; birthPlace: string; birthTime?: string },
    manager?: EntityManager,
  ) {
    const repo = manager?.getRepository(UserDetails) ?? this.userDetailsRepository;
    const details = repo.create({
      id: randomUUID(),
      user,
      dob: payload.dob,
      birthPlace: payload.birthPlace,
      birthTime: payload.birthTime,
    });
    return repo.save(details);
  }

  async attachUserToGuest(
    details: UserDetails,
    user: User,
    manager?: EntityManager,
  ) {
    const repo = manager?.getRepository(UserDetails) ?? this.userDetailsRepository;
    const updated = repo.merge(details, {
      user,
      guestName: null,
    });
    return repo.save(updated);
  }

  async upsertBirthDetails(
    userId: string,
    payload: { dob: string; birthPlace: string; birthTime?: string },
  ): Promise<UserDetails> {
    const existing = await this.findByUserId(userId);
    const dob = typeof payload.dob === 'string' ? new Date(payload.dob) : payload.dob;

    if (existing) {
      existing.dob = dob;
      existing.birthPlace = payload.birthPlace;
      existing.birthTime = payload.birthTime ?? null;
      return this.userDetailsRepository.save(existing);
    }

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new Error('User not found');
    }
    return this.createForUser(user, {
      dob,
      birthPlace: payload.birthPlace,
      birthTime: payload.birthTime,
    });
  }
}
