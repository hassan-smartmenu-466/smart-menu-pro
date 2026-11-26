// AI Business Advisor.
// Two layers:
// 1. Built-in analysis engine: computes real answers and recommendations from
//    actual order data. Works with zero external services and never invents
//    statistics. If there is not enough data it says so.
// 2. Optional LLM phrasing layer: when OPENAI_API_KEY is set, the computed
//    facts are sent to the model to be rewritten in friendlier language.
//    The model only receives aggregated numbers, never customer PII.
import { getDb } from './db';
import {
  averageOrderValue, bestSellingProducts, dailySeries, popularHours,
  profitByProduct, repeatCustomers, revenueBetween, todayRange, totalCustomers,
} from './analytics';
import { formatMoney } from './format';

export interface AdvisorReport {
  hasData: boolean;
  orderCount: number;
  facts: string[];
  recommendations: string[];
  llmSummary?: string;
}

const VALID_ORDER = "status NOT IN ('rejected','cancelled')";

export function buildAdvisorReport(question?: string): AdvisorReport {
  const db = getDb();
  const countRow = db.prepare(`SELECT COUNT(*) AS n FROM orders WHERE ${VALID_ORDER}`).get() as { n: number };
  const orderCount = countRow.n;
  const facts: string[] = [];
  const recommendations: string[] = [];
  const symbol = '$';

  if (orderCount === 0) {
    return {
      hasData: false,
      orderCount: 0,
      facts: ['No orders have been recorded yet.'],
      recommendations: [
        'There is not enough sales data to analyze yet. Once orders start coming in, this advisor will identify your best sellers, busiest hours, profit leaders and upsell opportunities from the real numbers.',
      ],
    };
  }

  const { from, to } = todayRange();
  const today = revenueBetween(from, to);
  facts.push(`Today so far: ${today.orders} orders, ${formatMoney(today.revenueCents, symbol)} revenue.`);
  facts.push(`All-time: ${orderCount} orders, average order value ${formatMoney(averageOrderValue(), symbol)}.`);
  facts.push(`Customers seen: ${totalCustomers()}, repeat customers: ${repeatCustomers()}.`);

  const best = bestSellingProducts(5).filter((p) => p.qty > 0);
  const worst = bestSellingProducts(73, true).filter((p) => p.qty > 0).slice(0, 5);
  if (best.length > 0) {
    facts.push(`Best sellers by units: ${best.map((p) => `${p.name} (${p.qty})`).join(', ')}.`);
  }

  const hours = popularHours();
  if (hours.length > 0) {
    const peak = [...hours].sort((a, b) => b.n - a.n)[0];
    facts.push(`Busiest hour: ${peak.hour}:00-${peak.hour + 1}:00 with ${peak.n} orders.`);
  }

  const profit = profitByProduct(73).filter((p) => p.qty > 0 && p.cost_cents > 0);
  if (profit.length > 0) {
    const withMargin = profit.map((p) => ({
      ...p,
      margin: ((p.price_cents - p.cost_cents) / p.price_cents) * 100,
      profitTotal: ((p.price_cents - p.cost_cents) * p.qty) / 100,
    }));
    const top = [...withMargin].sort((a, b) => b.profitTotal - a.profitTotal)[0];
    facts.push(`Estimated top profit generator: ${top.name} (est. ${formatMoney(Math.round(top.profitTotal * 100), symbol)} gross profit so far).`);
    recommendations.push(`Promote ${top.name}: it is your strongest estimated profit contributor among products with cost data.`);
  } else {
    recommendations.push('Enter product costs in Profit Analytics to unlock profit-based recommendations. Right now only revenue can be measured.');
  }

  if (best.length > 0) {
    const topSeller = best[0];
    recommendations.push(`Consider a combo built around ${topSeller.name}, your best seller, paired with a fries and a drink to lift average order value.`);
  }

  const series = dailySeries(7);
  const nonzero = series.filter((s) => s.orders > 0);
  if (nonzero.length >= 3) {
    const first = nonzero.slice(0, Math.ceil(nonzero.length / 2)).reduce((s, p) => s + p.revenueCents, 0);
    const second = nonzero.slice(Math.ceil(nonzero.length / 2)).reduce((s, p) => s + p.revenueCents, 0);
    if (second > first * 1.1) facts.push('Sales trend over the last 7 days: rising.');
    else if (second < first * 0.9) facts.push('Sales trend over the last 7 days: falling.');
    else facts.push('Sales trend over the last 7 days: steady.');
  }

  const aov = averageOrderValue();
  const withFriesShare = friesAttachRate();
  if (withFriesShare !== null && withFriesShare < 0.4 && best.length > 0) {
    recommendations.push(
      `Only ${Math.round(withFriesShare * 100)}% of orders include a fries item. Suggesting fries at checkout (the upsell module already does this) could raise your ${formatMoney(aov, symbol)} average order value.`
    );
  }

  if (worst.length > 0 && orderCount >= 10) {
    recommendations.push(
      `Low movers worth reviewing: ${worst.map((p) => p.name).join(', ')}. Consider a limited-time offer or better menu placement for them.`
    );
  }

  const q = (question || '').toLowerCase();
  if (q) {
    if (q.includes('profit')) facts.unshift('You asked about profit: see Profit Analytics for per-product margins. Estimates only, revenue is not profit.');
    if (q.includes('hour') || q.includes('busiest')) facts.unshift('You asked about busiest times: see the hourly chart in Sales Analytics for the full curve.');
  }

  return { hasData: true, orderCount, facts, recommendations };
}

function friesAttachRate(): number | null {
  const db = getDb();
  const row = db.prepare(
    `SELECT
       (SELECT COUNT(*) FROM orders o WHERE o.${VALID_ORDER}) AS total_orders,
       (SELECT COUNT(DISTINCT oi.order_id) FROM order_items oi
         JOIN products p ON p.id = oi.product_id
         JOIN categories c ON c.id = p.category_id
         JOIN orders o2 ON o2.id = oi.order_id
        WHERE c.slug = 'fries' AND o2.${'status NOT IN (\'rejected\',\'cancelled\')'}) AS with_fries`
  ).get() as { total_orders: number; with_fries: number };
  if (row.total_orders === 0) return null;
  return row.with_fries / row.total_orders;
}

// Optional LLM layer. Only aggregated facts are sent, never customer data.
export async function llmSummary(report: AdvisorReport): Promise<string | undefined> {
  const key = process.env.OPENAI_API_KEY;
  if (!key || !report.hasData) return undefined;
  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a restaurant business advisor. Rewrite the provided facts and recommendations into a short, warm, actionable briefing for the owner. Use only the numbers given. Never invent statistics.' },
          { role: 'user', content: [...report.facts, ...report.recommendations].join('\n') },
        ],
        max_tokens: 400,
      }),
    });
    if (!res.ok) return undefined;
    const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    return data.choices?.[0]?.message?.content?.trim() || undefined;
  } catch {
    return undefined;
  }
}
