import type { Metadata } from 'next';
import { dailySeries, monthlySeries, popularHours, bestSellingProducts, averageOrderValue } from '@/lib/analytics';
import { formatMoney } from '@/lib/format';
import BarChart from '@/components/admin/BarChart';

export const metadata: Metadata = { title: 'Sales analytics', robots: { index: false } };
export const dynamic = 'force-dynamic';

export default function AdminAnalytics() {
  const daily = dailySeries(30);
  const monthly = monthlySeries(12);
  const hours = popularHours();
  const best = bestSellingProducts(10);
  const worst = bestSellingProducts(10, true);
  const week = dailySeries(7);
  const weekTotal = week.reduce((s, d) => s + d.revenueCents, 0);
  const monthTotal = daily.reduce((s, d) => s + d.revenueCents, 0);
  const yearTotal = monthly.reduce((s, d) => s + d.revenueCents, 0);
  const hourData = Array.from({ length: 24 }, (_, h) => ({
    label: `${h}`, value: hours.find((x) => x.hour === h)?.n || 0,
  }));

  return (
    <div>
      <h1 className="font-display text-2xl font-bold">Sales analytics</h1>
      <p className="mt-1 text-sm text-ink-400">All figures come from real orders. Revenue, not profit.</p>

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <SummaryCard label="Last 7 days" value={formatMoney(weekTotal)} />
        <SummaryCard label="Last 30 days" value={formatMoney(monthTotal)} />
        <SummaryCard label="Last 12 months" value={formatMoney(yearTotal)} />
        <SummaryCard label="Avg. order value" value={formatMoney(averageOrderValue())} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="card p-5">
          <h2 className="mb-4 font-semibold text-gold-300">Daily revenue, last 30 days</h2>
          <BarChart data={daily.map((d) => ({ label: d.label, value: d.revenueCents / 100 }))} />
        </div>
        <div className="card p-5">
          <h2 className="mb-4 font-semibold text-gold-300">Monthly revenue, last 12 months</h2>
          <BarChart data={monthly.map((d) => ({ label: d.label, value: d.revenueCents / 100 }))} />
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="card p-5">
          <h2 className="mb-4 font-semibold text-gold-300">Orders by hour</h2>
          <BarChart data={hourData} height={140} />
        </div>
        <div className="card p-5">
          <h2 className="mb-4 font-semibold text-gold-300">Best sellers</h2>
          <ProductRanking rows={best} empty="No sales yet." />
        </div>
        <div className="card p-5">
          <h2 className="mb-4 font-semibold text-gold-300">Lowest sellers</h2>
          <ProductRanking rows={worst} empty="No sales yet." />
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="card p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-ink-400">{label}</p>
      <p className="font-display mt-2 text-xl font-bold text-gold-300">{value}</p>
    </div>
  );
}

function ProductRanking({ rows, empty }: { rows: { id: number; name: string; qty: number; revenue_cents: number }[]; empty: string }) {
  if (rows.every((r) => r.qty === 0)) return <p className="text-sm text-ink-400">{empty}</p>;
  return (
    <ol className="space-y-2 text-sm">
      {rows.map((r) => (
        <li key={r.id} className="flex justify-between gap-2">
          <span className="truncate">{r.name}</span>
          <span className="whitespace-nowrap text-ink-400">{r.qty} · {formatMoney(r.revenue_cents)}</span>
        </li>
      ))}
    </ol>
  );
}
