import { getDb } from './db';

export interface DeliveryZone { name: string; fee: number }

export interface Settings {
  restaurant_name: string;
  logo: string;
  cover_image: string;
  description: string;
  description_ar: string;
  phone: string;
  whatsapp_number: string;
  address: string;
  opening_hours: string;
  currency: string;
  currency_symbol: string;
  language_default: string;
  languages_enabled: string[];
  social_instagram: string;
  social_facebook: string;
  social_tiktok: string;
  delivery_enabled: boolean;
  pickup_enabled: boolean;
  delivery_zones: DeliveryZone[];
  default_delivery_fee: number;
  payment_methods: string[];
  loyalty_enabled: boolean;
  loyalty_points_per_dollar: number;
  loyalty_point_value: number;
  tagline: string;
}

// Keys the public customer site is allowed to read.
const PUBLIC_KEYS = new Set([
  'restaurant_name', 'logo', 'cover_image', 'description', 'description_ar',
  'phone', 'whatsapp_number', 'address', 'opening_hours', 'currency',
  'currency_symbol', 'language_default', 'languages_enabled',
  'social_instagram', 'social_facebook', 'social_tiktok',
  'delivery_enabled', 'pickup_enabled', 'delivery_zones', 'default_delivery_fee',
  'payment_methods', 'loyalty_enabled', 'tagline',
]);

export function getAllSettings(): Settings {
  const rows = getDb().prepare('SELECT key, value FROM settings').all() as { key: string; value: string }[];
  const out: Record<string, unknown> = {};
  for (const r of rows) {
    try { out[r.key] = JSON.parse(r.value); } catch { /* skip bad row */ }
  }
  return out as unknown as Settings;
}

export function getPublicSettings(): Partial<Settings> {
  const all = getAllSettings();
  const out: Record<string, unknown> = {};
  for (const k of PUBLIC_KEYS) out[k] = (all as unknown as Record<string, unknown>)[k];
  return out as Partial<Settings>;
}

export function updateSettings(patch: Record<string, unknown>): void {
  const stmt = getDb().prepare(
    'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value'
  );
  for (const [k, v] of Object.entries(patch)) {
    stmt.run(k, JSON.stringify(v));
  }
}
