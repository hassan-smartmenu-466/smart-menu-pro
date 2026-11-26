'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useCart } from './CartProvider';
import { LANG_LABELS, type Lang } from '@/lib/i18n';

export default function Header({
  lang, dict, settings, cartHref, menuHref, reviewsHref,
}: {
  lang: Lang;
  dict: Record<string, string>;
  settings: { restaurant_name: string; logo: string; languages_enabled: string[] };
  cartHref: string;
  menuHref: string;
  reviewsHref: string;
}) {
  const { count, bumpToken } = useCart();
  const [langOpen, setLangOpen] = useState(false);
  const enabled = (settings.languages_enabled || ['en', 'ar']).filter((l) => l in LANG_LABELS);

  return (
    <header className="sticky top-0 z-40 border-b border-ink-700/60 bg-ink-950/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
        <Link href={`/${lang}`} className="flex items-center gap-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={settings.logo || '/images/placeholders/logo.svg'} alt="" className="h-9 w-9 rounded-full" />
          <span className="font-display text-lg font-bold tracking-tight">
            {settings.restaurant_name || 'SMART MENU PRO'}
          </span>
        </Link>
        <nav className="flex items-center gap-1.5 sm:gap-3">
          <Link href={menuHref} className="hidden rounded-full px-3 py-1.5 text-sm text-ink-300 transition hover:text-gold-400 sm:block">
            {dict.menu}
          </Link>
          <Link href={reviewsHref} className="hidden rounded-full px-3 py-1.5 text-sm text-ink-300 transition hover:text-gold-400 sm:block">
            {dict.reviews}
          </Link>
          {enabled.length > 1 && (
            <div className="relative">
              <button
                onClick={() => setLangOpen((v) => !v)}
                className="rounded-full border border-ink-600 px-3 py-1.5 text-sm text-ink-200 transition hover:border-gold-500"
                aria-label={dict.language}
              >
                {LANG_LABELS[lang]}
              </button>
              {langOpen && (
                <div className="absolute end-0 top-full z-50 mt-2 overflow-hidden rounded-xl border border-ink-600 bg-ink-850 shadow-card animate-fadeIn">
                  {enabled.map((l) => (
                    <Link
                      key={l}
                      href={`/${l}`}
                      onClick={() => setLangOpen(false)}
                      className={`block px-4 py-2 text-sm transition hover:bg-ink-700 ${l === lang ? 'text-gold-400' : 'text-ink-200'}`}
                    >
                      {LANG_LABELS[l as Lang]}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
          <Link
            href={cartHref}
            className="relative rounded-full bg-gold-500 px-4 py-1.5 text-sm font-semibold text-ink-950 transition hover:bg-gold-400"
          >
            {dict.cart}
            {count > 0 && (
              <span key={bumpToken} className="absolute -end-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-ember-500 px-1 text-[11px] font-bold text-white animate-bump">
                {count}
              </span>
            )}
          </Link>
        </nav>
      </div>
    </header>
  );
}
