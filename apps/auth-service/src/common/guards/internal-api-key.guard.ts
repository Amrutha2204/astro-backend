import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

@Injectable()
export class InternalApiKeyGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const key = request.headers['x-internal-api-key'];
    const expected = this.configService.get<string>('AUTH_INTERNAL_API_KEY');
    if (!expected || key !== expected) {
      throw new UnauthorizedException('Invalid or missing internal API key');
    }
    return true;
  }
}
