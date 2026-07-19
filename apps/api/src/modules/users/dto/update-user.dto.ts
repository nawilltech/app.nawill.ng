import { UserType } from '@prisma/client';
import { IsBoolean, IsEnum, IsOptional } from 'class-validator';

/** Admin-only: change a user's role or activate/deactivate their account. */
export class UpdateUserDto {
  @IsOptional()
  @IsEnum(UserType)
  userType?: UserType;

  @IsOptional()
  @IsBoolean()
  status?: boolean;
}
