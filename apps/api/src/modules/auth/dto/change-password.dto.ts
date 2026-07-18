import { IsString } from 'class-validator';
import { IsStrongPassword } from '../../../common/validators/strong-password.decorator';

export class ChangePasswordDto {
  @IsString()
  currentPassword: string;

  @IsStrongPassword()
  newPassword: string;
}
