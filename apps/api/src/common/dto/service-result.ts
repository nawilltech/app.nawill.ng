import { ServiceResult } from '../interceptors/response.interceptor';
import { CursorPageResult } from './pagination.dto';

export function ok<T>(data: T, message = 'Request successful'): ServiceResult<T> {
  return { message, data };
}

export interface CursorMeta {
  limit: number;
  nextCursor: string | null;
  hasNextPage: boolean;
}

export function paginated<T>(
  data: T[],
  limit: number,
  nextCursor: string | null,
  message = 'Request successful',
): ServiceResult<T[]> {
  const meta: CursorMeta = { limit, nextCursor, hasNextPage: nextCursor !== null };
  return { message, data, meta: meta as unknown as Record<string, unknown> };
}

/** Same as `paginated()`, but takes the `{ items, nextCursor }` shape services return directly. */
export function paginatedFrom<T extends { id: string }>(
  page: CursorPageResult<T>,
  limit: number,
  message = 'Request successful',
): ServiceResult<T[]> {
  return paginated(page.items, limit, page.nextCursor, message);
}
