import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';

/** Role.Admin = 3 from auth-service */
const ADMIN_ROLE_ID = 3;

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (!user) {
      throw new HttpException(
        'Authentication required.',
        HttpStatus.UNAUTHORIZED,
      );
    }
    if (user.roleId !== ADMIN_ROLE_ID) {
      throw new HttpException(
        'Admin access required.',
        HttpStatus.FORBIDDEN,
      );
    }
    return true;
  }
}
