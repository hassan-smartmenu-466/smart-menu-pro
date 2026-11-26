'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useCart } from './CartProvider';
import { formatMoney } from '@/lib/format';
import UpsellRail from './UpsellRail';

interface Suggestion { id: number; name: string; priceCents: number; image: string }

export default function CartView({
  lang, dict, currencySymbol, suggestionsEndpoint,
}: {
  lang: string;
  dict: Record<string, string>;
  currencySymbol: string;
  suggestionsEndpoint: string;
}) {
  const { items, setQty, remove, subtotalCents, count } = useCart();
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!mounted) return;
    const ids = items.map((i) => i.productId);
    if (ids.length === 0) { setSuggestions([]); return; }
    fetch(`${suggestionsEndpoint}?products=${ids.join(',')}`)
      .then((r) => (r.ok ? r.json() : { suggestions: [] }))
      .then((d) => setSuggestions(d.suggestions || []))
      .catch(() => setSuggestions([]));
  }, [items, mounted, suggestionsEndpoint]);

  if (!mounted) return <div className="py-20 text-center text-ink-400 animate-pulseSoft">...</div>;

  if (items.length === 0) {
    return (
      <div className="py-20 text-center animate-fadeUp">
        <p className="text-5xl">🛒</p>
        <h1 className="font-display mt-4 text-2xl font-bold">{dict.cart_empty}</h1>
        <p className="mt-2 text-ink-400">{dict.cart_empty_hint}</p>
        <Link href={`/${lang}#menu`} className="btn-gold mt-6">{dict.browse_menu}</Link>
      </div>
    );
  }

  return (
    <div className="animate-fadeUp">
      <h1 className="font-display text-2xl font-bold">{dict.your_cart}</h1>
      <p className="mt-1 text-sm text-ink-400">{count} {count === 1 ? dict.item : dict.items}</p>

      <div className="mt-6 grid gap-3">
        {items.map((i) => {
          const unit = i.unitPriceCents + i.extras.reduce((s, e) => s + e.priceCents, 0);
          return (
            <div key={i.key} className="card flex gap-3 p-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={i.image} alt="" className="h-20 w-20 shrink-0 rounded-xl object-cover" />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{i.name}</p>
                    {i.extras.length > 0 && (
                      <p className="mt-0.5 truncate text-xs text-ink-400">+ {i.extras.map((e) => e.name).join(', ')}</p>
                    )}
                    {i.instructions && <p className="mt-0.5 truncate text-xs italic text-ink-500">“{i.instructions}”</p>}
                    <p className="mt-1 text-xs text-ink-400">{formatMoney(unit, currencySymbol)} {dict.each}</p>
                  </div>
                  <p className="font-display whitespace-nowrap font-bold text-gold-400">{formatMoney(unit * i.quantity, currencySymbol)}</p>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <div className="flex items-center rounded-full border border-ink-600">
                    <button onClick={() => setQty(i.key, i.quantity - 1)} className="px-3 py-1 text-ink-300 hover:text-gold-400" aria-label="-">−</button>
                    <span className="min-w-7 text-center text-sm font-bold">{i.quantity}</span>
                    <button onClick={() => setQty(i.key, i.quantity + 1)} className="px-3 py-1 text-ink-300 hover:text-gold-400" aria-label="+">+</button>
                  </div>
                  <button onClick={() => remove(i.key)} className="text-xs text-ink-500 transition hover:text-ember-400">
                    {dict.remove}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="card mt-6 p-4">
        <div className="flex justify-between text-sm">
          <span className="text-ink-300">{dict.subtotal}</span>
          <span className="font-semibold">{formatMoney(subtotalCents, currencySymbol)}</span>
        </div>
        <p className="mt-1 text-xs text-ink-500">{dict.delivery_fee} · {dict.checkout} →</p>
        <Link href={`/${lang}/checkout`} className="btn-gold mt-4 w-full text-base shadow-glow">
          {dict.checkout} · {formatMoney(subtotalCents, currencySymbol)}
        </Link>
        <Link href={`/${lang}#menu`} className="mt-3 block text-center text-sm text-ink-400 hover:text-gold-400">
          {dict.continue_shopping}
        </Link>
      </div>

      {suggestions.length > 0 && (
        <UpsellRail lang={lang} title={dict.you_might_like} suggestions={suggestions} currencySymbol={currencySymbol} addLabel={dict.add_to_cart} />
      )}
    </div>
  );
}
