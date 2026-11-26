// Database layer: SQLite via Node's built-in node:sqlite (zero external services).
// The whole app reads/writes through this module, so swapping in Supabase/Postgres
// later means re-implementing this one file (see docs/DEPLOYMENT.md).
import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';
import { SEED_CATEGORIES, SEED_PRODUCTS, DEFAULT_EXTRA_NAMES } from './menu-data';

const DB_PATH = process.env.DATABASE_PATH || path.join(process.cwd(), 'data', 'smartmenu.db');

const SCHEMA = `
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT UNIQUE NOT NULL,
  name_en TEXT NOT NULL,
  name_ar TEXT NOT NULL DEFAULT '',
  name_fr TEXT NOT NULL DEFAULT '',
  image TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  active INTEGER NOT NULL DEFAULT 1
);
CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  name_ar TEXT NOT NULL DEFAULT '',
  name_fr TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  description_ar TEXT NOT NULL DEFAULT '',
  description_fr TEXT NOT NULL DEFAULT '',
  price_cents INTEGER NOT NULL CHECK (price_cents >= 0),
  image TEXT NOT NULL DEFAULT '',
  available INTEGER NOT NULL DEFAULT 1,
  sold_out INTEGER NOT NULL DEFAULT 0,
  featured INTEGER NOT NULL DEFAULT 0,
  best_seller INTEGER NOT NULL DEFAULT 0,
  is_new INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  cost_ingredients_cents INTEGER NOT NULL DEFAULT 0,
  cost_preparation_cents INTEGER NOT NULL DEFAULT 0,
  cost_packaging_cents INTEGER NOT NULL DEFAULT 0,
  cost_other_cents INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS extras (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  name_ar TEXT NOT NULL DEFAULT '',
  price_cents INTEGER NOT NULL DEFAULT 0,
  available INTEGER NOT NULL DEFAULT 1
);
CREATE TABLE IF NOT EXISTS product_extras (
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  extra_id INTEGER NOT NULL REFERENCES extras(id) ON DELETE CASCADE,
  PRIMARY KEY (product_id, extra_id)
);
CREATE TABLE IF NOT EXISTS recommendations (
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  recommended_product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  PRIMARY KEY (product_id, recommended_product_id)
);
CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_number TEXT UNIQUE NOT NULL,
  customer_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  fulfillment TEXT NOT NULL CHECK (fulfillment IN ('delivery','pickup')),
  address TEXT NOT NULL DEFAULT '',
  address_notes TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  payment_method TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new','accepted','rejected','preparing','ready','out_for_delivery','completed','cancelled')),
  subtotal_cents INTEGER NOT NULL,
  discount_cents INTEGER NOT NULL DEFAULT 0,
  delivery_fee_cents INTEGER NOT NULL DEFAULT 0,
  total_cents INTEGER NOT NULL,
  promo_code TEXT NOT NULL DEFAULT '',
  table_number TEXT NOT NULL DEFAULT '',
  lang TEXT NOT NULL DEFAULT 'en',
  status_history TEXT NOT NULL DEFAULT '[]',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at);
CREATE TABLE IF NOT EXISTS order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  unit_price_cents INTEGER NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  extras TEXT NOT NULL DEFAULT '[]',
  instructions TEXT NOT NULL DEFAULT '',
  line_total_cents INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE TABLE IF NOT EXISTS promotions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL CHECK (type IN ('percent','fixed','promo_code','product_offer','combo')),
  name TEXT NOT NULL,
  code TEXT NOT NULL DEFAULT '',
  percent REAL NOT NULL DEFAULT 0,
  amount_cents INTEGER NOT NULL DEFAULT 0,
  product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
  combo_items TEXT NOT NULL DEFAULT '[]',
  combo_price_cents INTEGER NOT NULL DEFAULT 0,
  starts_at TEXT NOT NULL DEFAULT '',
  ends_at TEXT NOT NULL DEFAULT '',
  active INTEGER NOT NULL DEFAULT 1,
  usage_limit INTEGER NOT NULL DEFAULT 0,
  used_count INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_name TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  text TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  owner_reply TEXT NOT NULL DEFAULT '',
  show_on_homepage INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS customers (
  phone TEXT PRIMARY KEY,
  name TEXT NOT NULL DEFAULT '',
  loyalty_points INTEGER NOT NULL DEFAULT 0,
  orders_count INTEGER NOT NULL DEFAULT 0,
  total_spent_cents INTEGER NOT NULL DEFAULT 0,
  first_seen TEXT NOT NULL DEFAULT (datetime('now')),
  last_seen TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at TEXT NOT NULL
);
`;

const DEFAULT_SETTINGS: Record<string, unknown> = {
  restaurant_name: '',
  logo: '',
  cover_image: '',
  description: '',
  description_ar: '',
  phone: '',
  whatsapp_number: '',
  address: '',
  opening_hours: '',
  currency: 'USD',
  currency_symbol: '$',
  language_default: 'en',
  languages_enabled: ['en', 'ar'],
  social_instagram: '',
  social_facebook: '',
  social_tiktok: '',
  delivery_enabled: true,
  pickup_enabled: true,
  delivery_zones: [] as { name: string; fee: number }[],
  default_delivery_fee: 0,
  payment_methods: ['cash_on_delivery', 'cash_at_pickup'],
  loyalty_enabled: true,
  loyalty_points_per_dollar: 1,
  loyalty_point_value: 0.01,
  tagline: '',
};

function createDb(): DatabaseSync {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
  const db = new DatabaseSync(DB_PATH);
  db.exec('PRAGMA journal_mode = WAL;');
  db.exec('PRAGMA foreign_keys = ON;');
  db.exec(SCHEMA);
  seedIfEmpty(db);
  return db;
}

function seedIfEmpty(db: DatabaseSync) {
  const row = db.prepare('SELECT COUNT(*) AS n FROM categories').get() as { n: number };
  if (row.n > 0) return;
  const insertCat = db.prepare(
    'INSERT INTO categories (slug, name_en, name_ar, name_fr, sort_order) VALUES (?, ?, ?, ?, ?)'
  );
  const catIds: Record<string, number> = {};
  for (const c of SEED_CATEGORIES) {
    const r = insertCat.run(c.slug, c.nameEn, c.nameAr, c.nameFr, c.sortOrder);
    catIds[c.slug] = Number(r.lastInsertRowid);
  }
  const insertProd = db.prepare(
    `INSERT INTO products (category_id, name, price_cents, sort_order)
     VALUES (?, ?, ?, ?)`
  );
  const productIdsByName: Record<string, number[]> = {};
  let sort = 0;
  for (const p of SEED_PRODUCTS) {
    const r = insertProd.run(catIds[p.category], p.name, Math.round(p.price * 100), sort++);
    const key = `${p.category}:${p.name}`;
    productIdsByName[key] = [Number(r.lastInsertRowid)];
  }
  // Seed extras from the "Adds" category items and offer them on burgers and sandwiches.
  const insertExtra = db.prepare('INSERT INTO extras (name, price_cents) VALUES (?, ?)');
  const linkExtra = db.prepare('INSERT OR IGNORE INTO product_extras (product_id, extra_id) VALUES (?, ?)');
  const addsProducts = db.prepare(
    "SELECT p.id, p.name, p.price_cents FROM products p JOIN categories c ON c.id = p.category_id WHERE c.slug = 'adds'"
  ).all() as { id: number; name: string; price_cents: number }[];
  const extraIds: number[] = [];
  for (const a of addsProducts) {
    if (!DEFAULT_EXTRA_NAMES.includes(a.name)) continue;
    const r = insertExtra.run(a.name, a.price_cents);
    extraIds.push(Number(r.lastInsertRowid));
  }
  const targets = db.prepare(
    "SELECT p.id FROM products p JOIN categories c ON c.id = p.category_id WHERE c.slug IN ('burgers','sandwiches')"
  ).all() as { id: number }[];
  for (const t of targets) for (const e of extraIds) linkExtra.run(t.id, e);
  // Default recommendation rules: every burger/sandwich suggests fries + a drink + an appetizer.
  const fries = db.prepare(
    "SELECT p.id FROM products p JOIN categories c ON c.id=p.category_id WHERE c.slug='fries' AND p.name='Large Fries'"
  ).get() as { id: number } | undefined;
  const drink = db.prepare(
    "SELECT p.id FROM products p JOIN categories c ON c.id=p.category_id WHERE c.slug='soft-drinks' AND p.name='Pepsi'"
  ).get() as { id: number } | undefined;
  const appetizer = db.prepare(
    "SELECT p.id FROM products p JOIN categories c ON c.id=p.category_id WHERE c.slug='appetizers' AND p.name='Mozzarella Sticks'"
  ).get() as { id: number } | undefined;
  const insertRec = db.prepare(
    'INSERT OR IGNORE INTO recommendations (product_id, recommended_product_id) VALUES (?, ?)'
  );
  for (const t of targets) {
    if (fries) insertRec.run(t.id, fries.id);
    if (drink) insertRec.run(t.id, drink.id);
    if (appetizer) insertRec.run(t.id, appetizer.id);
  }
  const insertSetting = db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)');
  for (const [k, v] of Object.entries(DEFAULT_SETTINGS)) {
    insertSetting.run(k, JSON.stringify(v));
  }
}

// Singleton with HMR-safe caching.
const globalForDb = globalThis as unknown as { __smpDb?: DatabaseSync };

export function getDb(): DatabaseSync {
  if (!globalForDb.__smpDb) {
    globalForDb.__smpDb = createDb();
  }
  return globalForDb.__smpDb;
}
