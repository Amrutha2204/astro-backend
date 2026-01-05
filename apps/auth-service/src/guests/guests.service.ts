import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'crypto';
import { Repository } from 'typeorm';
import { UserDetails } from '../entities/user-details.entity';
import { CreateGuestDto } from './dto/create-guest.dto';

@Injectable()
export class GuestsService {
  constructor(
    @InjectRepository(UserDetails)
    private readonly userDetailsRepository: Repository<UserDetails>,
  ) {}

  async onboardGuest(dto: CreateGuestDto) {
    const guest = this.userDetailsRepository.create({
      id: randomUUID(),
      guestName: dto.name,
      dob: new Date(dto.dob),
      birthPlace: dto.birthPlace,
      birthTime: dto.birthTime,
    });

    const savedGuest = await this.userDetailsRepository.save(guest);
    return {
      message: 'Guest user onboarded successfully',
      guestId: savedGuest.id,
    };
  }
}
