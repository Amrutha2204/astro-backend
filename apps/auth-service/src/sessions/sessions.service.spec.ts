import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UnauthorizedException } from '@nestjs/common';
import { SessionsService } from './sessions.service';
import { Session } from '../entities/session.entity';

describe('SessionsService', () => {
  let service: SessionsService;
  let repository: Repository<Session>;

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SessionsService,
        {
          provide: getRepositoryToken(Session),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<SessionsService>(SessionsService);
    repository = module.get<Repository<Session>>(getRepositoryToken(Session));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createSession', () => {
    it('should create a session with correct expiry time', async () => {
      const userId = 'user-123';
      const token = 'jwt-token';
      const expiresIn = '1h';
      const mockSession = {
        id: 'session-123',
        token,
        userId,
        expiresAt: new Date(),
        createdAt: new Date(),
      };

      mockRepository.create.mockReturnValue(mockSession);
      mockRepository.save.mockResolvedValue(mockSession);

      const result = await service.createSession(userId, token, expiresIn);

      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          token,
          userId,
          expiresAt: expect.any(Date),
        }),
      );
      expect(mockRepository.save).toHaveBeenCalled();
      expect(result).toEqual(mockSession);
    });

    it('should parse expiresIn correctly for different formats', async () => {
      const userId = 'user-123';
      const token = 'jwt-token';
      const mockSession = {
        id: 'session-123',
        token,
        userId,
        expiresAt: new Date(),
        createdAt: new Date(),
      };

      mockRepository.create.mockReturnValue(mockSession);
      mockRepository.save.mockResolvedValue(mockSession);

      await service.createSession(userId, token, '30m');
      const callArgs = mockRepository.create.mock.calls[0][0];
      const expiresAt = callArgs.expiresAt;
      const expectedExpiry = Date.now() + 30 * 60 * 1000;
      expect(expiresAt.getTime()).toBeCloseTo(expectedExpiry, -3);
    });
  });

  describe('findByToken', () => {
    it('should find session by token', async () => {
      const token = 'jwt-token';
      const mockSession = {
        id: 'session-123',
        token,
        userId: 'user-123',
        expiresAt: new Date(Date.now() + 3600000),
        createdAt: new Date(),
        user: null,
      };

      mockRepository.findOne.mockResolvedValue(mockSession);

      const result = await service.findByToken(token);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { token },
        relations: ['user'],
      });
      expect(result).toEqual(mockSession);
    });

    it('should return null if session not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await service.findByToken('invalid-token');

      expect(result).toBeNull();
    });
  });

  describe('validateSession', () => {
    it('should validate active session', async () => {
      const token = 'jwt-token';
      const mockSession = {
        id: 'session-123',
        token,
        userId: 'user-123',
        expiresAt: new Date(Date.now() + 3600000),
        createdAt: new Date(),
      };

      mockRepository.findOne.mockResolvedValue(mockSession);

      const result = await service.validateSession(token);

      expect(result).toEqual(mockSession);
    });

    it('should throw UnauthorizedException if session not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.validateSession('invalid-token')).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.validateSession('invalid-token')).rejects.toThrow(
        'Invalid session',
      );
    });

    it('should throw UnauthorizedException if session expired', async () => {
      const token = 'jwt-token';
      const expiredSession = {
        id: 'session-123',
        token,
        userId: 'user-123',
        expiresAt: new Date(Date.now() - 1000),
        createdAt: new Date(),
      };

      mockRepository.findOne.mockResolvedValue(expiredSession);

      await expect(service.validateSession(token)).rejects.toThrow(
        UnauthorizedException,
      );
      await expect(service.validateSession(token)).rejects.toThrow(
        'Session has expired',
      );
      expect(mockRepository.remove).toHaveBeenCalledWith(expiredSession);
    });
  });

  describe('deleteSession', () => {
    it('should delete session if found', async () => {
      const token = 'jwt-token';
      const mockSession = {
        id: 'session-123',
        token,
        userId: 'user-123',
        expiresAt: new Date(),
        createdAt: new Date(),
      };

      mockRepository.findOne.mockResolvedValue(mockSession);
      mockRepository.remove.mockResolvedValue(mockSession);

      await service.deleteSession(token);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { token },
        relations: ['user'],
      });
      expect(mockRepository.remove).toHaveBeenCalledWith(mockSession);
    });

    it('should not throw if session not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.deleteSession('invalid-token')).resolves.not.toThrow();
      expect(mockRepository.remove).not.toHaveBeenCalled();
    });
  });

  describe('deleteAllUserSessions', () => {
    it('should delete all sessions for a user', async () => {
      const userId = 'user-123';

      await service.deleteAllUserSessions(userId);

      expect(mockRepository.delete).toHaveBeenCalledWith({ userId });
    });
  });

  describe('cleanupExpiredSessions', () => {
    it('should delete expired sessions', async () => {
      await service.cleanupExpiredSessions();

      expect(mockRepository.delete).toHaveBeenCalledWith({
        expiresAt: expect.any(Object),
      });
    });
  });
});

