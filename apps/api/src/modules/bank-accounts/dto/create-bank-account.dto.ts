import { IsOptional, IsString, Length, MinLength } from 'class-validator';

export class CreateBankAccountDto {
  /** Paystack bank code, e.g. "058" for GTBank. */
  @IsString()
  @MinLength(2)
  bankCode: string;

  @IsString()
  @MinLength(2)
  bankName: string;

  @IsString()
  @Length(10, 10)
  accountNumber: string;

  @IsOptional()
  @IsString()
  currency?: string;
}
