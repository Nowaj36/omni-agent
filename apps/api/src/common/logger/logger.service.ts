import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';
import { Logger, pino } from 'pino';
import { ConfigService } from '../../config/config.service';

@Injectable()
export class LoggerService implements NestLoggerService {
  private readonly logger: Logger;

  constructor(config: ConfigService) {
    this.logger = pino({
      level: config.logLevel,
      transport: config.isProduction
        ? undefined
        : { target: 'pino-pretty', options: { singleLine: true } },
    });
  }

  log(message: string, context?: string): void {
    this.logger.info({ context }, message);
  }

  error(message: string, trace?: string, context?: string): void {
    this.logger.error({ context, trace }, message);
  }

  warn(message: string, context?: string): void {
    this.logger.warn({ context }, message);
  }

  debug(message: string, context?: string): void {
    this.logger.debug({ context }, message);
  }

  verbose(message: string, context?: string): void {
    this.logger.trace({ context }, message);
  }
}
