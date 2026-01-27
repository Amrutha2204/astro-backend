import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';
import { Buffer } from 'buffer';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let mockExecutionContext: ExecutionContext;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [JwtAuthGuard],
    }).compile();

    guard = module.get<JwtAuthGuard>(JwtAuthGuard);
  });

  const createMockContext = (headers: any): ExecutionContext => {
    return {
      switchToHttp: () => ({
        getRequest: () => ({
          headers,
        }),
      }),
    } as ExecutionContext;
  };

  const createValidToken = (userId: string, exp?: number): string => {
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64');
    const payload = Buffer.from(
      JSON.stringify({
        sub: userId,
        id: userId,
        exp: exp || Math.floor(Date.now() / 1000) + 3600,
        iat: Math.floor(Date.now() / 1000),
      }),
    ).toString('base64');
    const signature = 'test-signature';
    return `${header}.${payload}.${signature}`;
  };

  describe('canActivate', () => {
    it('should return true for valid token', () => {
      const validToken = createValidToken('test-user-id');
      const context = createMockContext({
        authorization: `Bearer ${validToken}`,
      });

      const result = guard.canActivate(context);

      expect(result).toBe(true);
      const request = context.switchToHttp().getRequest();
      expect(request.user).toEqual({
        userId: 'test-user-id',
        token: validToken,
      });
    });

    it('should throw HttpException when authorization header is missing', () => {
      const context = createMockContext({});

      expect(() => guard.canActivate(context)).toThrow(HttpException);
      expect(() => guard.canActivate(context)).toThrow(
        'Authentication required. Please provide a valid JWT token.',
      );
    });

    it('should throw HttpException when authorization header does not start with Bearer', () => {
      const context = createMockContext({
        authorization: 'Invalid token',
      });

      expect(() => guard.canActivate(context)).toThrow(HttpException);
      expect(() => guard.canActivate(context)).toThrow(
        'Authentication required. Please provide a valid JWT token.',
      );
    });

    it('should throw HttpException when token is empty', () => {
      const context = createMockContext({
        authorization: 'Bearer ',
      });

      expect(() => guard.canActivate(context)).toThrow(HttpException);
      expect(() => guard.canActivate(context)).toThrow('Token is missing');
    });

    it('should throw HttpException when token has invalid format (not 3 parts)', () => {
      const context = createMockContext({
        authorization: 'Bearer invalid.token',
      });

      expect(() => guard.canActivate(context)).toThrow(HttpException);
      expect(() => guard.canActivate(context)).toThrow('Invalid token format');
    });

    it('should throw HttpException when token does not contain user ID', () => {
      const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64');
      const payload = Buffer.from(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600 })).toString('base64');
      const invalidToken = `${header}.${payload}.signature`;

      const context = createMockContext({
        authorization: `Bearer ${invalidToken}`,
      });

      expect(() => guard.canActivate(context)).toThrow(HttpException);
      expect(() => guard.canActivate(context)).toThrow('Token does not contain user ID');
    });

    it('should throw HttpException when token is expired', () => {
      const expiredToken = createValidToken('test-user-id', Math.floor(Date.now() / 1000) - 3600);
      const context = createMockContext({
        authorization: `Bearer ${expiredToken}`,
      });

      expect(() => guard.canActivate(context)).toThrow(HttpException);
      expect(() => guard.canActivate(context)).toThrow('Token has expired. Please login again.');
    });

    it('should accept token with id field instead of sub', () => {
      const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64');
      const payload = Buffer.from(
        JSON.stringify({
          id: 'user-id-from-id-field',
          exp: Math.floor(Date.now() / 1000) + 3600,
        }),
      ).toString('base64');
      const tokenWithId = `${header}.${payload}.signature`;

      const context = createMockContext({
        authorization: `Bearer ${tokenWithId}`,
      });

      const result = guard.canActivate(context);

      expect(result).toBe(true);
      const request = context.switchToHttp().getRequest();
      expect(request.user.userId).toBe('user-id-from-id-field');
    });

    it('should handle token without expiration claim', () => {
      const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64');
      const payload = Buffer.from(JSON.stringify({ sub: 'test-user-id' })).toString('base64');
      const tokenWithoutExp = `${header}.${payload}.signature`;

      const context = createMockContext({
        authorization: `Bearer ${tokenWithoutExp}`,
      });

      const result = guard.canActivate(context);

      expect(result).toBe(true);
      const request = context.switchToHttp().getRequest();
      expect(request.user.userId).toBe('test-user-id');
    });

    it('should throw HttpException when token payload is invalid base64', () => {
      const invalidToken = 'header.invalid-base64-payload.signature';

      const context = createMockContext({
        authorization: `Bearer ${invalidToken}`,
      });

      expect(() => guard.canActivate(context)).toThrow(HttpException);
      expect(() => guard.canActivate(context)).toThrow('Invalid token format');
    });

    it('should throw HttpException when token payload is invalid JSON', () => {
      const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64');
      const invalidJsonPayload = Buffer.from('not-valid-json').toString('base64');
      const invalidToken = `${header}.${invalidJsonPayload}.signature`;

      const context = createMockContext({
        authorization: `Bearer ${invalidToken}`,
      });

      expect(() => guard.canActivate(context)).toThrow(HttpException);
      expect(() => guard.canActivate(context)).toThrow('Invalid token format');
    });

    it('should extract token correctly from Bearer header', () => {
      const validToken = createValidToken('test-user-id');
      const context = createMockContext({
        authorization: `Bearer ${validToken}`,
      });

      guard.canActivate(context);

      const request = context.switchToHttp().getRequest();
      expect(request.user.token).toBe(validToken);
    });

    it('should set user object with userId and token', () => {
      const validToken = createValidToken('test-user-123');
      const context = createMockContext({
        authorization: `Bearer ${validToken}`,
      });

      guard.canActivate(context);

      const request = context.switchToHttp().getRequest();
      expect(request.user).toEqual({
        userId: 'test-user-123',
        token: validToken,
      });
    });

    it('should handle token with whitespace', () => {
      const validToken = createValidToken('test-user-id');
      const context = createMockContext({
        authorization: `Bearer   ${validToken}   `,
      });

      const result = guard.canActivate(context);

      expect(result).toBe(true);
      const request = context.switchToHttp().getRequest();
      expect(request.user.userId).toBe('test-user-id');
    });
  });

  describe('validateToken (private method via canActivate)', () => {
    it('should validate token with future expiration', () => {
      const futureExp = Math.floor(Date.now() / 1000) + 7200;
      const validToken = createValidToken('test-user-id', futureExp);
      const context = createMockContext({
        authorization: `Bearer ${validToken}`,
      });

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should reject token expired exactly now', () => {
      const nowExp = Math.floor(Date.now() / 1000);
      const expiredToken = createValidToken('test-user-id', nowExp);
      const context = createMockContext({
        authorization: `Bearer ${expiredToken}`,
      });

      expect(() => guard.canActivate(context)).toThrow(HttpException);
      expect(() => guard.canActivate(context)).toThrow('Token has expired');
    });
  });
});

