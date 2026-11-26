import { getDb } from './db';

export interface SalesPoint { label: string; revenueCents: number; orders: number }

const VALID_ORDER = "status NOT IN ('rejected','cancelled')";

export function revenueBetween(fromIso: string, toIso: string): { revenueCents: number; orders: number } {
  const row = getDb().prepare(
    `SELECT COALESCE(SUM(total_cents),0) AS rev, COUNT(*) AS n FROM orders
     WHERE ${VALID_ORDER} AND created_at >= ? AND created_at < ?`
  ).get(fromIso, toIso) as { rev: number; n: number };
  return { revenueCents: row.rev, orders: row.n };
}

export function todayRange(): { from: string; to: string } {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const to = new Date(from.getTime() + 24 * 3600 * 1000);
  return { from: from.toISOString(), to: to.toISOString() };
}

export function dailySeries(days: number): SalesPoint[] {
  const db = getDb();
  const out: SalesPoint[] = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    const next = new Date(d.getTime() + 24 * 3600 * 1000);
    const row = db.prepare(
      `SELECT COALESCE(SUM(total_cents),0) AS rev, COUNT(*) AS n FROM orders
       WHERE ${VALID_ORDER} AND created_at >= ? AND created_at < ?`
    ).get(d.toISOString(), next.toISOString()) as { rev: number; n: number };
    out.push({
      label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      revenueCents: row.rev,
      orders: row.n,
    });
  }
  return out;
}

export function monthlySeries(months: number): SalesPoint[] {
  const db = getDb();
  const out: SalesPoint[] = [];
  const now = new Date();
  for (let i = months - 1; i >= 0; i--) {
    const from = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const to = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    const row = db.prepare(
      `SELECT COALESCE(SUM(total_cents),0) AS rev, COUNT(*) AS n FROM orders
       WHERE ${VALID_ORDER} AND created_at >= ? AND created_at < ?`
    ).get(from.toISOString(), to.toISOString()) as { rev: number; n: number };
    out.push({
      label: from.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
      revenueCents: row.rev,
      orders: row.n,
    });
  }
  return out;
}

export function bestSellingProducts(limit = 10, ascending = false) {
  return getDb().prepare(
    `SELECT p.id, p.name, COALESCE(SUM(oi.quantity),0) AS qty, COALESCE(SUM(oi.line_total_cents),0) AS revenue_cents
     FROM products p
     LEFT JOIN order_items oi ON oi.product_id = p.id
     LEFT JOIN orders o ON o.id = oi.order_id AND o.${VALID_ORDER}
     GROUP BY p.id ORDER BY qty ${ascending ? 'ASC' : 'DESC'}, p.name LIMIT ?`
  ).all(limit) as { id: number; name: string; qty: number; revenue_cents: number }[];
}

export function popularHours() {
  return getDb().prepare(
    `SELECT CAST(strftime('%H', created_at) AS INTEGER) AS hour, COUNT(*) AS n
     FROM orders WHERE ${VALID_ORDER} GROUP BY hour ORDER BY hour`
  ).all() as { hour: number; n: number }[];
}

export function averageOrderValue(): number {
  const row = getDb().prepare(
    `SELECT COALESCE(AVG(total_cents),0) AS aov FROM orders WHERE ${VALID_ORDER}`
  ).get() as { aov: number };
  return Math.round(row.aov);
}

export function totalCustomers(): number {
  const row = getDb().prepare('SELECT COUNT(*) AS n FROM customers').get() as { n: number };
  return row.n;
}

export function repeatCustomers(): number {
  const row = getDb().prepare('SELECT COUNT(*) AS n FROM customers WHERE orders_count > 1').get() as { n: number };
  return row.n;
}

export function profitByProduct(limit = 50) {
  return getDb().prepare(
    `SELECT p.id, p.name, p.price_cents,
       (p.cost_ingredients_cents + p.cost_preparation_cents + p.cost_packaging_cents + p.cost_other_cents) AS cost_cents,
       COALESCE(SUM(oi.quantity),0) AS qty,
       COALESCE(SUM(oi.line_total_cents),0) AS revenue_cents
     FROM products p
     LEFT JOIN order_items oi ON oi.product_id = p.id
     LEFT JOIN orders o ON o.id = oi.order_id AND o.${VALID_ORDER}
     GROUP BY p.id ORDER BY revenue_cents DESC LIMIT ?`
  ).all(limit) as { id: number; name: string; price_cents: number; cost_cents: number; qty: number; revenue_cents: number }[];
}
