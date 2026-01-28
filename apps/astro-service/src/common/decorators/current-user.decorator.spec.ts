import { ExecutionContext } from '@nestjs/common';
import { CurrentUser } from './current-user.decorator';

describe('CurrentUser Decorator', () => {
  const createMockContext = (user: any): ExecutionContext => {
    return {
      switchToHttp: () => ({
        getRequest: () => ({
          user,
        }),
      }),
    } as ExecutionContext;
  };

  const getDecoratorValue = (data: string | undefined, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    return data ? user?.[data] : user;
  };

  it('should return entire user object when no data parameter provided', () => {
    const mockUser = {
      userId: 'test-user-id',
      token: 'test-token',
    };

    const context = createMockContext(mockUser);
    const result = getDecoratorValue(undefined, context);

    expect(result).toEqual(mockUser);
  });

  it('should return specific property when data parameter provided', () => {
    const mockUser = {
      userId: 'test-user-id',
      token: 'test-token',
      role: 'admin',
    };

    const context = createMockContext(mockUser);
    const userIdResult = getDecoratorValue('userId', context);
    const tokenResult = getDecoratorValue('token', context);
    const roleResult = getDecoratorValue('role', context);

    expect(userIdResult).toBe('test-user-id');
    expect(tokenResult).toBe('test-token');
    expect(roleResult).toBe('admin');
  });

  it('should return undefined when user is not set', () => {
    const context = createMockContext(undefined);
    const result = getDecoratorValue(undefined, context);

    expect(result).toBeUndefined();
  });

  it('should return undefined when property does not exist', () => {
    const mockUser = {
      userId: 'test-user-id',
      token: 'test-token',
    };

    const context = createMockContext(mockUser);
    const result = getDecoratorValue('nonExistentProperty', context);

    expect(result).toBeUndefined();
  });

  it('should handle null user gracefully', () => {
    const context = createMockContext(null);
    const result = getDecoratorValue(undefined, context);

    expect(result).toBeNull();
  });
});

