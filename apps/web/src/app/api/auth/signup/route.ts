import { NextRequest, NextResponse } from 'next/server';
import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE, sessionCookieOptions } from '@/lib/session';
import { ApiEnvelope } from '@/lib/types';

const API_URL = process.env.NAWILL_API_URL ?? 'http://localhost:4000/api/v1';

interface SignupResult {
  accessToken: string;
  refreshToken: string;
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  const apiRes = await fetch(`${API_URL}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const envelope = (await apiRes.json()) as ApiEnvelope<SignupResult>;

  if (!envelope.success) {
    return NextResponse.json(
      { success: false, message: envelope.message, errorCode: envelope.errorCode, errors: envelope.errors },
      { status: apiRes.status },
    );
  }

  const res = NextResponse.json({ success: true });
  res.cookies.set(ACCESS_TOKEN_COOKIE, envelope.data.accessToken, sessionCookieOptions(15 * 60));
  res.cookies.set(REFRESH_TOKEN_COOKIE, envelope.data.refreshToken, sessionCookieOptions(7 * 24 * 60 * 60));
  return res;
}
