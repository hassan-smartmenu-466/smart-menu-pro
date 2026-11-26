'use client';
import Link from 'next/link';
import { useMemo, useRef, useState } from 'react';
import { useCart } from './CartProvider';
import { formatMoney } from '@/lib/format';

export interface BrowserCategory { id: number; slug: string; label: string }
export interface BrowserProduct {
  id: number; categorySlug: string; name: string; description: string;
  priceCents: number; image: string; soldOut: boolean; bestSeller: boolean; isNew: boolean;
}

export default function MenuBrowser({
  lang, dict, categories, products, currencySymbol,
}: {
  lang: string;
  dict: Record<string, string>;
  categories: BrowserCategory[];
  products: BrowserProduct[];
  currencySymbol: string;
}) {
  const [activeCat, setActiveCat] = useState('all');
  const [query, setQuery] = useState('');
  const { add } = useCart();
  const [justAdded, setJustAdded] = useState<number | null>(null);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      if (activeCat !== 'all' && p.categorySlug !== activeCat) return false;
      if (q && !p.name.toLowerCase().includes(q) && !p.description.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [products, activeCat, query]);

  const grouped = useMemo(() => {
    const cats = activeCat === 'all' ? categories : categories.filter((c) => c.slug === activeCat);
    return cats
      .map((c) => ({ cat: c, items: filtered.filter((p) => p.categorySlug === c.slug) }))
      .filter((g) => g.items.length > 0);
  }, [categories, filtered, activeCat]);

  function quickAdd(p: BrowserProduct) {
    add({
      productId: p.id, name: p.name, unitPriceCents: p.priceCents, image: p.image,
      quantity: 1, extras: [], instructions: '',
    });
    setJustAdded(p.id);
    setTimeout(() => setJustAdded((v) => (v === p.id ? null : v)), 1200);
  }

  return (
    <div>
      {/* Search */}
      <div className="relative mb-4">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={dict.search_placeholder}
          className="input ps-11"
          aria-label={dict.search_placeholder}
        />
        <svg className="absolute start-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
        </svg>
        {query && (
          <button onClick={() => setQuery('')} className="absolute end-3 top-1/2 -translate-y-1/2 text-xs text-ink-400 hover:text-gold-400">
            {dict.clear_search}
          </button>
        )}
      </div>

      {/* Sticky category tabs */}
      <div className="sticky top-[60px] z-30 -mx-4 border-b border-ink-700/50 bg-ink-950/90 px-4 py-2 backdrop-blur">
        <div className="rail flex gap-2 overflow-x-auto">
          <TabButton active={activeCat === 'all'} onClick={() => setActiveCat('all')} label={dict.all} />
          {categories.map((c) => (
            <TabButton
              key={c.slug}
              active={activeCat === c.slug}
              onClick={() => {
                setActiveCat(c.slug);
                setQuery('');
                if (activeCat === c.slug) sectionRefs.current[c.slug]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
              label={c.label}
            />
          ))}
        </div>
      </div>

      {/* Groups */}
      {grouped.length === 0 && (
        <div className="py-16 text-center text-ink-400 animate-fadeIn">{dict.nothing_found}</div>
      )}
      {grouped.map(({ cat, items }) => (
        <section
          key={cat.slug}
          ref={(el) => { sectionRefs.current[cat.slug] = el; }}
          className="scroll-mt-32 pt-8"
          aria-label={cat.label}
        >
          <h3 className="font-display mb-4 text-xl font-bold text-gold-400">{cat.label}</h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {items.map((p, i) => (
              <article
                key={p.id}
                className="card group overflow-hidden animate-fadeUp"
                style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}
              >
                <Link href={`/${lang}/product/${p.id}`} className="block">
                  <div className="relative aspect-[4/3] overflow-hidden bg-ink-800">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={p.image}
                      alt={p.name}
                      loading="lazy"
                      className={`h-full w-full object-cover transition duration-500 group-hover:scale-105 ${p.soldOut ? 'opacity-40 grayscale' : ''}`}
                    />
                    {p.bestSeller && !p.soldOut && (
                      <span className="chip absolute start-2 top-2 bg-gold-500 text-ink-950">{dict.popular}</span>
                    )}
                    {p.isNew && !p.soldOut && (
                      <span className="chip absolute start-2 top-2 bg-ember-500 text-white">{dict.new_items}</span>
                    )}
                    {p.soldOut && (
                      <span className="chip absolute inset-x-8 top-1/2 -translate-y-1/2 justify-center bg-ink-950/90 py-2 text-ember-400 border border-ember-600">
                        {dict.sold_out}
                      </span>
                    )}
                  </div>
                </Link>
                <div className="p-3">
                  <Link href={`/${lang}/product/${p.id}`} className="block">
                    <h4 className="truncate font-semibold leading-tight">{p.name}</h4>
                    {p.description && <p className="mt-0.5 line-clamp-1 text-xs text-ink-400">{p.description}</p>}
                  </Link>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="font-display font-bold text-gold-400">{formatMoney(p.priceCents, currencySymbol)}</span>
                    {p.soldOut ? (
                      <span className="text-xs text-ink-500">{dict.unavailable}</span>
                    ) : justAdded === p.id ? (
                      <span className="rounded-full bg-[#3d6b23] px-3 py-1.5 text-xs font-bold text-white animate-bump">{dict.added} ✓</span>
                    ) : (
                      <button
                        onClick={() => quickAdd(p)}
                        className="rounded-full bg-gold-500 px-3.5 py-1.5 text-xs font-bold text-ink-950 transition hover:bg-gold-400 active:scale-95"
                        aria-label={`${dict.add_to_cart}: ${p.name}`}
                      >
                        + {dict.add_to_cart}
                      </button>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function TabButton({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition ${
        active ? 'bg-gold-500 text-ink-950 shadow-glow' : 'border border-ink-600 text-ink-300 hover:border-gold-500 hover:text-gold-400'
      }`}
    >
      {label}
    </button>
  );
}
