import type { Metadata } from 'next';
import { getDb } from '@/lib/db';
import { formatMoney } from '@/lib/format';

export const metadata: Metadata = { title: 'Customers', robots: { index: false } };
export const dynamic = 'force-dynamic';

export default function AdminCustomers() {
  const customers = getDb().prepare(
    'SELECT * FROM customers ORDER BY total_spent_cents DESC LIMIT 200'
  ).all() as { phone: string; name: string; loyalty_points: number; orders_count: number; total_spent_cents: number; last_seen: string }[];

  return (
    <div>
      <h1 className="font-display text-2xl font-bold">Customers & loyalty</h1>
      <p className="mt-1 text-sm text-ink-400">
        Identified by phone number at checkout. No account needed to order. Loyalty points are credited when an order is completed.
      </p>
      {customers.length === 0 ? (
        <p className="card mt-6 p-8 text-center text-ink-400">No customers yet. They appear here after their first order.</p>
      ) : (
        <div className="card mt-6 overflow-x-auto p-5">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b border-ink-700 text-xs text-ink-400">
                <th className="py-2 text-start font-medium">Customer</th>
                <th className="py-2 text-start font-medium">Phone</th>
                <th className="py-2 text-end font-medium">Orders</th>
                <th className="py-2 text-end font-medium">Total spent</th>
                <th className="py-2 text-end font-medium">Loyalty points</th>
                <th className="py-2 text-end font-medium">Last order</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.phone} className="border-b border-ink-800 last:border-0">
                  <td className="py-2 font-medium">{c.name || '—'}{c.orders_count > 1 && <span className="chip ms-2 bg-gold-500/15 text-gold-300 border border-gold-600/50">repeat</span>}</td>
                  <td className="py-2" dir="ltr">{c.phone}</td>
                  <td className="py-2 text-end">{c.orders_count}</td>
                  <td className="py-2 text-end">{formatMoney(c.total_spent_cents)}</td>
                  <td className="py-2 text-end text-gold-300">{c.loyalty_points}</td>
                  <td className="py-2 text-end text-xs text-ink-400">{new Date(c.last_seen + 'Z').toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
