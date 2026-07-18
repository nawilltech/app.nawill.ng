import { IsString } from 'class-validator';
import { IsStrongPassword } from '../../../common/validators/strong-password.decorator';

export class ResetPasswordDto {
  @IsString()
  token: string;

  @IsStrongPassword()
  newPassword: string;
}
