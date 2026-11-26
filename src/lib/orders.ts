import crypto from 'node:crypto';
import { getDb } from './db';
import { getAllSettings, type DeliveryZone } from './settings';

export type OrderStatus =
  | 'new' | 'accepted' | 'rejected' | 'preparing' | 'ready'
  | 'out_for_delivery' | 'completed' | 'cancelled';

export const ORDER_STATUSES: OrderStatus[] = [
  'new', 'accepted', 'rejected', 'preparing', 'ready', 'out_for_delivery', 'completed', 'cancelled',
];

export interface CartItemInput {
  productId: number;
  quantity: number;
  extraIds: number[];
  instructions: string;
}

export interface OrderInput {
  customerName: string;
  phone: string;
  fulfillment: 'delivery' | 'pickup';
  address: string;
  addressNotes: string;
  notes: string;
  paymentMethod: string;
  promoCode: string;
  tableNumber: string;
  lang: string;
  items: CartItemInput[];
}

export interface PricingResult {
  ok: boolean;
  error?: string;
  lines?: { productId: number; name: string; unitPriceCents: number; quantity: number; extras: { id: number; name: string; priceCents: number }[]; instructions: string; lineTotalCents: number }[];
  subtotalCents?: number;
  discountCents?: number;
  deliveryFeeCents?: number;
  totalCents?: number;
  promoCode?: string;
}

function generateOrderNumber(): string {
  const stamp = Date.now().toString(36).toUpperCase();
  const rand = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `SMP-${stamp}-${rand}`;
}

export function deliveryFeeFor(address: string, zones: DeliveryZone[], defaultFee: number): number {
  const a = address.toLowerCase();
  for (const z of zones) {
    if (z.name && a.includes(z.name.toLowerCase())) return Math.round(z.fee * 100);
  }
  return Math.round(defaultFee * 100);
}

// Server-side pricing: never trust client-computed prices.
export function priceOrder(input: OrderInput): PricingResult {
  const db = getDb();
  if (!input.items || input.items.length === 0) return { ok: false, error: 'empty_cart' };

  const lines = [];
  let subtotal = 0;
  for (const item of input.items) {
    const qty = Math.floor(Number(item.quantity));
    if (!Number.isFinite(qty) || qty < 1 || qty > 50) return { ok: false, error: 'bad_quantity' };
    const product = db.prepare(
      'SELECT id, name, price_cents, available, sold_out FROM products WHERE id = ?'
    ).get(item.productId) as { id: number; name: string; price_cents: number; available: number; sold_out: number } | undefined;
    if (!product) return { ok: false, error: 'unknown_product' };
    if (!product.available || product.sold_out) return { ok: false, error: `unavailable:${product.name}` };

    const extras: { id: number; name: string; priceCents: number }[] = [];
    if (Array.isArray(item.extraIds)) {
      for (const eid of item.extraIds.slice(0, 20)) {
        const allowed = db.prepare(
          `SELECT e.id, e.name, e.price_cents FROM extras e
           JOIN product_extras pe ON pe.extra_id = e.id
           WHERE pe.product_id = ? AND e.id = ? AND e.available = 1`
        ).get(product.id, eid) as { id: number; name: string; price_cents: number } | undefined;
        if (!allowed) return { ok: false, error: 'bad_extra' };
        extras.push({ id: allowed.id, name: allowed.name, priceCents: allowed.price_cents });
      }
    }
    const extrasSum = extras.reduce((s, e) => s + e.priceCents, 0);
    const lineTotal = (product.price_cents + extrasSum) * qty;
    subtotal += lineTotal;
    lines.push({
      productId: product.id,
      name: product.name,
      unitPriceCents: product.price_cents,
      quantity: qty,
      extras,
      instructions: String(item.instructions || '').slice(0, 500),
      lineTotalCents: lineTotal,
    });
  }

  // Promo validation
  let discount = 0;
  let promoCode = '';
  const code = (input.promoCode || '').trim();
  if (code) {
    const promo = db.prepare(
      "SELECT * FROM promotions WHERE active = 1 AND code != '' AND UPPER(code) = UPPER(?)"
    ).get(code) as Record<string, unknown> | undefined;
    if (promo && promoActiveNow(promo) && withinUsage(promo)) {
      if (promo.type === 'percent' || promo.type === 'promo_code') {
        discount = Math.round((subtotal * Number(promo.percent || 0)) / 100);
        if (promo.type === 'promo_code' && Number(promo.amount_cents) > 0 && Number(promo.percent) === 0) {
          discount = Number(promo.amount_cents);
        }
      } else if (promo.type === 'fixed') {
        discount = Number(promo.amount_cents);
      } else if (promo.type === 'product_offer' && promo.product_id) {
        const line = lines.find((l) => l.productId === Number(promo.product_id));
        if (line) {
          discount = Math.round((line.lineTotalCents * Number(promo.percent || 0)) / 100);
        }
      }
      discount = Math.min(discount, subtotal);
      if (discount > 0) promoCode = String(promo.code);
    }
  }

  const settings = getAllSettings();
  let deliveryFee = 0;
  if (input.fulfillment === 'delivery') {
    deliveryFee = deliveryFeeFor(input.address, settings.delivery_zones || [], settings.default_delivery_fee || 0);
  }

  const total = Math.max(0, subtotal - discount) + deliveryFee;
  return {
    ok: true,
    lines,
    subtotalCents: subtotal,
    discountCents: discount,
    deliveryFeeCents: deliveryFee,
    totalCents: total,
    promoCode,
  };
}

export function promoActiveNow(promo: Record<string, unknown>): boolean {
  const now = new Date().toISOString();
  const starts = String(promo.starts_at || '');
  const ends = String(promo.ends_at || '');
  if (starts && now < starts) return false;
  if (ends && now > ends) return false;
  return true;
}

function withinUsage(promo: Record<string, unknown>): boolean {
  const limit = Number(promo.usage_limit || 0);
  if (limit <= 0) return true;
  return Number(promo.used_count || 0) < limit;
}

export function createOrder(input: OrderInput): { ok: boolean; error?: string; orderNumber?: string; totalCents?: number } {
  const priced = priceOrder(input);
  if (!priced.ok) return { ok: false, error: priced.error };
  const db = getDb();
  const number = generateOrderNumber();
  const history = JSON.stringify([{ status: 'new', at: new Date().toISOString() }]);
  const result = db.prepare(
    `INSERT INTO orders (order_number, customer_name, phone, fulfillment, address, address_notes, notes,
      payment_method, status, subtotal_cents, discount_cents, delivery_fee_cents, total_cents, promo_code,
      table_number, lang, status_history)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'new', ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    number, input.customerName, input.phone, input.fulfillment, input.address, input.addressNotes,
    input.notes, input.paymentMethod, priced.subtotalCents!, priced.discountCents!,
    priced.deliveryFeeCents!, priced.totalCents!, priced.promoCode || '',
    input.tableNumber || '', input.lang || 'en', history
  );
  const orderId = Number(result.lastInsertRowid);
  const insertItem = db.prepare(
    `INSERT INTO order_items (order_id, product_id, name, unit_price_cents, quantity, extras, instructions, line_total_cents)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  );
  for (const line of priced.lines!) {
    insertItem.run(
      orderId, line.productId, line.name, line.unitPriceCents, line.quantity,
      JSON.stringify(line.extras), line.instructions, line.lineTotalCents
    );
  }
  if (priced.promoCode) {
    db.prepare('UPDATE promotions SET used_count = used_count + 1 WHERE UPPER(code) = UPPER(?)').run(priced.promoCode);
  }
  // Customer / loyalty tracking by phone.
  db.prepare(
    `INSERT INTO customers (phone, name, orders_count, total_spent_cents, first_seen, last_seen)
     VALUES (?, ?, 1, ?, datetime('now'), datetime('now'))
     ON CONFLICT(phone) DO UPDATE SET
       name = excluded.name,
       orders_count = orders_count + 1,
       total_spent_cents = total_spent_cents + excluded.total_spent_cents,
       last_seen = datetime('now')`
  ).run(input.phone, input.customerName, priced.totalCents!);
  return { ok: true, orderNumber: number, totalCents: priced.totalCents };
}

export function setOrderStatus(orderId: number, status: OrderStatus): boolean {
  if (!ORDER_STATUSES.includes(status)) return false;
  const db = getDb();
  const row = db.prepare('SELECT status_history, phone, total_cents FROM orders WHERE id = ?').get(orderId) as
    | { status_history: string; phone: string; total_cents: number }
    | undefined;
  if (!row) return false;
  const history = JSON.parse(row.status_history || '[]') as { status: string; at: string }[];
  history.push({ status, at: new Date().toISOString() });
  db.prepare("UPDATE orders SET status = ?, status_history = ?, updated_at = datetime('now') WHERE id = ?").run(
    status, JSON.stringify(history), orderId
  );
  if (status === 'completed') {
    const settings = getAllSettings();
    if (settings.loyalty_enabled) {
      const points = Math.floor((row.total_cents / 100) * (settings.loyalty_points_per_dollar || 0));
      if (points > 0) {
        db.prepare('UPDATE customers SET loyalty_points = loyalty_points + ? WHERE phone = ?').run(points, row.phone);
      }
    }
  }
  return true;
}
