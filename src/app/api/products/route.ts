import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireAdmin } from '@/lib/api-guard';

const EDITABLE = new Set([
  'category_id', 'name', 'name_ar', 'name_fr', 'description', 'description_ar', 'description_fr',
  'price_cents', 'image', 'available', 'sold_out', 'featured', 'best_seller', 'is_new', 'sort_order',
  'cost_ingredients_cents', 'cost_preparation_cents', 'cost_packaging_cents', 'cost_other_cents',
]);

export async function GET() {
  const products = getDb().prepare('SELECT * FROM products ORDER BY sort_order, id').all();
  return NextResponse.json({ products });
}

export async function POST(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const body = await req.json().catch(() => ({}));
  const name = String(body.name || '').trim().slice(0, 120);
  const categoryId = Number(body.category_id);
  const priceCents = Math.round(Number(body.price_cents));
  if (!name || !Number.isInteger(categoryId) || !Number.isFinite(priceCents) || priceCents < 0) {
    return NextResponse.json({ ok: false, error: 'invalid' }, { status: 400 });
  }
  const cat = getDb().prepare('SELECT id FROM categories WHERE id = ?').get(categoryId);
  if (!cat) return NextResponse.json({ ok: false, error: 'bad_category' }, { status: 400 });
  const max = getDb().prepare('SELECT COALESCE(MAX(sort_order),0)+1 AS s FROM products').get() as { s: number };
  const r = getDb().prepare(
    `INSERT INTO products (category_id, name, name_ar, name_fr, description, description_ar, description_fr,
      price_cents, available, sort_order)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`
  ).run(
    categoryId, name,
    String(body.name_ar || '').slice(0, 120), String(body.name_fr || '').slice(0, 120),
    String(body.description || '').slice(0, 500), String(body.description_ar || '').slice(0, 500),
    String(body.description_fr || '').slice(0, 500), priceCents, max.s
  );
  return NextResponse.json({ ok: true, id: Number(r.lastInsertRowid) });
}

export async function PATCH(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const body = await req.json().catch(() => ({}));
  const id = Number(body.id);
  if (!Number.isInteger(id)) return NextResponse.json({ ok: false }, { status: 400 });
  const sets: string[] = [];
  const args: (string | number | null)[] = [];
  for (const [k, v] of Object.entries(body)) {
    if (!EDITABLE.has(k)) continue;
    if (k.endsWith('_cents') || k === 'category_id' || k === 'sort_order') {
      const n = Math.round(Number(v));
      if (!Number.isFinite(n)) continue;
      sets.push(`${k} = ?`); args.push(n);
    } else if (['available', 'sold_out', 'featured', 'best_seller', 'is_new'].includes(k)) {
      sets.push(`${k} = ?`); args.push(v ? 1 : 0);
    } else {
      sets.push(`${k} = ?`); args.push(String(v).slice(0, 500));
    }
  }
  if (sets.length === 0) return NextResponse.json({ ok: false, error: 'nothing_to_update' }, { status: 400 });
  sets.push("updated_at = datetime('now')");
  args.push(id);
  getDb().prepare(`UPDATE products SET ${sets.join(', ')} WHERE id = ?`).run(...args);
  // Extras links
  if (Array.isArray(body.extra_ids)) {
    const db = getDb();
    db.prepare('DELETE FROM product_extras WHERE product_id = ?').run(id);
    const ins = db.prepare('INSERT OR IGNORE INTO product_extras (product_id, extra_id) VALUES (?, ?)');
    for (const eid of body.extra_ids.slice(0, 50)) ins.run(id, Number(eid));
  }
  // Recommendation links
  if (Array.isArray(body.recommended_ids)) {
    const db = getDb();
    db.prepare('DELETE FROM recommendations WHERE product_id = ?').run(id);
    const ins = db.prepare('INSERT OR IGNORE INTO recommendations (product_id, recommended_product_id) VALUES (?, ?)');
    for (const rid of body.recommended_ids.slice(0, 20)) ins.run(id, Number(rid));
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const url = new URL(req.url);
  const id = Number(url.searchParams.get('id'));
  if (!Number.isInteger(id)) return NextResponse.json({ ok: false }, { status: 400 });
  getDb().prepare('DELETE FROM products WHERE id = ?').run(id);
  return NextResponse.json({ ok: true });
}
