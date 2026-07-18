import { NextRequest, NextResponse } from 'next/server';
import { ApiEnvelope } from '@/lib/types';

const API_URL = process.env.NAWILL_API_URL ?? 'http://localhost:4000/api/v1';

export async function POST(req: NextRequest) {
  const body = await req.json();

  const apiRes = await fetch(`${API_URL}/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const envelope = (await apiRes.json()) as ApiEnvelope<{ message: string }>;

  return NextResponse.json(
    envelope.success ? { success: true, message: envelope.data.message } : { success: false, message: envelope.message },
    { status: apiRes.status },
  );
}
