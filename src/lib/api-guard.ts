import { NextResponse } from 'next/server';
import { isAuthenticated } from './auth';

export async function requireAdmin(): Promise<NextResponse | null> {
  if (await isAuthenticated()) return null;
  return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
}

export function badRequest(message: string) {
  return NextResponse.json({ ok: false, error: message }, { status: 400 });
}
