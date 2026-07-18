import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateDivisionDto {
  /** Omit to create a top-level (tier 1) division; pass a division id to nest it underneath. */
  @IsOptional()
  @IsString()
  parentId?: string;

  @IsInt()
  @Min(1)
  tier: number;

  /** What this tier is called in this country — "State", "LocalGovernmentArea", "Ward", ... */
  @IsString()
  type: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  capital?: string;

  @IsOptional()
  @IsString()
  code?: string;
}
