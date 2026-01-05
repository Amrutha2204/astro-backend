import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'crypto';
import { Repository } from 'typeorm';
import { Role } from '../common/enums/role.enum';
import { User } from '../entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async findByEmail(email: string) {
    return this.usersRepository.findOne({
      where: { email: email.toLowerCase() },
    });
  }

  async findById(id: string) {
    return this.usersRepository.findOne({ where: { id } });
  }

  async createUser(data: {
    name: string;
    email: string;
    password: string;
    phoneNumber?: string;
    timezone?: string;
    roleId: Role;
    profilePic?: string | null;
  }) {
    const user = this.usersRepository.create({
      id: randomUUID(),
      ...data,
      email: data.email.toLowerCase(),
    });
    return this.usersRepository.save(user);
  }
}
