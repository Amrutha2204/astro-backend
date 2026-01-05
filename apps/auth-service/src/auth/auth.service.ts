import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { DataSource } from 'typeorm';
import { randomUUID } from 'crypto';
import * as bcrypt from 'bcrypt';
import { Role } from '../common/enums/role.enum';
import { UserDetails } from '../entities/user-details.entity';
import { User } from '../entities/user.entity';
import { UserDetailsService } from '../user-details/user-details.service';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { SignUpDto } from './dto/signup.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly userDetailsService: UserDetailsService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly dataSource: DataSource,
  ) {}

  async signup(dto: SignUpDto) {
    const normalizedEmail = dto.email.toLowerCase();
    const existingUser = await this.usersService.findByEmail(normalizedEmail);
    if (existingUser) {
      throw new BadRequestException('Email already in use');
    }

    if (dto.roleId === Role.Admin || dto.roleId === Role.Guest) {
      throw new BadRequestException('Signup with admin or guest role is not allowed');
    }

    if (!dto.guestId && (!dto.dob || !dto.birthPlace)) {
      throw new BadRequestException('dob and birthPlace are required for new signups');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    if (dto.guestId) {
      return this.convertGuestToUser(dto, hashedPassword, normalizedEmail);
    }

    return this.createUserWithDetails(dto, hashedPassword, normalizedEmail);
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload: JwtPayload = {
      sub: user.id,
      roleId: user.roleId,
    };

    const expiresIn =
      (this.configService.get<string>('JWT_EXPIRES_IN') ??
        '1h') as JwtSignOptions['expiresIn'];
    const accessToken = await this.jwtService.signAsync(payload, { expiresIn });

    return {
      accessToken,
      user: {
        id: user.id,
        name: user.name,
        roleId: user.roleId,
      },
    };
  }

  async validateUser(userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('Invalid token');
    }
    return user;
  }

  private async convertGuestToUser(
    dto: SignUpDto,
    hashedPassword: string,
    email: string,
  ) {
    const guestDetails = dto.guestId
      ? await this.userDetailsService.findById(dto.guestId)
      : null;

    if (!guestDetails) {
      throw new NotFoundException('Guest record not found');
    }

    if (guestDetails.user) {
      throw new BadRequestException('Guest is already registered');
    }

    return this.dataSource.transaction(async (manager) => {
      const userRepository = manager.getRepository(User);
      const detailsRepository = manager.getRepository(UserDetails);

      const user = userRepository.create({
        id: randomUUID(),
        name: dto.name,
        email,
        password: hashedPassword,
        phoneNumber: dto.phoneNumber,
        timezone: dto.timezone,
        roleId: dto.roleId,
      });

      const savedUser = await userRepository.save(user);

      const updatedGuest = detailsRepository.merge(guestDetails, {
        user: savedUser,
        guestName: null,
      });

      await detailsRepository.save(updatedGuest);

      return {
        message: 'User registered successfully',
        userId: savedUser.id,
      };
    });
  }

  private async createUserWithDetails(
    dto: SignUpDto,
    hashedPassword: string,
    email: string,
  ) {
    return this.dataSource.transaction(async (manager) => {
      const userRepository = manager.getRepository(User);
      const detailsRepository = manager.getRepository(UserDetails);

      const user = userRepository.create({
        id: randomUUID(),
        name: dto.name,
        email,
        password: hashedPassword,
        phoneNumber: dto.phoneNumber,
        timezone: dto.timezone,
        roleId: dto.roleId,
      });

      const savedUser = await userRepository.save(user);

      const details = detailsRepository.create({
        id: randomUUID(),
        user: savedUser,
        dob: new Date(dto.dob as string),
        birthPlace: dto.birthPlace as string,
        birthTime: dto.birthTime,
      });

      await detailsRepository.save(details);

      return {
        message: 'User registered successfully',
        userId: savedUser.id,
      };
    });
  }
}
