import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { JwtStrategy } from './jwt.strategy';
import { AuthService } from './auth.service';
import { SessionsService } from '../sessions/sessions.service';
import { JwtPayload } from './interfaces/jwt-payload.interface';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let authService: jest.Mocked<AuthService>;
  let sessionsService: jest.Mocked<SessionsService>;
  let configService: jest.Mocked<ConfigService>;

  const mockPayload: JwtPayload = {
    sub: 'user-123',
    roleId: 1,
  };

  const mockUser = {
    id: 'user-123',
    name: 'John Doe',
    email: 'john@example.com',
    roleId: 1,
  };

  beforeEach(async () => {
    const mockAuthService = {
      validateUser: jest.fn(),
    };

    const mockSessionsService = {
      validateSession: jest.fn(),
    };

    const mockConfigService = {
      get: jest.fn().mockReturnValue('secret-key'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
        {
          provide: SessionsService,
          useValue: mockSessionsService,
        },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
    authService = module.get(AuthService);
    sessionsService = module.get(SessionsService);
    configService = module.get(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validate', () => {
    it('should validate session and return user', async () => {
      const request = {
        headers: {
          authorization: 'Bearer jwt-token',
        },
      };

      sessionsService.validateSession.mockResolvedValue({
        id: 'session-123',
        token: 'jwt-token',
        userId: 'user-123',
        expiresAt: new Date(Date.now() + 3600000),
      } as any);

      authService.validateUser.mockResolvedValue(mockUser as any);

      const result = await strategy.validate(request as any, mockPayload);

      expect(sessionsService.validateSession).toHaveBeenCalledWith('jwt-token');
      expect(authService.validateUser).toHaveBeenCalledWith(mockPayload.sub);
      expect(result).toEqual(mockUser);
    });

    it('should throw UnauthorizedException if session not found', async () => {
      const request = {
        headers: {
          authorization: 'Bearer invalid-token',
        },
      };

      sessionsService.validateSession.mockRejectedValue(
        new UnauthorizedException('Invalid session'),
      );

      await expect(
        strategy.validate(request as any, mockPayload),
      ).rejects.toThrow(UnauthorizedException);
      await expect(
        strategy.validate(request as any, mockPayload),
      ).rejects.toThrow('Session not found or expired');
      expect(authService.validateUser).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException if session expired', async () => {
      const request = {
        headers: {
          authorization: 'Bearer expired-token',
        },
      };

      sessionsService.validateSession.mockRejectedValue(
        new UnauthorizedException('Session has expired'),
      );

      await expect(
        strategy.validate(request as any, mockPayload),
      ).rejects.toThrow(UnauthorizedException);
      expect(authService.validateUser).not.toHaveBeenCalled();
    });

    it('should handle missing authorization header gracefully', async () => {
      const request = {
        headers: {},
      };

      authService.validateUser.mockResolvedValue(mockUser as any);

      const result = await strategy.validate(request as any, mockPayload);

      expect(sessionsService.validateSession).not.toHaveBeenCalled();
      expect(authService.validateUser).toHaveBeenCalledWith(mockPayload.sub);
      expect(result).toEqual(mockUser);
    });

    it('should extract token correctly from Bearer header', async () => {
      const request = {
        headers: {
          authorization: 'Bearer my-jwt-token-here',
        },
      };

      sessionsService.validateSession.mockResolvedValue({} as any);
      authService.validateUser.mockResolvedValue(mockUser as any);

      await strategy.validate(request as any, mockPayload);

      expect(sessionsService.validateSession).toHaveBeenCalledWith(
        'my-jwt-token-here',
      );
    });
  });
});

