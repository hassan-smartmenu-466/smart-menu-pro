import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { setOrderStatus, type OrderStatus } from '@/lib/orders';
import { requireAdmin } from '@/lib/api-guard';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id } = await params;
  const order = getDb().prepare('SELECT * FROM orders WHERE id = ?').get(Number(id));
  if (!order) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  const items = getDb().prepare('SELECT * FROM order_items WHERE order_id = ?').all(Number(id));
  return NextResponse.json({ order, items });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const status = String(body.status || '') as OrderStatus;
  const ok = setOrderStatus(Number(id), status);
  if (!ok) return NextResponse.json({ ok: false, error: 'invalid' }, { status: 400 });
  return NextResponse.json({ ok: true });
}
