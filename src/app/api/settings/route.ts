import { NextRequest, NextResponse } from 'next/server';
import { getAllSettings, getPublicSettings, updateSettings } from '@/lib/settings';
import { requireAdmin } from '@/lib/api-guard';

export async function GET(req: NextRequest) {
  const authed = await requireAdmin();
  // Public callers get the safe subset only.
  if (authed) return NextResponse.json({ settings: getPublicSettings() });
  return NextResponse.json({ settings: getAllSettings() });
}

const ALLOWED = new Set([
  'restaurant_name', 'logo', 'cover_image', 'description', 'description_ar', 'phone',
  'whatsapp_number', 'address', 'opening_hours', 'currency', 'currency_symbol',
  'language_default', 'languages_enabled', 'social_instagram', 'social_facebook',
  'social_tiktok', 'delivery_enabled', 'pickup_enabled', 'delivery_zones',
  'default_delivery_fee', 'payment_methods', 'loyalty_enabled',
  'loyalty_points_per_dollar', 'loyalty_point_value', 'tagline',
]);

export async function PATCH(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const body = await req.json().catch(() => ({}));
  const patch: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(body)) {
    if (!ALLOWED.has(k)) continue;
    if (k === 'delivery_zones') {
      const zones = (Array.isArray(v) ? v : []).slice(0, 30).map((z: unknown) => {
        const zr = z as { name?: unknown; fee?: unknown };
        return { name: String(zr.name || '').slice(0, 60), fee: Math.max(0, Number(zr.fee) || 0) };
      }).filter((z) => z.name);
      patch[k] = zones;
    } else if (k === 'languages_enabled' || k === 'payment_methods') {
      patch[k] = (Array.isArray(v) ? v : []).map(String).slice(0, 10);
    } else if (typeof v === 'boolean') {
      patch[k] = v;
    } else if (['default_delivery_fee', 'loyalty_points_per_dollar', 'loyalty_point_value'].includes(k)) {
      patch[k] = Math.max(0, Number(v) || 0);
    } else {
      patch[k] = String(v).slice(0, 500);
    }
  }
  updateSettings(patch);
  return NextResponse.json({ ok: true });
}
