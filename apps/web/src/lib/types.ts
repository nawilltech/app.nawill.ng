/** Mirrors the envelope every NestJS API response uses — see docs/TECHNICAL.md §1.3. */
export interface ApiSuccess<T> {
  success: true;
  message: string;
  data: T;
  meta?: { limit: number; nextCursor: string | null; hasNextPage: boolean };
}

export interface ApiFailure {
  success: false;
  message: string;
  errors?: { field?: string; message: string }[];
  errorCode: string;
  requestId?: string;
}

export type ApiEnvelope<T> = ApiSuccess<T> | ApiFailure;

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly errorCode: string,
    public readonly errors?: { field?: string; message: string }[],
  ) {
    super(message);
    this.name = 'ApiError';
  }
}
