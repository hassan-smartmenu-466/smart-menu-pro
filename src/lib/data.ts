// Shared query helpers for pages (server components).
import { getDb } from './db';

export interface CategoryRow {
  id: number; slug: string; name_en: string; name_ar: string; name_fr: string;
  image: string; sort_order: number; active: number;
}

export interface ProductRow {
  id: number; category_id: number; name: string; name_ar: string; name_fr: string;
  description: string; description_ar: string; description_fr: string;
  price_cents: number; image: string; available: number; sold_out: number;
  featured: number; best_seller: number; is_new: number; sort_order: number;
  cost_ingredients_cents: number; cost_preparation_cents: number;
  cost_packaging_cents: number; cost_other_cents: number;
}

export function listCategories(activeOnly = true): CategoryRow[] {
  return getDb().prepare(
    `SELECT * FROM categories ${activeOnly ? 'WHERE active = 1' : ''} ORDER BY sort_order, id`
  ).all() as unknown as CategoryRow[];
}

export function listProducts(activeOnly = true): ProductRow[] {
  return getDb().prepare(
    `SELECT p.* FROM products p JOIN categories c ON c.id = p.category_id
     ${activeOnly ? 'WHERE p.available = 1 AND c.active = 1' : ''}
     ORDER BY p.sort_order, p.id`
  ).all() as unknown as ProductRow[];
}

export function getProduct(id: number): ProductRow | undefined {
  return getDb().prepare('SELECT * FROM products WHERE id = ?').get(id) as ProductRow | undefined;
}

export function productExtras(productId: number) {
  return getDb().prepare(
    `SELECT e.id, e.name, e.name_ar, e.price_cents FROM extras e
     JOIN product_extras pe ON pe.extra_id = e.id
     WHERE pe.product_id = ? AND e.available = 1 ORDER BY e.price_cents`
  ).all(productId) as { id: number; name: string; name_ar: string; price_cents: number }[];
}

export function activePromotions() {
  const now = new Date().toISOString();
  return getDb().prepare(
    `SELECT * FROM promotions WHERE active = 1
       AND (starts_at = '' OR starts_at <= ?)
       AND (ends_at = '' OR ends_at >= ?)
     ORDER BY id DESC`
  ).all(now, now) as Record<string, unknown>[];
}

export function homepageReviews() {
  return getDb().prepare(
    `SELECT * FROM reviews WHERE status = 'approved' AND show_on_homepage = 1 ORDER BY id DESC LIMIT 6`
  ).all() as Record<string, unknown>[];
}

export function placeholderFor(categorySlug: string): string {
  return `/images/placeholders/${categorySlug}.svg`;
}
