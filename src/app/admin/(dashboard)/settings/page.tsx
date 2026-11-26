import type { Metadata } from 'next';
import SettingsForm from '@/components/admin/SettingsForm';
import { getAllSettings } from '@/lib/settings';

export const metadata: Metadata = { title: 'Settings', robots: { index: false } };
export const dynamic = 'force-dynamic';

export default function AdminSettings() {
  const s = getAllSettings();
  return (
    <div>
      <h1 className="font-display text-2xl font-bold">Restaurant settings</h1>
      <p className="mt-1 text-sm text-ink-400">Your identity, contact details, delivery, payments, currency and loyalty. Saved changes go live immediately.</p>
      <SettingsForm initial={s} />
    </div>
  );
}
