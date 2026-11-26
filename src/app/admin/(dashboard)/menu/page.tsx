import type { Metadata } from 'next';
import MenuManager from '@/components/admin/MenuManager';
import { listCategories, listProducts } from '@/lib/data';
import { getDb } from '@/lib/db';

export const metadata: Metadata = { title: 'Menu management', robots: { index: false } };
export const dynamic = 'force-dynamic';

export default function AdminMenu() {
  // JSON round-trip: node:sqlite rows have null prototypes, which cannot
  // cross the server -> client component boundary.
  const plain = <T,>(v: T): T => JSON.parse(JSON.stringify(v));
  const categories = plain(listCategories(false));
  const products = plain(listProducts(false));
  const extras = plain(getDb().prepare('SELECT * FROM extras ORDER BY price_cents').all());
  const productExtras = plain(getDb().prepare('SELECT * FROM product_extras').all());
  const recommendations = plain(getDb().prepare('SELECT * FROM recommendations').all());
  return (
    <div>
      <h1 className="font-display text-2xl font-bold">Menu management</h1>
      <p className="mt-1 text-sm text-ink-400">Every change goes live on the customer menu immediately.</p>
      <MenuManager
        initialCategories={categories}
        initialProducts={products}
        allExtras={extras as { id: number; name: string; price_cents: number }[]}
        productExtras={productExtras as { product_id: number; extra_id: number }[]}
        recommendations={recommendations as { product_id: number; recommended_product_id: number }[]}
      />
    </div>
  );
}
