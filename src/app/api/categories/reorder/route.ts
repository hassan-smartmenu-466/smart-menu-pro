import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireAdmin } from '@/lib/api-guard';

export async function POST(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const body = await req.json().catch(() => ({}));
  const ids = (body.ids as number[]) || [];
  const stmt = getDb().prepare('UPDATE categories SET sort_order = ? WHERE id = ?');
  ids.forEach((id, i) => stmt.run(i + 1, Number(id)));
  return NextResponse.json({ ok: true });
}
