import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response } from 'express';

interface ErrorDetail {
  field?: string;
  message: string;
}

const DEFAULT_ERROR_CODES: Record<number, string> = {
  400: 'VALIDATION_ERROR',
  401: 'UNAUTHENTICATED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  409: 'CONFLICT',
  422: 'UNPROCESSABLE',
  429: 'RATE_LIMITED',
  500: 'INTERNAL_ERROR',
};

@Catch()
export class AppExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(AppExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const requestId = (request.headers['x-request-id'] as string) ?? undefined;

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errors: ErrorDetail[] | undefined;
    let errorCode: string | undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const body = exception.getResponse();

      if (typeof body === 'string') {
        message = body;
      } else if (typeof body === 'object' && body !== null) {
        const b = body as Record<string, unknown>;
        message = typeof b.message === 'string' ? b.message : (exception.message ?? 'Request failed');
        errorCode = typeof b.errorCode === 'string' ? b.errorCode : undefined;
        if (Array.isArray(b.errors)) {
          errors = b.errors as ErrorDetail[];
        } else if (Array.isArray(b.message)) {
          errors = (b.message as string[]).map((m) => ({ message: m }));
          message = 'Validation failed';
        }
      }
    } else {
      this.logger.error(exception instanceof Error ? exception.stack : exception);
    }

    response.status(status).json({
      success: false,
      message,
      ...(errors ? { errors } : {}),
      errorCode: errorCode ?? DEFAULT_ERROR_CODES[status] ?? 'INTERNAL_ERROR',
      requestId,
    });
  }
}
