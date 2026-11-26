import { getDb } from './db';

export interface Suggestion {
  id: number;
  name: string;
  priceCents: number;
  image: string;
  reason: 'owner' | 'frequently_together' | 'fallback';
}

// Smart suggestions for a set of product ids (e.g. cart contents).
// Priority: owner-configured recommendations, then frequently-bought-together
// mined from real order history, never auto-added to the cart.
export function suggestionsFor(productIds: number[], excludeIds: number[] = [], limit = 6): Suggestion[] {
  const db = getDb();
  const out: Suggestion[] = [];
  const seen = new Set<number>([...productIds, ...excludeIds]);

  if (productIds.length > 0) {
    const placeholders = productIds.map(() => '?').join(',');
    const ownerRows = db.prepare(
      `SELECT DISTINCT p.id, p.name, p.price_cents, p.image
       FROM recommendations r
       JOIN products p ON p.id = r.recommended_product_id
       WHERE r.product_id IN (${placeholders}) AND p.available = 1 AND p.sold_out = 0`
    ).all(...productIds) as { id: number; name: string; price_cents: number; image: string }[];
    for (const r of ownerRows) {
      if (!seen.has(r.id)) {
        seen.add(r.id);
        out.push({ id: r.id, name: r.name, priceCents: r.price_cents, image: r.image, reason: 'owner' });
      }
    }
  }

  if (out.length < limit && productIds.length > 0) {
    const placeholders = productIds.map(() => '?').join(',');
    const fbt = db.prepare(
      `SELECT p.id, p.name, p.price_cents, p.image, COUNT(*) AS freq
       FROM order_items oi
       JOIN orders o ON o.id = oi.order_id
       JOIN products p ON p.id = oi.product_id
       WHERE o.status NOT IN ('rejected','cancelled')
         AND p.available = 1 AND p.sold_out = 0
         AND oi.order_id IN (
           SELECT DISTINCT order_id FROM order_items WHERE product_id IN (${placeholders})
         )
         AND oi.product_id NOT IN (${placeholders})
       GROUP BY p.id ORDER BY freq DESC LIMIT ?`
    ).all(...productIds, ...productIds, limit) as { id: number; name: string; price_cents: number; image: string; freq: number }[];
    for (const r of fbt) {
      if (!seen.has(r.id) && out.length < limit) {
        seen.add(r.id);
        out.push({ id: r.id, name: r.name, priceCents: r.price_cents, image: r.image, reason: 'frequently_together' });
      }
    }
  }
  return out.slice(0, limit);
}
