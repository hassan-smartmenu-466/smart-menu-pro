import type { Metadata } from 'next';
import PromotionsManager from '@/components/admin/PromotionsManager';
import { listProducts } from '@/lib/data';

export const metadata: Metadata = { title: 'Promotions', robots: { index: false } };
export const dynamic = 'force-dynamic';

export default function AdminPromotions() {
  return (
    <div>
      <h1 className="font-display text-2xl font-bold">Promotions & combos</h1>
      <p className="mt-1 text-sm text-ink-400">Discounts, promo codes, product offers, time-limited deals and combo meals.</p>
      <PromotionsManager products={listProducts(false).map((p) => ({ id: p.id, name: p.name }))} />
    </div>
  );
}
