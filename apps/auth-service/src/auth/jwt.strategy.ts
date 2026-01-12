import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthService } from './auth.service';
import { SessionsService } from '../sessions/sessions.service';
import { JwtPayload } from './interfaces/jwt-payload.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly authService: AuthService,
    private readonly sessionsService: SessionsService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') ?? 'default_secret',
    });
  }

  async validate(payload: JwtPayload, request: any) {
    const token = ExtractJwt.fromAuthHeaderAsBearerToken()(request);

    if (token) {
      try {
        await this.sessionsService.validateSession(token);
      } catch (error) {
        throw new UnauthorizedException('Session not found or expired');
      }
    }

    return this.authService.validateUser(payload.sub);
  }
}
