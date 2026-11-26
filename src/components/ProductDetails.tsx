'use client';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCart, type CartExtra } from './CartProvider';
import { formatMoney } from '@/lib/format';
import UpsellRail from './UpsellRail';

interface Extra { id: number; name: string; priceCents: number }
interface Suggestion { id: number; name: string; priceCents: number; image: string }

export default function ProductDetails({
  lang, dict, product, extras, suggestions, currencySymbol,
}: {
  lang: string;
  dict: Record<string, string>;
  product: { id: number; name: string; description: string; priceCents: number; image: string; soldOut: boolean };
  extras: Extra[];
  suggestions: Suggestion[];
  currencySymbol: string;
}) {
  const { add } = useCart();
  const router = useRouter();
  const [qty, setQty] = useState(1);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [instructions, setInstructions] = useState('');
  const [added, setAdded] = useState(false);

  const extrasSum = useMemo(
    () => extras.filter((e) => selected.has(e.id)).reduce((s, e) => s + e.priceCents, 0),
    [extras, selected]
  );
  const lineTotal = (product.priceCents + extrasSum) * qty;

  function toggleExtra(id: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function addToCart(goCheckout: boolean) {
    const chosen: CartExtra[] = extras
      .filter((e) => selected.has(e.id))
      .map((e) => ({ id: e.id, name: e.name, priceCents: e.priceCents }));
    add({
      productId: product.id, name: product.name, unitPriceCents: product.priceCents,
      image: product.image, quantity: qty, extras: chosen, instructions,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
    if (goCheckout) router.push(`/${lang}/checkout`);
  }

  return (
    <div className="animate-fadeUp">
      <div className="relative overflow-hidden rounded-3xl border border-ink-700">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={product.image} alt={product.name} className="aspect-[4/3] w-full object-cover sm:aspect-[16/9]" />
        {product.soldOut && (
          <span className="chip absolute start-4 top-4 bg-ink-950/90 px-4 py-2 text-ember-400 border border-ember-600">{dict.sold_out}</span>
        )}
      </div>

      <div className="mt-5 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold sm:text-3xl">{product.name}</h1>
          {product.description && <p className="mt-2 text-ink-300">{product.description}</p>}
        </div>
        <span className="font-display whitespace-nowrap text-2xl font-bold text-gold-400">
          {formatMoney(product.priceCents, currencySymbol)}
        </span>
      </div>

      {extras.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-2 font-semibold text-ink-200">{dict.extras} <span className="text-xs font-normal text-ink-500">({dict.optional})</span></h2>
          <div className="grid gap-2">
            {extras.map((e) => {
              const on = selected.has(e.id);
              return (
                <button
                  key={e.id}
                  onClick={() => toggleExtra(e.id)}
                  className={`flex items-center justify-between rounded-xl border px-4 py-3 text-start transition ${
                    on ? 'border-gold-500 bg-gold-500/10' : 'border-ink-600 bg-ink-850 hover:border-ink-500'
                  }`}
                  aria-pressed={on}
                >
                  <span className="flex items-center gap-3">
                    <span className={`flex h-5 w-5 items-center justify-center rounded-md border ${on ? 'border-gold-500 bg-gold-500 text-ink-950' : 'border-ink-500'}`}>
                      {on && '✓'}
                    </span>
                    {e.name}
                  </span>
                  <span className="text-sm text-gold-400">+{formatMoney(e.priceCents, currencySymbol)}</span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      <section className="mt-6">
        <label className="label" htmlFor="instructions">{dict.special_instructions}</label>
        <textarea
          id="instructions"
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          placeholder={dict.instructions_placeholder}
          rows={2}
          maxLength={500}
          className="input resize-none"
        />
      </section>

      <div className="mt-6 flex items-center gap-4">
        <div className="flex items-center rounded-full border border-ink-600">
          <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="px-4 py-2 text-xl text-ink-300 transition hover:text-gold-400" aria-label="-">−</button>
          <span className="min-w-8 text-center font-bold" aria-live="polite">{qty}</span>
          <button onClick={() => setQty((q) => Math.min(50, q + 1))} className="px-4 py-2 text-xl text-ink-300 transition hover:text-gold-400" aria-label="+">+</button>
        </div>
        <span className="text-sm text-ink-400">{dict.quantity}</span>
      </div>

      <div className="sticky bottom-4 z-30 mt-8 flex gap-3">
        <button
          onClick={() => addToCart(false)}
          disabled={product.soldOut}
          className="btn-gold flex-1 text-base shadow-glow"
        >
          {added ? `${dict.added} ✓` : `${dict.add_to_cart} · ${formatMoney(lineTotal, currencySymbol)}`}
        </button>
        <button onClick={() => addToCart(true)} disabled={product.soldOut} className="btn-ghost">
          {dict.checkout}
        </button>
      </div>

      {suggestions.length > 0 && (
        <UpsellRail
          lang={lang}
          title={dict.complete_meal}
          suggestions={suggestions}
          currencySymbol={currencySymbol}
          addLabel={dict.add_to_cart}
        />
      )}
    </div>
  );
}
