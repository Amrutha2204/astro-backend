import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Buffer } from 'buffer';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  private readonly logger = new Logger(JwtAuthGuard.name);

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers?.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new HttpException(
        'Authentication required. Please provide a valid JWT token.',
        HttpStatus.UNAUTHORIZED,
      );
    }

    const token = authHeader.substring(7);
    const validation = this.validateToken(token);

    if (!validation.valid) {
      if (validation.expired) {
        throw new HttpException(
          'Token has expired. Please login again.',
          HttpStatus.UNAUTHORIZED,
        );
      }
      throw new HttpException(
        validation.error || 'Invalid token',
        HttpStatus.UNAUTHORIZED,
      );
    }

    request.user = {
      userId: validation.userId,
      token: token,
      roleId: validation.roleId,
    };

    return true;
  }

  private validateToken(token: string): {
    valid: boolean;
    userId?: string;
    roleId?: number;
    expired?: boolean;
    error?: string;
  } {
    if (!token || token.trim() === '') {
      return { valid: false, error: 'Token is missing' };
    }

    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        return { valid: false, error: 'Invalid token format' };
      }

      const payload = Buffer.from(parts[1], 'base64').toString('utf-8');
      const decoded = JSON.parse(payload);

      const userId = decoded.sub || decoded.id;
      if (!userId) {
        return { valid: false, error: 'Token does not contain user ID' };
      }

      const roleId = decoded.roleId != null ? Number(decoded.roleId) : undefined;

      const exp = decoded.exp;
      if (exp) {
        const expirationTime = exp * 1000;
        const now = Date.now();
        if (now >= expirationTime) {
          return {
            valid: false,
            expired: true,
            error: 'Token has expired',
          };
        }
      }

      return { valid: true, userId, roleId };
    } catch (error: any) {
      this.logger.warn(`Token validation error: ${error.message}`);
      return { valid: false, error: 'Invalid token format' };
    }
  }
}

