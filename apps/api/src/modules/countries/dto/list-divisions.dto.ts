import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';
import { CursorPaginationDto } from '../../../common/dto/pagination.dto';

export class ListDivisionsDto extends CursorPaginationDto {
  /** 1 = top tier (e.g. State). Omit to get every tier for the country. */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  tier?: number;

  /** Pass a division's id to get its direct children (e.g. a state's LGAs). Omit for top-level divisions. */
  @IsOptional()
  @IsString()
  parentId?: string;
}
