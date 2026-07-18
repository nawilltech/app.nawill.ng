import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class FundWalletDto {
  /** Minor units (kobo). */
  @IsInt()
  @Min(100)
  amountMinor: number;

  @IsOptional()
  @IsString()
  currency?: string;
}
