import { redirect } from 'next/navigation';
import Link from 'next/link';
import { isAuthenticated } from '@/lib/auth';
import LogoutButton from '@/components/admin/LogoutButton';

const NAV = [
  { href: '/admin', label: 'Overview', icon: '📊' },
  { href: '/admin/orders', label: 'Orders', icon: '🧾' },
  { href: '/admin/menu', label: 'Menu', icon: '🍔' },
  { href: '/admin/analytics', label: 'Sales analytics', icon: '📈' },
  { href: '/admin/profit', label: 'Profit', icon: '💰' },
  { href: '/admin/promotions', label: 'Promotions', icon: '🏷️' },
  { href: '/admin/reviews', label: 'Reviews', icon: '⭐' },
  { href: '/admin/customers', label: 'Customers', icon: '👥' },
  { href: '/admin/advisor', label: 'AI Advisor', icon: '🤖' },
  { href: '/admin/qr', label: 'QR codes', icon: '🔳' },
  { href: '/admin/settings', label: 'Settings', icon: '⚙️' },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  if (!(await isAuthenticated())) redirect('/admin/login');
  return (
    <div className="min-h-screen bg-ink-950 lg:grid lg:grid-cols-[240px_1fr]">
      <aside className="border-b border-ink-700/60 bg-ink-900 lg:min-h-screen lg:border-b-0 lg:border-e">
        <div className="flex items-center gap-2 px-5 py-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/placeholders/logo.svg" alt="" className="h-8 w-8" />
          <span className="font-display font-bold">SMART MENU PRO</span>
        </div>
        <nav className="rail flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-col lg:overflow-visible">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="flex items-center gap-2.5 whitespace-nowrap rounded-xl px-3.5 py-2.5 text-sm text-ink-300 transition hover:bg-ink-800 hover:text-gold-300">
              <span>{n.icon}</span>{n.label}
            </Link>
          ))}
          <LogoutButton />
        </nav>
      </aside>
      <main className="min-w-0 p-4 sm:p-6 lg:p-8">{children}</main>
    </div>
  );
}
