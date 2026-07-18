import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/** Skips JwtAuthGuard (registered globally) for signup/login/webhooks/health. */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
