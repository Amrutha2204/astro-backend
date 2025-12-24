import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { format, transports } from 'winston';
import { WinstonModule, WinstonModuleOptions } from 'nest-winston';

const { combine, errors, colorize, printf, splat, timestamp } = format;

function ensureLogDirectory(logDir: string): void {
  if (!existsSync(logDir)) {
    mkdirSync(logDir, { recursive: true });
  }
}

function buildConsoleFormat(serviceName: string) {
  return combine(
    colorize({ all: true }),
    timestamp({
      format: () =>
        new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }),
    }),
    splat(),
    errors({ stack: true }),
    printf(({ timestamp: ts, level, message, stack }) => {
      const base = stack ? `${message}\n${stack}` : message;
      return `${ts} [${serviceName}] ${level}: ${base}`;
    }),
  );
}

function buildFileFormat(serviceName: string) {
  return combine(
    timestamp({
      format: () =>
        new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }),
    }),
    splat(),
    errors({ stack: true }),
    printf(({ timestamp: ts, level, message, stack }) => {
      const base = stack ? `${message}\n${stack}` : message;
      return `${ts} [${serviceName}] ${level}: ${base}`;
    }),
  );
}

export function buildWinstonOptions(
  serviceName: string,
  logLevel = (process.env.LOG_LEVEL || 'info').toLowerCase(),
): WinstonModuleOptions {
  const logDir = join(process.cwd(), 'logs');
  ensureLogDirectory(logDir);

  return {
    level: logLevel,
    defaultMeta: { service: serviceName },
    transports: [
      new transports.Console({
        level: logLevel,
        format: buildConsoleFormat(serviceName),
      }),
      new transports.File({
        filename: join(logDir, 'error.log'),
        level: 'error',
        format: buildFileFormat(serviceName),
      }),
      new transports.File({
        filename: join(logDir, 'combined.log'),
        level: logLevel,
        format: buildFileFormat(serviceName),
      }),
    ],
  };
}

export function createLogger(serviceName: string, logLevel?: string) {
  return WinstonModule.createLogger(buildWinstonOptions(serviceName, logLevel));
}
