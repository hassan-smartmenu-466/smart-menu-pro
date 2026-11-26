import { NextRequest, NextResponse } from 'next/server';
import { createOrder, type OrderInput } from '@/lib/orders';
import { getDb } from '@/lib/db';
import { requireAdmin } from '@/lib/api-guard';

export async function POST(req: NextRequest) {
  let body: OrderInput;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'bad_json' }, { status: 400 });
  }
  // Input validation
  if (!body.customerName || String(body.customerName).trim().length < 2) {
    return NextResponse.json({ ok: false, error: 'name_required' }, { status: 400 });
  }
  if (!body.phone || !/^[+0-9][0-9\s-]{5,18}$/.test(String(body.phone).trim())) {
    return NextResponse.json({ ok: false, error: 'phone_invalid' }, { status: 400 });
  }
  if (body.fulfillment !== 'delivery' && body.fulfillment !== 'pickup') {
    return NextResponse.json({ ok: false, error: 'fulfillment_invalid' }, { status: 400 });
  }
  if (body.fulfillment === 'delivery' && !String(body.address || '').trim()) {
    return NextResponse.json({ ok: false, error: 'address_required' }, { status: 400 });
  }
  if (!Array.isArray(body.items) || body.items.length === 0 || body.items.length > 60) {
    return NextResponse.json({ ok: false, error: 'empty_cart' }, { status: 400 });
  }
  const result = createOrder({
    ...body,
    customerName: String(body.customerName).trim().slice(0, 80),
    phone: String(body.phone).trim().slice(0, 20),
    address: String(body.address || '').slice(0, 200),
    addressNotes: String(body.addressNotes || '').slice(0, 200),
    notes: String(body.notes || '').slice(0, 500),
    paymentMethod: String(body.paymentMethod || '').slice(0, 40),
    promoCode: String(body.promoCode || '').slice(0, 40),
    tableNumber: String(body.tableNumber || '').slice(0, 20),
    lang: String(body.lang || 'en').slice(0, 5),
  });
  if (!result.ok) return NextResponse.json({ ok: false, error: result.error }, { status: 400 });
  return NextResponse.json({ ok: true, orderNumber: result.orderNumber, totalCents: result.totalCents });
}

export async function GET(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const url = new URL(req.url);
  const status = url.searchParams.get('status') || '';
  const q = (url.searchParams.get('q') || '').trim();
  const from = url.searchParams.get('from') || '';
  const to = url.searchParams.get('to') || '';
  const where: string[] = [];
  const args: (string | number | null)[] = [];
  if (status) { where.push('status = ?'); args.push(status); }
  if (from) { where.push('created_at >= ?'); args.push(from); }
  if (to) { where.push('created_at <= ?'); args.push(to); }
  if (q) { where.push('(order_number LIKE ? OR customer_name LIKE ? OR phone LIKE ?)'); args.push(`%${q}%`, `%${q}%`, `%${q}%`); }
  const rows = getDb().prepare(
    `SELECT * FROM orders ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY id DESC LIMIT 300`
  ).all(...args) as Record<string, unknown>[];
  return NextResponse.json({ orders: rows });
}
