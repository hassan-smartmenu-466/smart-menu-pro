import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

// Public order tracking: requires order number AND the phone used to order.
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const number = url.searchParams.get('number') || '';
  const phone = (url.searchParams.get('phone') || '').replace(/[^0-9+]/g, '');
  if (!number || !phone) return NextResponse.json({ error: 'bad_request' }, { status: 400 });
  const row = getDb().prepare('SELECT status FROM orders WHERE order_number = ? AND phone = ?').get(number, phone) as
    | { status: string } | undefined;
  if (!row) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  return NextResponse.json({ status: row.status });
}
