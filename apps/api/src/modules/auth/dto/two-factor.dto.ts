import { IsString, Length } from 'class-validator';

export class ConfirmTotpDto {
  @IsString()
  @Length(6, 6)
  code: string;
}

export class EnableEmailTwoFactorDto {
  @IsString()
  @Length(6, 6)
  code: string;
}

export class DisableTwoFactorDto {
  @IsString()
  password: string;
}

export class VerifyTwoFactorDto {
  @IsString()
  challengeToken: string;

  @IsString()
  @Length(6, 6)
  code: string;
}
