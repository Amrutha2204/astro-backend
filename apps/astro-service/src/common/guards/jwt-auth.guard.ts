import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  private readonly logger = new Logger(JwtAuthGuard.name);

  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers?.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new HttpException(
        'Authentication required. Please provide a valid JWT token.',
        HttpStatus.UNAUTHORIZED,
      );
    }

    const token = authHeader.substring(7);
    if (!token || !token.trim()) {
      throw new HttpException('Token is missing', HttpStatus.UNAUTHORIZED);
    }

    try {
      const payload = await this.jwtService.verifyAsync(token);
      const userId = payload.sub || payload.id;
      if (!userId) {
        throw new HttpException('Invalid token: missing user id', HttpStatus.UNAUTHORIZED);
      }
      const roleId = payload.roleId != null ? Number(payload.roleId) : undefined;
      request.user = {
        userId: String(userId),
        token,
        roleId,
      };
      return true;
    } catch (err: any) {
      if (err?.name === 'TokenExpiredError') {
        throw new HttpException(
          'Token has expired. Please login again.',
          HttpStatus.UNAUTHORIZED,
        );
      }
      if (err?.message?.includes('secret') || err?.message?.includes('signature')) {
        this.logger.warn('JWT verification failed (bad secret or signature)');
      } else {
        this.logger.warn(`JWT verification error: ${err?.message || err}`);
      }
      throw new HttpException(
        err?.message || 'Invalid or expired token',
        HttpStatus.UNAUTHORIZED,
      );
    }
  }
}
