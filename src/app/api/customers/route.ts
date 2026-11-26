import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { requireAdmin } from '@/lib/api-guard';

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  const customers = getDb().prepare(
    'SELECT * FROM customers ORDER BY total_spent_cents DESC LIMIT 200'
  ).all();
  return NextResponse.json({ customers });
}
