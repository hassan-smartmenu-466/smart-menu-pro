'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useCart } from './CartProvider';
import { formatMoney } from '@/lib/format';

interface Suggestion { id: number; name: string; priceCents: number; image: string }

// Upsell suggestions are never auto-added: every item needs the customer's tap.
export default function UpsellRail({
  lang, title, suggestions, currencySymbol, addLabel,
}: {
  lang: string;
  title: string;
  suggestions: Suggestion[];
  currencySymbol: string;
  addLabel: string;
}) {
  const { add } = useCart();
  const [addedIds, setAddedIds] = useState<Set<number>>(new Set());

  function quickAdd(s: Suggestion) {
    add({ productId: s.id, name: s.name, unitPriceCents: s.priceCents, image: s.image, quantity: 1, extras: [], instructions: '' });
    setAddedIds((prev) => new Set(prev).add(s.id));
    setTimeout(() => setAddedIds((prev) => { const n = new Set(prev); n.delete(s.id); return n; }), 1200);
  }

  return (
    <section className="mt-10 animate-fadeUp">
      <h2 className="font-display mb-3 text-lg font-bold text-gold-300">{title}</h2>
      <div className="rail flex gap-3 overflow-x-auto pb-2">
        {suggestions.map((s) => (
          <div key={s.id} className="card w-40 shrink-0 overflow-hidden">
            <Link href={`/${lang}/product/${s.id}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={s.image} alt={s.name} loading="lazy" className="aspect-square w-full object-cover" />
            </Link>
            <div className="p-2.5">
              <p className="truncate text-sm font-medium">{s.name}</p>
              <div className="mt-1.5 flex items-center justify-between">
                <span className="text-sm font-bold text-gold-400">{formatMoney(s.priceCents, currencySymbol)}</span>
                <button
                  onClick={() => quickAdd(s)}
                  className={`rounded-full px-2.5 py-1 text-xs font-bold transition active:scale-95 ${
                    addedIds.has(s.id) ? 'bg-[#3d6b23] text-white' : 'bg-gold-500 text-ink-950 hover:bg-gold-400'
                  }`}
                >
                  {addedIds.has(s.id) ? '✓' : `+ ${addLabel}`}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
