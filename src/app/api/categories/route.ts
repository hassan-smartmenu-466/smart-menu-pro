import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireAdmin } from '@/lib/api-guard';

export async function GET() {
  return NextResponse.json({ categories: getDb().prepare('SELECT * FROM categories ORDER BY sort_order, id').all() });
}

export async function POST(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const body = await req.json().catch(() => ({}));
  const nameEn = String(body.name_en || '').trim().slice(0, 80);
  if (!nameEn) return NextResponse.json({ ok: false, error: 'name_required' }, { status: 400 });
  const slug = nameEn.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || `cat-${Date.now()}`;
  const max = getDb().prepare('SELECT COALESCE(MAX(sort_order),0)+1 AS s FROM categories').get() as { s: number };
  const r = getDb().prepare(
    'INSERT INTO categories (slug, name_en, name_ar, name_fr, sort_order) VALUES (?, ?, ?, ?, ?)'
  ).run(slug, nameEn, String(body.name_ar || '').slice(0, 80), String(body.name_fr || '').slice(0, 80), max.s);
  return NextResponse.json({ ok: true, id: Number(r.lastInsertRowid), slug });
}

export async function PATCH(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const body = await req.json().catch(() => ({}));
  const id = Number(body.id);
  if (!Number.isInteger(id)) return NextResponse.json({ ok: false }, { status: 400 });
  const allowed = ['name_en', 'name_ar', 'name_fr', 'image', 'sort_order'];
  const sets: string[] = [];
  const args: (string | number | null)[] = [];
  for (const k of allowed) {
    if (body[k] !== undefined) { sets.push(`${k} = ?`); args.push(k === 'sort_order' ? Math.round(Number(body[k])) : String(body[k]).slice(0, 300)); }
  }
  if (body.active !== undefined) { sets.push('active = ?'); args.push(body.active ? 1 : 0); }
  if (sets.length === 0) return NextResponse.json({ ok: false }, { status: 400 });
  args.push(id);
  getDb().prepare(`UPDATE categories SET ${sets.join(', ')} WHERE id = ?`).run(...args);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const id = Number(new URL(req.url).searchParams.get('id'));
  if (!Number.isInteger(id)) return NextResponse.json({ ok: false }, { status: 400 });
  getDb().prepare('DELETE FROM categories WHERE id = ?').run(id);
  return NextResponse.json({ ok: true });
}
