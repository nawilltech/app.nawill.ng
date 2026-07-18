import { NextRequest, NextResponse } from 'next/server';
import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE, sessionCookieOptions } from '@/lib/session';
import { ApiEnvelope } from '@/lib/types';

const API_URL = process.env.NAWILL_API_URL ?? 'http://localhost:4000/api/v1';

interface LoginResult {
  accessToken?: string;
  refreshToken?: string;
  requiresTwoFactor?: true;
  method?: 'email' | 'totp';
  challengeToken?: string;
}

/**
 * Proxies to the NestJS API rather than having the browser call it directly, so the
 * access/refresh tokens can be set as httpOnly cookies — the browser's JS never sees
 * them. This is the one architectural decision that shapes every dashboard page:
 * they're Server Components reading the cookie via lib/session.ts, not client
 * components holding a token in memory. See docs/ARCHITECTURE.md §10.
 */
export async function POST(req: NextRequest) {
  const body = await req.json();

  const apiRes = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const envelope = (await apiRes.json()) as ApiEnvelope<LoginResult>;

  if (!envelope.success) {
    return NextResponse.json({ success: false, message: envelope.message, errorCode: envelope.errorCode }, { status: apiRes.status });
  }

  if (envelope.data.requiresTwoFactor) {
    // No cookies yet — the client still needs to submit a 2FA code. See
    // docs/QA.md §5.4 for the underlying login-lockout/2FA flow this fronts.
    return NextResponse.json({
      success: true,
      requiresTwoFactor: true,
      method: envelope.data.method,
      challengeToken: envelope.data.challengeToken,
    });
  }

  const res = NextResponse.json({ success: true });
  res.cookies.set(ACCESS_TOKEN_COOKIE, envelope.data.accessToken as string, sessionCookieOptions(15 * 60));
  res.cookies.set(REFRESH_TOKEN_COOKIE, envelope.data.refreshToken as string, sessionCookieOptions(7 * 24 * 60 * 60));
  return res;
}
