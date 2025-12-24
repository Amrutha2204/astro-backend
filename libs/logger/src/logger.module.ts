import { DynamicModule, Logger, Module } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER, WinstonModule } from 'nest-winston';
import { buildWinstonOptions } from './logger.factory';

@Module({})
export class LoggerModule {
  static forRoot(serviceName: string, logLevel?: string): DynamicModule {
    return {
      module: LoggerModule,
      imports: [WinstonModule.forRoot(buildWinstonOptions(serviceName, logLevel))],
      providers: [
        {
          provide: Logger,
          useExisting: WINSTON_MODULE_NEST_PROVIDER,
        },
      ],
      exports: [WinstonModule, Logger],
    };
  }
}
