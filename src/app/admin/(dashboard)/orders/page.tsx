import type { Metadata } from 'next';
import OrdersManager from '@/components/admin/OrdersManager';

export const metadata: Metadata = { title: 'Orders', robots: { index: false } };
export const dynamic = 'force-dynamic';

export default function AdminOrders() {
  return (
    <div>
      <h1 className="font-display text-2xl font-bold">Orders</h1>
      <p className="mt-1 text-sm text-ink-400">Incoming orders refresh automatically every 10 seconds.</p>
      <OrdersManager />
    </div>
  );
}
