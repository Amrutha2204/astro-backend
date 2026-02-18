import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (!user) {
      throw new HttpException(
        'Authentication required.',
        HttpStatus.UNAUTHORIZED,
      );
    }
    const adminRoleId = this.configService.get<number>('ADMIN_ROLE_ID') ?? 3;
    if (user.roleId !== adminRoleId) {
      throw new HttpException(
        'Admin access required.',
        HttpStatus.FORBIDDEN,
      );
    }
    return true;
  }
}
