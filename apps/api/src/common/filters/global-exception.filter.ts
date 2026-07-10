import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import {
  DomainError,
  ProviderError,
  VerificationError,
} from '../../core/errors';
import { LoggerService } from '../logger/logger.service';

interface ErrorShape {
  readonly status: number;
  readonly code: string;
  readonly message: string;
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: LoggerService) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();
    const { status, code, message } = this.describe(exception);

    this.logger.error(
      `${request.method} ${request.url} failed: ${message}`,
      exception instanceof Error ? exception.stack : undefined,
      GlobalExceptionFilter.name,
    );

    response.status(status).json({
      statusCode: status,
      code,
      message,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }

  private describe(exception: unknown): ErrorShape {
    if (exception instanceof HttpException) {
      return {
        status: exception.getStatus(),
        code: exception.name,
        message: exception.message,
      };
    }
    if (exception instanceof DomainError) {
      return {
        status: this.statusFor(exception),
        code: exception.code,
        message: exception.message,
      };
    }
    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      code: 'INTERNAL_ERROR',
      message: 'Internal server error',
    };
  }

  private statusFor(error: DomainError): number {
    if (error instanceof ProviderError) {
      return HttpStatus.BAD_GATEWAY;
    }
    if (error instanceof VerificationError) {
      return HttpStatus.UNPROCESSABLE_ENTITY;
    }
    return HttpStatus.INTERNAL_SERVER_ERROR;
  }
}
