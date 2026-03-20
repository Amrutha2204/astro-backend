import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, HttpException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { JwtAuthGuard } from './jwt-auth.guard';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let jwtService: JwtService;

  const createMockContext = (headers: Record<string, string>): ExecutionContext =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({ headers }),
      }),
    }) as ExecutionContext;

  beforeEach(async () => {
    const mockJwtService = {
      verifyAsync: jest.fn(),
    };
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtAuthGuard,
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    guard = module.get<JwtAuthGuard>(JwtAuthGuard);
    jwtService = module.get<JwtService>(JwtService);
  });

  describe('canActivate', () => {
    it('should return true and set user when token is valid', async () => {
      (jwtService.verifyAsync as jest.Mock).mockResolvedValue({
        sub: 'test-user-id',
        roleId: 1,
      });
      const context = createMockContext({
        authorization: 'Bearer valid.jwt.token',
      });

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      const request = context.switchToHttp().getRequest();
      expect(request.user).toEqual({
        userId: 'test-user-id',
        token: 'valid.jwt.token',
        roleId: 1,
      });
    });

    it('should throw when authorization header is missing', async () => {
      const context = createMockContext({});

      await expect(guard.canActivate(context)).rejects.toThrow(HttpException);
      await expect(guard.canActivate(context)).rejects.toThrow(
        'Authentication required. Please provide a valid JWT token.',
      );
      expect(jwtService.verifyAsync).not.toHaveBeenCalled();
    });

    it('should throw when authorization does not start with Bearer', async () => {
      const context = createMockContext({ authorization: 'Basic xyz' });

      await expect(guard.canActivate(context)).rejects.toThrow(HttpException);
      expect(jwtService.verifyAsync).not.toHaveBeenCalled();
    });

    it('should throw when token is empty', async () => {
      const context = createMockContext({ authorization: 'Bearer ' });

      await expect(guard.canActivate(context)).rejects.toThrow(HttpException);
      await expect(guard.canActivate(context)).rejects.toThrow('Token is missing');
    });

    it('should throw when verifyAsync throws (expired)', async () => {
      const err = new Error('jwt expired');
      (err as any).name = 'TokenExpiredError';
      (jwtService.verifyAsync as jest.Mock).mockRejectedValue(err);
      const context = createMockContext({ authorization: 'Bearer expired.token' });

      await expect(guard.canActivate(context)).rejects.toThrow(HttpException);
      await expect(guard.canActivate(context)).rejects.toThrow(
        'Token has expired. Please login again.',
      );
    });

    it('should throw when verifyAsync throws (invalid)', async () => {
      (jwtService.verifyAsync as jest.Mock).mockRejectedValue(new Error('invalid signature'));
      const context = createMockContext({ authorization: 'Bearer bad.token' });

      await expect(guard.canActivate(context)).rejects.toThrow(HttpException);
    });

    it('should use id when sub is missing', async () => {
      (jwtService.verifyAsync as jest.Mock).mockResolvedValue({
        id: 'user-from-id',
        roleId: 2,
      });
      const context = createMockContext({ authorization: 'Bearer jwt.here' });

      await guard.canActivate(context);

      const request = context.switchToHttp().getRequest();
      expect(request.user.userId).toBe('user-from-id');
    });

    it('should throw when payload has no sub or id', async () => {
      (jwtService.verifyAsync as jest.Mock).mockResolvedValue({ roleId: 1 });

      const context = createMockContext({ authorization: 'Bearer jwt.here' });

      await expect(guard.canActivate(context)).rejects.toThrow(HttpException);
      await expect(guard.canActivate(context)).rejects.toThrow('Invalid token: missing user id');
    });
  });
});
