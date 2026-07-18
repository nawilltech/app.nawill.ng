import { applyDecorators } from '@nestjs/common';
import { IsStrongPassword as BaseIsStrongPassword } from 'class-validator';

/** Min 8 chars, at least one uppercase, one lowercase, one number, one special character. */
export function IsStrongPassword() {
  return applyDecorators(
    BaseIsStrongPassword(
      { minLength: 8, minLowercase: 1, minUppercase: 1, minNumbers: 1, minSymbols: 1 },
      { message: 'password must be at least 8 characters and include uppercase, lowercase, a number, and a special character' },
    ),
  );
}
