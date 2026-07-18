import { cookies } from 'next/headers';

export const ACCESS_TOKEN_COOKIE = 'nawill_access_token';
export const REFRESH_TOKEN_COOKIE = 'nawill_refresh_token';

const isProd = process.env.NODE_ENV === 'production';

/** Shared so login/signup/2fa-verify route handlers don't each redefine cookie options. */
export function sessionCookieOptions(maxAgeSeconds: number) {
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax' as const,
    path: '/',
    maxAge: maxAgeSeconds,
  };
}

/** Server Components only read the access token — refresh happens via the API, not here yet (see docs/ARCHITECTURE.md §10). */
export function getAccessToken(): string | undefined {
  return cookies().get(ACCESS_TOKEN_COOKIE)?.value;
}

export function isAuthenticated(): boolean {
  return Boolean(getAccessToken());
}
