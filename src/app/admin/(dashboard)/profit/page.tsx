import type { Metadata } from 'next';
import { profitByProduct } from '@/lib/analytics';
import { formatMoney } from '@/lib/format';

export const metadata: Metadata = { title: 'Profit analytics', robots: { index: false } };
export const dynamic = 'force-dynamic';

export default function AdminProfit() {
  const rows = profitByProduct(200);
  const withCost = rows.filter((r) => r.cost_cents > 0);
  const totalRevenue = rows.reduce((s, r) => s + r.revenue_cents, 0);
  const totalEstProfit = withCost.reduce((s, r) => s + Math.max(0, r.revenue_cents - r.cost_cents * r.qty), 0);

  return (
    <div>
      <h1 className="font-display text-2xl font-bold">Profit analytics</h1>
      <p className="mt-1 text-sm text-ink-400">
        Estimates only: profit = revenue minus the costs you enter per product. Revenue is not profit.
        Enter costs in Menu management → Edit product.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-3">
        <div className="card p-5">
          <p className="text-xs uppercase tracking-wide text-ink-400">Total revenue</p>
          <p className="font-display mt-2 text-xl font-bold">{formatMoney(totalRevenue)}</p>
        </div>
        <div className="card p-5">
          <p className="text-xs uppercase tracking-wide text-ink-400">Estimated gross profit</p>
          <p className="font-display mt-2 text-xl font-bold text-gold-300">{formatMoney(totalEstProfit)}</p>
          <p className="mt-1 text-[11px] text-ink-500">Only for the {withCost.length} products with cost data</p>
        </div>
        <div className="card p-5">
          <p className="text-xs uppercase tracking-wide text-ink-400">Products with costs entered</p>
          <p className="font-display mt-2 text-xl font-bold">{withCost.length} / {rows.length}</p>
        </div>
      </div>

      <div className="card mt-6 overflow-x-auto p-5">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-ink-700 text-xs text-ink-400">
              <th className="py-2 text-start font-medium">Product</th>
              <th className="py-2 text-end font-medium">Price</th>
              <th className="py-2 text-end font-medium">Cost</th>
              <th className="py-2 text-end font-medium">Margin</th>
              <th className="py-2 text-end font-medium">Sold</th>
              <th className="py-2 text-end font-medium">Revenue</th>
              <th className="py-2 text-end font-medium">Est. profit</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const margin = r.cost_cents > 0 ? ((r.price_cents - r.cost_cents) / r.price_cents) * 100 : null;
              const est = r.cost_cents > 0 ? r.revenue_cents - r.cost_cents * r.qty : null;
              return (
                <tr key={r.id} className="border-b border-ink-800 last:border-0">
                  <td className="py-2">{r.name}</td>
                  <td className="py-2 text-end">{formatMoney(r.price_cents)}</td>
                  <td className="py-2 text-end">{r.cost_cents > 0 ? formatMoney(r.cost_cents) : <span className="text-ink-600">not set</span>}</td>
                  <td className="py-2 text-end">{margin !== null ? `${margin.toFixed(0)}%` : '—'}</td>
                  <td className="py-2 text-end">{r.qty}</td>
                  <td className="py-2 text-end">{formatMoney(r.revenue_cents)}</td>
                  <td className={`py-2 text-end font-semibold ${est !== null && est > 0 ? 'text-gold-300' : 'text-ink-500'}`}>
                    {est !== null ? formatMoney(est) : '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
