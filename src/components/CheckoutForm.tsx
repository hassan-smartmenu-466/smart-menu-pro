'use client';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from './CartProvider';
import { formatMoney } from '@/lib/format';

interface PublicSettings {
  delivery_enabled: boolean; pickup_enabled: boolean;
  delivery_zones: { name: string; fee: number }[];
  default_delivery_fee: number;
  payment_methods: string[];
}

export default function CheckoutForm({
  lang, dict, currencySymbol, settings, tableNumber,
}: {
  lang: string;
  dict: Record<string, string>;
  currencySymbol: string;
  settings: PublicSettings;
  tableNumber: string;
}) {
  const router = useRouter();
  const { items, subtotalCents, clear } = useCart();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [fulfillment, setFulfillment] = useState<'delivery' | 'pickup'>(
    settings.delivery_enabled ? 'delivery' : 'pickup'
  );
  const [address, setAddress] = useState('');
  const [addressNotes, setAddressNotes] = useState('');
  const [notes, setNotes] = useState('');
  const [payment, setPayment] = useState(settings.payment_methods[0] || 'cash_on_delivery');
  const [promo, setPromo] = useState('');
  const [promoState, setPromoState] = useState<{ ok: boolean; discountCents: number; message: string } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const deliveryFeeCents = useMemo(() => {
    if (fulfillment !== 'delivery') return 0;
    const a = address.toLowerCase();
    for (const z of settings.delivery_zones || []) {
      if (z.name && a.includes(z.name.toLowerCase())) return Math.round(z.fee * 100);
    }
    return Math.round((settings.default_delivery_fee || 0) * 100);
  }, [fulfillment, address, settings]);

  const discountCents = promoState?.ok ? promoState.discountCents : 0;
  const totalCents = Math.max(0, subtotalCents - discountCents) + deliveryFeeCents;

  async function applyPromo() {
    if (!promo.trim()) return;
    try {
      const res = await fetch('/api/promotions/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: promo.trim(), subtotalCents }),
      });
      const data = await res.json();
      if (data.valid) {
        setPromoState({ ok: true, discountCents: data.discountCents, message: dict.promo_applied });
      } else {
        setPromoState({ ok: false, discountCents: 0, message: dict.promo_invalid });
      }
    } catch {
      setPromoState({ ok: false, discountCents: 0, message: dict.promo_invalid });
    }
  }

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (items.length === 0) e.cart = dict.min_one_item;
    if (!name.trim()) e.name = dict.required_field;
    if (!/^[+0-9][0-9\s-]{5,18}$/.test(phone.trim())) e.phone = dict.invalid_phone;
    if (fulfillment === 'delivery' && !address.trim()) e.address = dict.required_field;
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function submit() {
    if (!validate() || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: name.trim(),
          phone: phone.trim(),
          fulfillment,
          address: address.trim(),
          addressNotes: addressNotes.trim(),
          notes: notes.trim(),
          paymentMethod: payment,
          promoCode: promoState?.ok ? promo.trim() : '',
          tableNumber,
          lang,
          items: items.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
            extraIds: i.extras.map((e) => e.id),
            instructions: i.instructions,
          })),
        }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        clear();
        router.push(`/${lang}/order/${data.orderNumber}`);
      } else {
        setErrors({ submit: `${dict.order_failed}${data.error ? ` (${data.error})` : ''}` });
        setSubmitting(false);
      }
    } catch {
      setErrors({ submit: dict.order_failed });
      setSubmitting(false);
    }
  }

  if (!mounted) return <div className="py-20 text-center text-ink-400 animate-pulseSoft">...</div>;

  if (items.length === 0) {
    return (
      <div className="py-20 text-center animate-fadeUp">
        <h1 className="font-display text-2xl font-bold">{dict.cart_empty}</h1>
        <p className="mt-2 text-ink-400">{dict.min_one_item}</p>
      </div>
    );
  }

  const paymentLabel = (m: string) => (dict[m] || m.replace(/_/g, ' '));

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_360px] animate-fadeUp">
      <div>
        <h1 className="font-display text-2xl font-bold">{dict.checkout}</h1>

        <section className="card mt-6 p-5">
          <h2 className="mb-4 font-semibold text-gold-300">{dict.contact_details}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="name">{dict.full_name} *</label>
              <input id="name" className="input" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} />
              {errors.name && <p className="mt-1 text-xs text-ember-400">{errors.name}</p>}
            </div>
            <div>
              <label className="label" htmlFor="phone">{dict.phone_number} *</label>
              <input id="phone" className="input" dir="ltr" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+961 ..." maxLength={20} />
              {errors.phone && <p className="mt-1 text-xs text-ember-400">{errors.phone}</p>}
            </div>
          </div>
        </section>

        <section className="card mt-4 p-5">
          <h2 className="mb-4 font-semibold text-gold-300">{dict.fulfillment}</h2>
          <div className="grid grid-cols-2 gap-3">
            {settings.delivery_enabled && (
              <button
                onClick={() => setFulfillment('delivery')}
                className={`rounded-xl border px-4 py-3 font-medium transition ${fulfillment === 'delivery' ? 'border-gold-500 bg-gold-500/10 text-gold-300' : 'border-ink-600 text-ink-300 hover:border-ink-500'}`}
              >
                🛵 {dict.delivery}
              </button>
            )}
            {settings.pickup_enabled && (
              <button
                onClick={() => setFulfillment('pickup')}
                className={`rounded-xl border px-4 py-3 font-medium transition ${fulfillment === 'pickup' ? 'border-gold-500 bg-gold-500/10 text-gold-300' : 'border-ink-600 text-ink-300 hover:border-ink-500'}`}
              >
                🛍️ {dict.pickup}
              </button>
            )}
          </div>
          {fulfillment === 'delivery' && (
            <div className="mt-4 grid gap-4">
              <div>
                <label className="label" htmlFor="address">{dict.delivery_address} *</label>
                <input id="address" className="input" value={address} onChange={(e) => setAddress(e.target.value)} maxLength={200} />
                {errors.address && <p className="mt-1 text-xs text-ember-400">{errors.address}</p>}
                {(settings.delivery_zones || []).length > 0 && (
                  <p className="mt-1.5 text-xs text-ink-500">
                    {dict.delivery_info}: {settings.delivery_zones.map((z) => `${z.name} (${formatMoney(Math.round(z.fee * 100), currencySymbol)})`).join(' · ')}
                  </p>
                )}
              </div>
              <div>
                <label className="label" htmlFor="addressNotes">{dict.address_notes}</label>
                <input id="addressNotes" className="input" value={addressNotes} onChange={(e) => setAddressNotes(e.target.value)} maxLength={200} />
              </div>
            </div>
          )}
          <div className="mt-4">
            <label className="label" htmlFor="notes">{dict.order_notes}</label>
            <textarea id="notes" className="input resize-none" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={500} />
          </div>
        </section>

        <section className="card mt-4 p-5">
          <h2 className="mb-4 font-semibold text-gold-300">{dict.payment_method}</h2>
          <div className="grid gap-2">
            {settings.payment_methods.map((m) => (
              <button
                key={m}
                onClick={() => setPayment(m)}
                className={`rounded-xl border px-4 py-3 text-start transition ${payment === m ? 'border-gold-500 bg-gold-500/10 text-gold-300' : 'border-ink-600 text-ink-300 hover:border-ink-500'}`}
              >
                💵 {paymentLabel(m)}
              </button>
            ))}
          </div>
        </section>
      </div>

      <aside className="card h-fit p-5 lg:sticky lg:top-24">
        <h2 className="font-semibold text-gold-300">{dict.your_order}</h2>
        <div className="mt-3 max-h-64 space-y-2 overflow-y-auto">
          {items.map((i) => {
            const unit = i.unitPriceCents + i.extras.reduce((s, e) => s + e.priceCents, 0);
            return (
              <div key={i.key} className="flex justify-between gap-2 text-sm">
                <span className="min-w-0 truncate text-ink-200">{i.quantity}× {i.name}</span>
                <span className="whitespace-nowrap">{formatMoney(unit * i.quantity, currencySymbol)}</span>
              </div>
            );
          })}
        </div>

        <div className="mt-4 flex gap-2">
          <input
            className="input flex-1 py-2 text-sm"
            placeholder={dict.promo_code}
            value={promo}
            onChange={(e) => { setPromo(e.target.value); setPromoState(null); }}
            maxLength={40}
          />
          <button onClick={applyPromo} className="btn-ghost px-4 py-2 text-sm">{dict.apply}</button>
        </div>
        {promoState && (
          <p className={`mt-1.5 text-xs ${promoState.ok ? 'text-[#7fae4c]' : 'text-ember-400'}`}>{promoState.message}</p>
        )}

        <div className="mt-4 space-y-1.5 border-t border-ink-700 pt-4 text-sm">
          <div className="flex justify-between"><span className="text-ink-300">{dict.subtotal}</span><span>{formatMoney(subtotalCents, currencySymbol)}</span></div>
          {discountCents > 0 && (
            <div className="flex justify-between text-[#7fae4c]"><span>{dict.discount}</span><span>-{formatMoney(discountCents, currencySymbol)}</span></div>
          )}
          <div className="flex justify-between">
            <span className="text-ink-300">{dict.delivery_fee}</span>
            <span>{fulfillment === 'delivery' ? (deliveryFeeCents === 0 ? dict.free : formatMoney(deliveryFeeCents, currencySymbol)) : '—'}</span>
          </div>
          <div className="flex justify-between border-t border-ink-700 pt-2 text-base font-bold">
            <span>{dict.total}</span>
            <span className="font-display text-gold-400">{formatMoney(totalCents, currencySymbol)}</span>
          </div>
        </div>

        {errors.submit && <p className="mt-3 text-sm text-ember-400">{errors.submit}</p>}
        <button onClick={submit} disabled={submitting} className="btn-gold mt-5 w-full text-base shadow-glow">
          {submitting ? dict.placing_order : `${dict.place_order} · ${formatMoney(totalCents, currencySymbol)}`}
        </button>
      </aside>
    </div>
  );
}
