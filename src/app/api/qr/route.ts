import { NextRequest, NextResponse } from 'next/server';
import QRCode from 'qrcode';
import { requireAdmin } from '@/lib/api-guard';

// Generates QR codes as PNG. ?target=menu (default) or ?target=table&table=7
export async function GET(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const url = new URL(req.url);
  const base = process.env.NEXT_PUBLIC_BASE_URL || `${url.protocol}//${url.host}`;
  const target = url.searchParams.get('target') || 'menu';
  let dest = `${base}/en`;
  if (target === 'table') {
    const table = (url.searchParams.get('table') || '').replace(/[^0-9A-Za-z-]/g, '').slice(0, 10);
    if (table) dest = `${base}/en?table=${encodeURIComponent(table)}`;
  }
  const png = await QRCode.toBuffer(dest, {
    width: 600, margin: 2,
    color: { dark: '#0a0a0c', light: '#f5c35c' },
  });
  return new NextResponse(new Uint8Array(png), {
    headers: { 'Content-Type': 'image/png', 'Cache-Control': 'no-store' },
  });
}
