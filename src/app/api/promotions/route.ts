import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireAdmin } from '@/lib/api-guard';

const TYPES = ['percent', 'fixed', 'promo_code', 'product_offer', 'combo'];

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  return NextResponse.json({ promotions: getDb().prepare('SELECT * FROM promotions ORDER BY id DESC').all() });
}

export async function POST(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const body = await req.json().catch(() => ({}));
  const type = String(body.type || '');
  const name = String(body.name || '').trim().slice(0, 120);
  if (!TYPES.includes(type) || !name) return NextResponse.json({ ok: false, error: 'invalid' }, { status: 400 });
  const r = getDb().prepare(
    `INSERT INTO promotions (type, name, code, percent, amount_cents, product_id, combo_items, combo_price_cents, starts_at, ends_at, active, usage_limit)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    type, name,
    String(body.code || '').trim().slice(0, 40),
    Math.max(0, Math.min(100, Number(body.percent) || 0)),
    Math.max(0, Math.round(Number(body.amount_cents) || 0)),
    body.product_id ? Number(body.product_id) : null,
    JSON.stringify(Array.isArray(body.combo_items) ? body.combo_items.map(Number).slice(0, 20) : []),
    Math.max(0, Math.round(Number(body.combo_price_cents) || 0)),
    String(body.starts_at || ''), String(body.ends_at || ''),
    body.active === false ? 0 : 1,
    Math.max(0, Math.round(Number(body.usage_limit) || 0))
  );
  return NextResponse.json({ ok: true, id: Number(r.lastInsertRowid) });
}

export async function PATCH(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const body = await req.json().catch(() => ({}));
  const id = Number(body.id);
  if (!Number.isInteger(id)) return NextResponse.json({ ok: false }, { status: 400 });
  const allowed: Record<string, (v: unknown) => string | number | null> = {
    name: (v) => String(v).slice(0, 120),
    code: (v) => String(v).trim().slice(0, 40),
    percent: (v) => Math.max(0, Math.min(100, Number(v) || 0)),
    amount_cents: (v) => Math.max(0, Math.round(Number(v) || 0)),
    combo_price_cents: (v) => Math.max(0, Math.round(Number(v) || 0)),
    starts_at: (v) => String(v), ends_at: (v) => String(v),
    active: (v) => (v ? 1 : 0),
    usage_limit: (v) => Math.max(0, Math.round(Number(v) || 0)),
    combo_items: (v) => JSON.stringify(Array.isArray(v) ? (v as unknown[]).map(Number).slice(0, 20) : []),
    product_id: (v) => (v ? Number(v) : null),
  };
  const sets: string[] = [];
  const args: (string | number | null)[] = [];
  for (const [k, fn] of Object.entries(allowed)) {
    if (body[k] !== undefined) { sets.push(`${k} = ?`); args.push(fn(body[k])); }
  }
  if (sets.length === 0) return NextResponse.json({ ok: false }, { status: 400 });
  args.push(id);
  getDb().prepare(`UPDATE promotions SET ${sets.join(', ')} WHERE id = ?`).run(...args);
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const id = Number(new URL(req.url).searchParams.get('id'));
  getDb().prepare('DELETE FROM promotions WHERE id = ?').run(id);
  return NextResponse.json({ ok: true });
}
