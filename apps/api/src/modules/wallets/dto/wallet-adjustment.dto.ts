import { WalletDirection } from '@prisma/client';
import { IsEnum, IsInt, IsString, Min, MinLength } from 'class-validator';

export class WalletAdjustmentDto {
  @IsEnum(WalletDirection)
  direction: WalletDirection;

  /** Minor units (kobo). */
  @IsInt()
  @Min(1)
  amountMinor: number;

  @IsString()
  @MinLength(5)
  reason: string;
}
