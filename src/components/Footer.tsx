import Link from 'next/link';
import type { Lang } from '@/lib/i18n';

export default function Footer({
  lang, dict, settings,
}: {
  lang: Lang;
  dict: Record<string, string>;
  settings: {
    restaurant_name: string; phone: string; address: string; opening_hours: string;
    social_instagram: string; social_facebook: string; social_tiktok: string;
  };
}) {
  const socials = [
    { url: settings.social_instagram, label: 'Instagram' },
    { url: settings.social_facebook, label: 'Facebook' },
    { url: settings.social_tiktok, label: 'TikTok' },
  ].filter((s) => s.url);
  return (
    <footer className="mt-16 border-t border-ink-700/60 bg-ink-900">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-3">
        <div>
          <p className="font-display text-lg font-bold">{settings.restaurant_name || 'SMART MENU PRO'}</p>
          {settings.address && <p className="mt-2 text-sm text-ink-300">{settings.address}</p>}
          {settings.phone && (
            <p className="mt-1 text-sm">
              <a href={`tel:${settings.phone}`} className="text-gold-400 hover:underline" dir="ltr">{settings.phone}</a>
            </p>
          )}
        </div>
        <div>
          <p className="text-sm font-semibold text-ink-200">{dict.opening_hours}</p>
          <p className="mt-2 text-sm text-ink-300">{settings.opening_hours || dict.hours_tbc}</p>
        </div>
        <div>
          {socials.length > 0 && (
            <div className="flex gap-4">
              {socials.map((s) => (
                <a key={s.label} href={s.url} target="_blank" rel="noreferrer" className="text-sm text-ink-300 transition hover:text-gold-400">
                  {s.label}
                </a>
              ))}
            </div>
          )}
          <p className="mt-4 text-xs text-ink-500">
            <Link href="/admin/login" className="hover:text-ink-300">{dict.powered_by}</Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
