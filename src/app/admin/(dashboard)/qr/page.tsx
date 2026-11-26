import type { Metadata } from 'next';
import QrView from '@/components/admin/QrView';

export const metadata: Metadata = { title: 'QR codes', robots: { index: false } };
export const dynamic = 'force-dynamic';

export default function AdminQr() {
  return (
    <div>
      <h1 className="font-display text-2xl font-bold">QR codes</h1>
      <p className="mt-1 text-sm text-ink-400">
        Print the menu QR for tables, windows and flyers. Table QR codes open the menu with the table number attached to the order.
      </p>
      <QrView />
    </div>
  );
}
