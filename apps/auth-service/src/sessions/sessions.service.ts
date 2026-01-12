import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Session } from '../entities/session.entity';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class SessionsService {
  constructor(
    @InjectRepository(Session)
    private readonly sessionRepository: Repository<Session>,
    private readonly jwtService: JwtService,
  ) {}

  async createSession(userId: string, token: string, expiresIn: string): Promise<Session> {
    const expiresInSeconds = this.parseExpiresIn(expiresIn);
    const expiresAt = new Date(Date.now() + expiresInSeconds * 1000);

    const session = this.sessionRepository.create({
      token,
      userId,
      expiresAt,
    });

    return this.sessionRepository.save(session);
  }

  async findByToken(token: string): Promise<Session | null> {
    return this.sessionRepository.findOne({
      where: { token },
      relations: ['user'],
    });
  }

  async validateSession(token: string): Promise<Session> {
    const session = await this.findByToken(token);

    if (!session) {
      throw new UnauthorizedException('Invalid session');
    }

    if (session.expiresAt < new Date()) {
      await this.sessionRepository.remove(session);
      throw new UnauthorizedException('Session has expired');
    }

    return session;
  }

  async deleteSession(token: string): Promise<void> {
    const session = await this.findByToken(token);
    if (session) {
      await this.sessionRepository.remove(session);
    }
  }

  async deleteAllUserSessions(userId: string): Promise<void> {
    await this.sessionRepository.delete({ userId });
  }

  async cleanupExpiredSessions(): Promise<void> {
    await this.sessionRepository.delete({
      expiresAt: LessThan(new Date()),
    });
  }

  private parseExpiresIn(expiresIn: string | number): number {
    if (typeof expiresIn === 'number') {
      return expiresIn;
    }

    const match = expiresIn.match(/^(\d+)([smhd])$/);
    if (!match) {
      return 3600;
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case 's':
        return value;
      case 'm':
        return value * 60;
      case 'h':
        return value * 3600;
      case 'd':
        return value * 86400;
      default:
        return 3600;
    }
  }
}

