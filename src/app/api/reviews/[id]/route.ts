import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireAdmin } from '@/lib/api-guard';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const sets: string[] = [];
  const args: (string | number | null)[] = [];
  if (body.status && ['pending', 'approved', 'rejected'].includes(body.status)) {
    sets.push('status = ?'); args.push(body.status);
  }
  if (typeof body.owner_reply === 'string') {
    sets.push('owner_reply = ?'); args.push(body.owner_reply.slice(0, 600));
  }
  if (typeof body.show_on_homepage === 'boolean') {
    sets.push('show_on_homepage = ?'); args.push(body.show_on_homepage ? 1 : 0);
  }
  if (sets.length === 0) return NextResponse.json({ ok: false }, { status: 400 });
  args.push(Number(id));
  getDb().prepare(`UPDATE reviews SET ${sets.join(', ')} WHERE id = ?`).run(...args);
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id } = await params;
  getDb().prepare('DELETE FROM reviews WHERE id = ?').run(Number(id));
  return NextResponse.json({ ok: true });
}
