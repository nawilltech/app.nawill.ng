import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CursorPaginationDto {
  @IsOptional()
  @IsString()
  cursor?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 20;
}

/** Prisma args for `findMany({ ...cursorArgs(dto), orderBy: [{ createdAt: 'desc' }, { id: 'desc' }] })`. */
export function cursorArgs(dto: CursorPaginationDto) {
  return {
    take: dto.limit + 1,
    ...(dto.cursor ? { skip: 1, cursor: { id: dto.cursor } } : {}),
  };
}

export interface CursorPageResult<T extends { id: string }> {
  items: T[];
  nextCursor: string | null;
}

/** Slice the `limit + 1` rows fetched via cursorArgs() down to a page + next-cursor. */
export function sliceCursorPage<T extends { id: string }>(rows: T[], limit: number): CursorPageResult<T> {
  const hasNextPage = rows.length > limit;
  const items = hasNextPage ? rows.slice(0, limit) : rows;
  return { items, nextCursor: hasNextPage ? items[items.length - 1].id : null };
}
