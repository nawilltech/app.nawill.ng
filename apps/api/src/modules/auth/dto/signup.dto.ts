import { ClientType } from '@prisma/client';
import { IsEmail, IsEnum, IsOptional, IsString, MinLength, ValidateIf } from 'class-validator';
import { IsStrongPassword } from '../../../common/validators/strong-password.decorator';
import { MatchesField } from '../../../common/validators/matches-field.decorator';

export class SignupDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsEmail()
  email: string;

  @IsStrongPassword()
  password: string;

  @IsString()
  @MatchesField('password', { message: 'confirmPassword must match password' })
  confirmPassword: string;

  @IsEnum(ClientType)
  clientType: ClientType;

  @ValidateIf((dto: SignupDto) => dto.clientType === ClientType.corporate)
  @IsString()
  @MinLength(2)
  organizationName?: string;

  @IsOptional()
  @IsString()
  phoneNo?: string;
}
