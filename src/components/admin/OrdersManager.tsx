'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { formatMoney } from '@/lib/format';

interface Order {
  id: number; order_number: string; customer_name: string; phone: string;
  fulfillment: string; address: string; address_notes: string; notes: string;
  payment_method: string; status: string; subtotal_cents: number; discount_cents: number;
  delivery_fee_cents: number; total_cents: number; promo_code: string; table_number: string;
  created_at: string;
}
interface OrderItem {
  id: number; name: string; quantity: number; unit_price_cents: number;
  extras: string; instructions: string; line_total_cents: number;
}

const STATUSES = ['new', 'accepted', 'preparing', 'ready', 'out_for_delivery', 'completed', 'rejected', 'cancelled'];
const NEXT: Record<string, string> = {
  new: 'accepted', accepted: 'preparing', preparing: 'ready', ready: 'out_for_delivery', out_for_delivery: 'completed',
};
const NEXT_LABEL: Record<string, string> = {
  new: 'Accept', accepted: 'Start preparing', preparing: 'Mark ready', ready: 'Out for delivery', out_for_delivery: 'Complete',
};

export default function OrdersManager() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [query, setQuery] = useState('');
  const [expanded, setExpanded] = useState<number | null>(null);
  const [items, setItems] = useState<Record<number, OrderItem[]>>({});
  const [loading, setLoading] = useState(true);
  const knownIds = useRef<Set<number>>(new Set());
  const [freshIds, setFreshIds] = useState<Set<number>>(new Set());

  const load = useCallback(async () => {
    const params = new URLSearchParams();
    if (statusFilter) params.set('status', statusFilter);
    if (query) params.set('q', query);
    try {
      const res = await fetch(`/api/orders?${params}`);
      if (!res.ok) return;
      const data = await res.json();
      const list = data.orders as Order[];
      const incoming = list.filter((o) => !knownIds.current.has(o.id) && o.status === 'new');
      if (incoming.length > 0 && knownIds.current.size > 0) {
        setFreshIds((prev) => new Set([...prev, ...incoming.map((o) => o.id)]));
      }
      list.forEach((o) => knownIds.current.add(o.id));
      setOrders(list);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, query]);

  useEffect(() => {
    load();
    const t = setInterval(load, 10000);
    return () => clearInterval(t);
  }, [load]);

  async function setStatus(id: number, status: string) {
    await fetch(`/api/orders/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }),
    });
    setFreshIds((prev) => { const n = new Set(prev); n.delete(id); return n; });
    load();
  }

  async function toggleExpand(id: number) {
    if (expanded === id) { setExpanded(null); return; }
    setExpanded(id);
    if (!items[id]) {
      const res = await fetch(`/api/orders/${id}`);
      if (res.ok) {
        const data = await res.json();
        setItems((prev) => ({ ...prev, [id]: data.items }));
      }
    }
    setFreshIds((prev) => { const n = new Set(prev); n.delete(id); return n; });
  }

  return (
    <div className="mt-5">
      <div className="flex flex-wrap gap-2">
        <input className="input max-w-xs py-2 text-sm" placeholder="Search number, name, phone..." value={query} onChange={(e) => setQuery(e.target.value)} />
        <div className="rail flex gap-1.5 overflow-x-auto">
          <FilterChip active={statusFilter === ''} onClick={() => setStatusFilter('')} label="All" />
          {STATUSES.map((s) => (
            <FilterChip key={s} active={statusFilter === s} onClick={() => setStatusFilter(s)} label={s.replace(/_/g, ' ')} />
          ))}
        </div>
      </div>

      {loading ? (
        <p className="py-16 text-center text-ink-400 animate-pulseSoft">Loading orders...</p>
      ) : orders.length === 0 ? (
        <p className="py-16 text-center text-ink-400">No orders match. New orders appear here the moment a customer checks out.</p>
      ) : (
        <div className="mt-4 grid gap-3">
          {orders.map((o) => {
            const isFresh = freshIds.has(o.id);
            return (
              <div key={o.id} className={`card p-4 transition ${isFresh ? 'border-ember-500 shadow-glow' : ''} ${o.status === 'new' ? 'border-gold-600/60' : ''}`}>
                <button onClick={() => toggleExpand(o.id)} className="flex w-full flex-wrap items-center justify-between gap-2 text-start">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs text-ink-400" dir="ltr">{o.order_number}</span>
                    {isFresh && <span className="chip bg-ember-500 text-white animate-pulseSoft">NEW</span>}
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`chip border text-[10px] ${o.status === 'new' ? 'border-gold-600 bg-gold-500/15 text-gold-300' : 'border-ink-600 text-ink-400'}`}>{o.status.replace(/_/g, ' ')}</span>
                    <span className="text-sm">{o.customer_name}</span>
                    <span className="font-display font-bold text-gold-400">{formatMoney(o.total_cents)}</span>
                    <span className="text-xs text-ink-500">{new Date(o.created_at + 'Z').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </button>

                {expanded === o.id && (
                  <div className="mt-4 border-t border-ink-700 pt-4 animate-fadeIn">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <p className="text-sm"><span className="text-ink-400">Phone:</span> <span dir="ltr">{o.phone}</span></p>
                        <p className="mt-1 text-sm capitalize"><span className="text-ink-400">Type:</span> {o.fulfillment}{o.table_number && ` · Table ${o.table_number}`}</p>
                        {o.fulfillment === 'delivery' && (
                          <p className="mt-1 text-sm"><span className="text-ink-400">Address:</span> {o.address}{o.address_notes && ` (${o.address_notes})`}</p>
                        )}
                        <p className="mt-1 text-sm capitalize"><span className="text-ink-400">Payment:</span> {o.payment_method.replace(/_/g, ' ')}</p>
                        {o.notes && <p className="mt-1 text-sm"><span className="text-ink-400">Notes:</span> {o.notes}</p>}
                        {o.promo_code && <p className="mt-1 text-sm"><span className="text-ink-400">Promo:</span> <span dir="ltr">{o.promo_code}</span></p>}
                      </div>
                      <div className="text-sm">
                        {(items[o.id] || []).map((i) => {
                          const extras = JSON.parse(i.extras || '[]') as { name: string; priceCents: number }[];
                          return (
                            <div key={i.id} className="mb-1.5 flex justify-between gap-2">
                              <span>
                                {i.quantity}× {i.name}
                                {extras.length > 0 && <span className="text-xs text-ink-400"> +{extras.map((e) => e.name).join(', ')}</span>}
                                {i.instructions && <span className="block text-xs italic text-ink-500">“{i.instructions}”</span>}
                              </span>
                              <span className="whitespace-nowrap">{formatMoney(i.line_total_cents)}</span>
                            </div>
                          );
                        })}
                        <div className="mt-2 border-t border-ink-700 pt-2 text-xs text-ink-400">
                          <div className="flex justify-between"><span>Subtotal</span><span>{formatMoney(o.subtotal_cents)}</span></div>
                          {o.discount_cents > 0 && <div className="flex justify-between"><span>Discount</span><span>-{formatMoney(o.discount_cents)}</span></div>}
                          {o.delivery_fee_cents > 0 && <div className="flex justify-between"><span>Delivery</span><span>{formatMoney(o.delivery_fee_cents)}</span></div>}
                          <div className="mt-1 flex justify-between text-sm font-bold text-gold-300"><span>Total</span><span>{formatMoney(o.total_cents)}</span></div>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {NEXT[o.status] && (
                        <button onClick={() => setStatus(o.id, NEXT[o.status])} className="btn-gold px-4 py-2 text-sm">
                          {NEXT_LABEL[o.status]}
                        </button>
                      )}
                      {o.status === 'ready' && (
                        <button onClick={() => setStatus(o.id, 'completed')} className="btn-ghost px-4 py-2 text-sm">Complete (pickup)</button>
                      )}
                      {o.status === 'new' && (
                        <button onClick={() => setStatus(o.id, 'rejected')} className="btn-ghost px-4 py-2 text-sm text-ember-400">Reject</button>
                      )}
                      {!['completed', 'cancelled', 'rejected'].includes(o.status) && (
                        <button onClick={() => setStatus(o.id, 'cancelled')} className="btn-ghost px-4 py-2 text-sm text-ink-400">Cancel</button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function FilterChip({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button onClick={onClick} className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium capitalize transition ${active ? 'bg-gold-500 text-ink-950' : 'border border-ink-600 text-ink-300 hover:border-gold-500'}`}>
      {label}
    </button>
  );
}
