import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireAdmin } from '@/lib/api-guard';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const name = String(body.customerName || '').trim().slice(0, 60);
  const rating = Math.floor(Number(body.rating));
  const text = String(body.text || '').trim().slice(0, 600);
  if (!name || !Number.isFinite(rating) || rating < 1 || rating > 5) {
    return NextResponse.json({ ok: false, error: 'invalid' }, { status: 400 });
  }
  getDb().prepare('INSERT INTO reviews (customer_name, rating, text) VALUES (?, ?, ?)').run(name, rating, text);
  return NextResponse.json({ ok: true });
}

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  const reviews = getDb().prepare('SELECT * FROM reviews ORDER BY id DESC LIMIT 200').all();
  return NextResponse.json({ reviews });
}
