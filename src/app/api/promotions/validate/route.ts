import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { promoActiveNow } from '@/lib/orders';

export async function POST(req: NextRequest) {
  const { code, subtotalCents } = await req.json().catch(() => ({ code: '', subtotalCents: 0 }));
  const promo = getDb().prepare(
    "SELECT * FROM promotions WHERE active = 1 AND code != '' AND UPPER(code) = UPPER(?)"
  ).get(String(code || '')) as Record<string, unknown> | undefined;
  if (!promo || !promoActiveNow(promo)) return NextResponse.json({ valid: false });
  const limit = Number(promo.usage_limit || 0);
  if (limit > 0 && Number(promo.used_count || 0) >= limit) return NextResponse.json({ valid: false });
  const sub = Math.max(0, Number(subtotalCents) || 0);
  let discount = 0;
  if (Number(promo.percent) > 0) discount = Math.round((sub * Number(promo.percent)) / 100);
  else if (Number(promo.amount_cents) > 0) discount = Number(promo.amount_cents);
  discount = Math.min(discount, sub);
  if (discount <= 0) return NextResponse.json({ valid: false });
  return NextResponse.json({ valid: true, discountCents: discount });
}
