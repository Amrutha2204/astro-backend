import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHealth(service: string) {
    return { status: 'ok', service } as const;
  }
}
