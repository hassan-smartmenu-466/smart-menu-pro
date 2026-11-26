import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { destroySession, cookieName } from '@/lib/auth';

export async function POST() {
  const store = await cookies();
  const token = store.get(cookieName())?.value;
  if (token) destroySession(token);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(cookieName(), '', { httpOnly: true, expires: new Date(0), path: '/' });
  return res;
}
