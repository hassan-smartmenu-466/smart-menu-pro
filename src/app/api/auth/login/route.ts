import { NextRequest, NextResponse } from 'next/server';
import { verifyCredentials, createSession, cookieName } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { username, password } = body as { username?: string; password?: string };
  if (!username || !password || !verifyCredentials(username, password)) {
    return NextResponse.json({ ok: false, error: 'invalid_credentials' }, { status: 401 });
  }
  const { token, expires } = createSession();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(cookieName(), token, {
    httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production',
    expires, path: '/',
  });
  return res;
}
