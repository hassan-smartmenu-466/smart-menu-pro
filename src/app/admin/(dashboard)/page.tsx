import type { Metadata } from 'next';
import Link from 'next/link';
import { getDb } from '@/lib/db';
import {
  averageOrderValue, bestSellingProducts, dailySeries,
  repeatCustomers, revenueBetween, todayRange, totalCustomers,
} from '@/lib/analytics';
import { formatMoney } from '@/lib/format';
import StatCard from '@/components/admin/StatCard';
import BarChart from '@/components/admin/BarChart';
import StatusChip from '@/components/admin/StatusChip';

export const metadata: Metadata = { title: 'Dashboard', robots: { index: false } };
export const dynamic = 'force-dynamic';

export default function AdminOverview() {
  const { from, to } = todayRange();
  const today = revenueBetween(from, to);
  const week = dailySeries(7);
  const best = bestSellingProducts(5).filter((p) => p.qty > 0);
  const recent = getDb().prepare(
    'SELECT id, order_number, customer_name, total_cents, status, created_at FROM orders ORDER BY id DESC LIMIT 8'
  ).all() as { id: number; order_number: string; customer_name: string; total_cents: number; status: string; created_at: string }[];
  const newCount = getDb().prepare("SELECT COUNT(*) AS n FROM orders WHERE status = 'new'").get() as { n: number };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-bold">Overview</h1>
        {newCount.n > 0 && (
          <Link href="/admin/orders?status=new" className="chip bg-ember-500/15 text-ember-400 border border-ember-600 animate-pulseSoft">
            {newCount.n} new order{newCount.n > 1 ? 's' : ''} waiting
          </Link>
        )}
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Today's revenue" value={formatMoney(today.revenueCents)} />
        <StatCard label="Today's orders" value={String(today.orders)} />
        <StatCard label="Avg. order value" value={formatMoney(averageOrderValue())} />
        <StatCard label="Customers" value={String(totalCustomers())} hint={`${repeatCustomers()} repeat`} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="card p-5">
          <h2 className="mb-4 font-semibold text-gold-300">Sales trend, last 7 days</h2>
          <BarChart data={week.map((d) => ({ label: d.label, value: d.revenueCents / 100 }))} />
        </div>
        <div className="card p-5">
          <h2 className="mb-4 font-semibold text-gold-300">Best sellers</h2>
          {best.length === 0 ? (
            <p className="text-sm text-ink-400">No sales yet. Best sellers appear here once orders come in.</p>
          ) : (
            <ol className="space-y-2.5">
              {best.map((p, i) => (
                <li key={p.id} className="flex items-center justify-between text-sm">
                  <span><span className="me-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-ink-700 text-xs font-bold text-gold-300">{i + 1}</span>{p.name}</span>
                  <span className="text-ink-400">{p.qty} sold · {formatMoney(p.revenue_cents)}</span>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>

      <div className="card mt-6 p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold text-gold-300">Recent orders</h2>
          <Link href="/admin/orders" className="text-sm text-gold-400 hover:underline">All orders</Link>
        </div>
        {recent.length === 0 ? (
          <p className="text-sm text-ink-400">No orders yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-ink-700 text-start text-xs text-ink-400">
                  <th className="py-2 text-start font-medium">Order</th>
                  <th className="py-2 text-start font-medium">Customer</th>
                  <th className="py-2 text-start font-medium">Total</th>
                  <th className="py-2 text-start font-medium">Status</th>
                  <th className="py-2 text-start font-medium">Time</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((o) => (
                  <tr key={o.id} className="border-b border-ink-800 last:border-0">
                    <td className="py-2.5 font-mono text-xs" dir="ltr">{o.order_number}</td>
                    <td className="py-2.5">{o.customer_name}</td>
                    <td className="py-2.5 font-semibold text-gold-400">{formatMoney(o.total_cents)}</td>
                    <td className="py-2.5"><StatusChip status={o.status} /></td>
                    <td className="py-2.5 text-ink-400 text-xs">{new Date(o.created_at + 'Z').toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

