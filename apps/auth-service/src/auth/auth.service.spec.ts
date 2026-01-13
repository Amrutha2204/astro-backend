import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { UserDetailsService } from '../user-details/user-details.service';
import { SessionsService } from '../sessions/sessions.service';
import { LoginDto } from './dto/login.dto';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let usersService: jest.Mocked<UsersService>;
  let sessionsService: jest.Mocked<SessionsService>;
  let jwtService: jest.Mocked<JwtService>;
  let configService: jest.Mocked<ConfigService>;

  const mockUser = {
    id: 'user-123',
    name: 'John Doe',
    email: 'john@example.com',
    password: 'hashed-password',
    roleId: 1,
  };

  beforeEach(async () => {
    const mockUsersService = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
    };

    const mockSessionsService = {
      createSession: jest.fn(),
      deleteSession: jest.fn(),
    };

    const mockJwtService = {
      signAsync: jest.fn(),
    };

    const mockConfigService = {
      get: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: UserDetailsService,
          useValue: {},
        },
        {
          provide: SessionsService,
          useValue: mockSessionsService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: DataSource,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get(UsersService);
    sessionsService = module.get(SessionsService);
    jwtService = module.get(JwtService);
    configService = module.get(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    const loginDto: LoginDto = {
      email: 'john@example.com',
      password: 'password123',
    };

    it('should create session on successful login', async () => {
      const accessToken = 'jwt-token';
      const expiresIn = '1h';

      usersService.findByEmail.mockResolvedValue(mockUser as any);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      configService.get.mockReturnValue(expiresIn);
      jwtService.signAsync.mockResolvedValue(accessToken);
      sessionsService.createSession.mockResolvedValue({
        id: 'session-123',
        token: accessToken,
        userId: mockUser.id,
        expiresAt: new Date(),
        createdAt: new Date(),
      } as any);

      const result = await service.login(loginDto);

      expect(usersService.findByEmail).toHaveBeenCalledWith(loginDto.email);
      expect(bcrypt.compare).toHaveBeenCalledWith(
        loginDto.password,
        mockUser.password,
      );
      expect(jwtService.signAsync).toHaveBeenCalled();
      expect(sessionsService.createSession).toHaveBeenCalledWith(
        mockUser.id,
        accessToken,
        expiresIn,
      );
      expect(result).toMatchObject({
        accessToken,
        expiresIn,
        user: {
          id: mockUser.id,
          name: mockUser.name,
          roleId: mockUser.roleId,
        },
      });
      expect(result.expiresAt).toBeDefined();
    });

    it('should throw UnauthorizedException if user not found', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.login(loginDto)).rejects.toThrow(
        'Invalid credentials',
      );
      expect(sessionsService.createSession).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException if password invalid', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser as any);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.login(loginDto)).rejects.toThrow(
        'Invalid credentials',
      );
      expect(sessionsService.createSession).not.toHaveBeenCalled();
    });

    it('should handle numeric expiresIn from config', async () => {
      const accessToken = 'jwt-token';
      const expiresIn = 3600;

      usersService.findByEmail.mockResolvedValue(mockUser as any);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      configService.get.mockReturnValue(expiresIn);
      jwtService.signAsync.mockResolvedValue(accessToken);
      sessionsService.createSession.mockResolvedValue({} as any);

      await service.login(loginDto);

      expect(sessionsService.createSession).toHaveBeenCalledWith(
        mockUser.id,
        accessToken,
        '3600s',
      );
    });
  });

  describe('logout', () => {
    it('should delete session on logout', async () => {
      const token = 'jwt-token';

      const result = await service.logout(token);

      expect(sessionsService.deleteSession).toHaveBeenCalledWith(token);
      expect(result).toEqual({
        message: 'Logged out successfully. Session deleted.',
      });
    });

    it('should return success message even if token is null', async () => {
      const result = await service.logout(null);

      expect(sessionsService.deleteSession).not.toHaveBeenCalled();
      expect(result).toEqual({
        message: 'Logged out successfully. Session deleted.',
      });
    });
  });
});

