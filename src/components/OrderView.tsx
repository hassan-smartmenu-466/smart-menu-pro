'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { formatMoney } from '@/lib/format';

interface OrderData {
  orderNumber: string; status: string; customerName: string; phone: string;
  fulfillment: string; address: string; notes: string; paymentMethod: string;
  subtotalCents: number; discountCents: number; deliveryFeeCents: number; totalCents: number;
  tableNumber: string; createdAt: string; whatsappUrl: string; whatsappConfigured: boolean;
  lines: { name: string; quantity: number; unitPriceCents: number; extras: { name: string; priceCents: number }[]; instructions: string; lineTotalCents: number }[];
}

const STATUS_FLOW = ['new', 'accepted', 'preparing', 'ready', 'out_for_delivery', 'completed'];

export default function OrderView({
  lang, dict, currencySymbol, order, restaurantName,
}: {
  lang: string;
  dict: Record<string, string>;
  currencySymbol: string;
  order: OrderData;
  restaurantName: string;
}) {
  const [status, setStatus] = useState(order.status);

  // Poll for live status updates (real data, honest polling every 12s).
  useEffect(() => {
    const timer = setInterval(async () => {
      try {
        const res = await fetch(`/api/orders/track?number=${encodeURIComponent(order.orderNumber)}&phone=${encodeURIComponent(order.phone)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.status) setStatus(data.status);
        }
      } catch { /* keep last known status */ }
    }, 12000);
    return () => clearInterval(timer);
  }, [order.orderNumber, order.phone]);

  const statusLabel = dict[`status_${status}`] || status;
  const stepIndex = STATUS_FLOW.indexOf(status);

  return (
    <div className="mx-auto max-w-2xl animate-fadeUp">
      <div className="text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#3d6b23] text-3xl text-white shadow-glow">✓</div>
        <h1 className="font-display mt-4 text-2xl font-bold sm:text-3xl">{dict.thank_you}</h1>
        <p className="mt-2 text-ink-400">{dict.order_number}</p>
        <p className="font-display text-xl font-bold tracking-wide text-gold-400" dir="ltr">{order.orderNumber}</p>
      </div>

      {/* Status tracker */}
      <div className="card mt-8 p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gold-300">{dict.order_status}</h2>
          <span className={`chip ${status === 'cancelled' || status === 'rejected' ? 'bg-ember-600/20 text-ember-400 border border-ember-600' : 'bg-gold-500/15 text-gold-300 border border-gold-600'}`}>
            {statusLabel}
          </span>
        </div>
        {status !== 'cancelled' && status !== 'rejected' && (
          <div className="mt-4 flex items-center">
            {STATUS_FLOW.map((s, i) => (
              <div key={s} className="flex flex-1 items-center last:flex-none">
                <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-[11px] font-bold transition ${
                  i <= stepIndex ? 'border-gold-500 bg-gold-500 text-ink-950' : 'border-ink-600 text-ink-500'
                }`}>
                  {i < stepIndex ? '✓' : i + 1}
                </div>
                {i < STATUS_FLOW.length - 1 && (
                  <div className={`h-0.5 flex-1 ${i < stepIndex ? 'bg-gold-500' : 'bg-ink-700'}`} />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Receipt */}
      <div className="card mt-4 p-5">
        <h2 className="mb-3 font-semibold text-gold-300">{dict.your_order}</h2>
        <div className="space-y-3">
          {order.lines.map((l, idx) => (
            <div key={idx} className="flex justify-between gap-3 text-sm">
              <div className="min-w-0">
                <p className="font-medium">{l.quantity}× {l.name}</p>
                {l.extras.map((e, i2) => (
                  <p key={i2} className="text-xs text-ink-400">+ {e.name} ({formatMoney(e.priceCents, currencySymbol)})</p>
                ))}
                {l.instructions && <p className="text-xs italic text-ink-500">“{l.instructions}”</p>}
              </div>
              <span className="whitespace-nowrap">{formatMoney(l.lineTotalCents, currencySymbol)}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 space-y-1.5 border-t border-ink-700 pt-3 text-sm">
          <div className="flex justify-between"><span className="text-ink-300">{dict.subtotal}</span><span>{formatMoney(order.subtotalCents, currencySymbol)}</span></div>
          {order.discountCents > 0 && (
            <div className="flex justify-between text-[#7fae4c]"><span>{dict.discount}</span><span>-{formatMoney(order.discountCents, currencySymbol)}</span></div>
          )}
          {order.fulfillment === 'delivery' && (
            <div className="flex justify-between"><span className="text-ink-300">{dict.delivery_fee}</span><span>{order.deliveryFeeCents === 0 ? dict.free : formatMoney(order.deliveryFeeCents, currencySymbol)}</span></div>
          )}
          <div className="flex justify-between border-t border-ink-700 pt-2 text-base font-bold">
            <span>{dict.total}</span><span className="font-display text-gold-400">{formatMoney(order.totalCents, currencySymbol)}</span>
          </div>
        </div>
        <div className="mt-4 border-t border-ink-700 pt-3 text-sm text-ink-300">
          <p>{order.customerName} · <span dir="ltr">{order.phone}</span></p>
          <p className="mt-1">
            {order.fulfillment === 'delivery' ? `${dict.delivery}: ${order.address}` : dict.pickup}
            {order.tableNumber && ` · ${dict.table} ${order.tableNumber}`}
          </p>
          <p className="mt-1 capitalize">{dict.payment_method}: {dict[order.paymentMethod] || order.paymentMethod.replace(/_/g, ' ')}</p>
        </div>
      </div>

      <div className="mt-6 grid gap-3">
        <a href={order.whatsappUrl} target="_blank" rel="noreferrer" className="btn-gold w-full bg-[#25D366] text-ink-950 hover:bg-[#3ee07c]">
          {dict.send_whatsapp}
        </a>
        {!order.whatsappConfigured && (
          <p className="text-center text-xs text-ink-500">WhatsApp: wa.me</p>
        )}
        <Link href={`/${lang}`} className="btn-ghost w-full">{dict.continue_shopping}</Link>
      </div>
    </div>
  );
}
