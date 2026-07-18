import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ServiceResult<T = unknown> {
  message: string;
  data: T;
  meta?: Record<string, unknown>;
}

/**
 * Controllers return { message, data, meta? } (see common/dto/service-result.ts helpers).
 * This wraps that into the standard { success, message, data, meta? } envelope from
 * docs/TECHNICAL.md §1.3 so every handler doesn't repeat the envelope shape by hand.
 */
@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      map((result: ServiceResult) => {
        if (result && typeof result === 'object' && 'data' in result && 'message' in result) {
          return {
            success: true,
            message: result.message,
            data: result.data,
            ...(result.meta ? { meta: result.meta } : {}),
          };
        }
        return { success: true, message: 'Request successful', data: result };
      }),
    );
  }
}
