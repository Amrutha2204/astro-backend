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
}
