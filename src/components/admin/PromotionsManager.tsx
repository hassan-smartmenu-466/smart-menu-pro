'use client';
import { useEffect, useState } from 'react';
import { formatMoney } from '@/lib/format';
import { Modal } from './MenuManager';

interface Promo {
  id: number; type: string; name: string; code: string; percent: number;
  amount_cents: number; product_id: number | null; combo_items: string;
  combo_price_cents: number; starts_at: string; ends_at: string; active: number;
  usage_limit: number; used_count: number;
}

const TYPES = [
  { id: 'percent', label: 'Percentage discount (whole order)' },
  { id: 'fixed', label: 'Fixed amount discount (whole order)' },
  { id: 'promo_code', label: 'Promo code' },
  { id: 'product_offer', label: 'Product-specific offer' },
  { id: 'combo', label: 'Combo deal' },
];

export default function PromotionsManager({ products }: { products: { id: number; name: string }[] }) {
  const [promos, setPromos] = useState<Promo[]>([]);
  const [editing, setEditing] = useState<Partial<Promo> | null>(null);
  const [toast, setToast] = useState('');

  async function load() {
    const res = await fetch('/api/promotions');
    if (res.ok) setPromos((await res.json()).promotions);
  }
  useEffect(() => { load(); }, []);

  function note(m: string) { setToast(m); setTimeout(() => setToast(''), 2500); }

  async function save() {
    if (!editing) return;
    const method = editing.id ? 'PATCH' : 'POST';
    const res = await fetch('/api/promotions', {
      method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editing),
    });
    if (res.ok) { setEditing(null); load(); note('Saved.'); }
  }

  async function toggle(p: Promo) {
    await fetch('/api/promotions', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: p.id, active: !p.active }) });
    load();
  }

  async function remove(p: Promo) {
    if (!confirm(`Delete "${p.name}"?`)) return;
    await fetch(`/api/promotions?id=${p.id}`, { method: 'DELETE' });
    load();
  }

  return (
    <div className="mt-5">
      {toast && <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-gold-500 px-5 py-2.5 text-sm font-semibold text-ink-950 animate-fadeUp">{toast}</div>}
      <button onClick={() => setEditing({ type: 'promo_code', active: 1 })} className="btn-gold px-4 py-2 text-sm">+ New promotion</button>

      <div className="mt-4 grid gap-3">
        {promos.length === 0 && <p className="card p-8 text-center text-ink-400">No promotions yet.</p>}
        {promos.map((p) => (
          <div key={p.id} className={`card flex flex-wrap items-center gap-3 p-4 ${!p.active ? 'opacity-55' : ''}`}>
            <div className="min-w-0 flex-1">
              <p className="font-medium">{p.name} <span className="chip ms-2 bg-ink-700 text-ink-300">{p.type.replace(/_/g, ' ')}</span></p>
              <p className="mt-0.5 text-xs text-ink-400">
                {p.percent > 0 && `${p.percent}% off · `}
                {p.amount_cents > 0 && `${formatMoney(p.amount_cents)} off · `}
                {p.type === 'combo' && `${JSON.parse(p.combo_items || '[]').length} items for ${formatMoney(p.combo_price_cents)} · `}
                {p.code && <>code <b dir="ltr">{p.code}</b> · </>}
                {p.usage_limit > 0 ? `${p.used_count}/${p.usage_limit} used` : `${p.used_count} used`}
                {(p.starts_at || p.ends_at) && ` · ${p.starts_at ? new Date(p.starts_at).toLocaleDateString() : 'now'} → ${p.ends_at ? new Date(p.ends_at).toLocaleDateString() : 'open'}`}
              </p>
            </div>
            <button onClick={() => toggle(p)} className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${p.active ? 'border-gold-500 bg-gold-500/15 text-gold-300' : 'border-ink-600 text-ink-500'}`}>
              {p.active ? 'Active' : 'Off'}
            </button>
            <button onClick={() => setEditing(p)} className="btn-ghost px-3 py-1.5 text-xs">Edit</button>
            <button onClick={() => remove(p)} className="rounded-full border border-ink-600 px-3 py-1.5 text-xs text-ink-500 hover:border-ember-600 hover:text-ember-400">Delete</button>
          </div>
        ))}
      </div>

      {editing && (
        <Modal title={editing.id ? 'Edit promotion' : 'New promotion'} onClose={() => setEditing(null)}>
          <div className="grid max-h-[70vh] gap-4 overflow-y-auto pe-1">
            <div>
              <label className="label">Name *</label>
              <input className="input" value={editing.name || ''} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
            </div>
            <div>
              <label className="label">Type</label>
              <select className="input" value={editing.type} onChange={(e) => setEditing({ ...editing, type: e.target.value })}>
                {TYPES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
              </select>
            </div>
            {(editing.type === 'promo_code') && (
              <div>
                <label className="label">Code</label>
                <input className="input" dir="ltr" value={editing.code || ''} onChange={(e) => setEditing({ ...editing, code: e.target.value.toUpperCase() })} placeholder="WELCOME10" />
              </div>
            )}
            {editing.type !== 'combo' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Percent off (%)</label>
                  <input className="input" type="number" min="0" max="100" value={editing.percent || ''} onChange={(e) => setEditing({ ...editing, percent: Number(e.target.value) })} />
                </div>
                <div>
                  <label className="label">or amount off (USD)</label>
                  <input className="input" type="number" min="0" step="0.5" value={editing.amount_cents ? editing.amount_cents / 100 : ''} onChange={(e) => setEditing({ ...editing, amount_cents: Math.round(Number(e.target.value) * 100) })} />
                </div>
              </div>
            )}
            {editing.type === 'product_offer' && (
              <div>
                <label className="label">Product</label>
                <select className="input" value={editing.product_id || ''} onChange={(e) => setEditing({ ...editing, product_id: Number(e.target.value) })}>
                  <option value="">Choose...</option>
                  {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
            )}
            {editing.type === 'combo' && (
              <>
                <div>
                  <label className="label">Combo price (USD)</label>
                  <input className="input" type="number" min="0" step="0.5" value={editing.combo_price_cents ? editing.combo_price_cents / 100 : ''} onChange={(e) => setEditing({ ...editing, combo_price_cents: Math.round(Number(e.target.value) * 100) })} />
                </div>
                <fieldset>
                  <legend className="label">Included products</legend>
                  <div className="grid max-h-44 grid-cols-2 gap-1.5 overflow-y-auto">
                    {products.map((p) => {
                      const items = (editing.combo_items ? JSON.parse(editing.combo_items as unknown as string || '[]') : []) as number[];
                      const on = items.includes(p.id);
                      return (
                        <label key={p.id} className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-1.5 text-xs ${on ? 'border-gold-500 bg-gold-500/10' : 'border-ink-600'}`}>
                          <input type="checkbox" className="accent-gold-500" checked={on}
                            onChange={(e) => {
                              const next = e.target.checked ? [...items, p.id] : items.filter((x) => x !== p.id);
                              setEditing({ ...editing, combo_items: JSON.stringify(next) as unknown as string });
                            }} />
                          {p.name}
                        </label>
                      );
                    })}
                  </div>
                </fieldset>
              </>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Starts (optional)</label>
                <input className="input" type="datetime-local" value={editing.starts_at || ''} onChange={(e) => setEditing({ ...editing, starts_at: e.target.value ? new Date(e.target.value).toISOString() : '' })} />
              </div>
              <div>
                <label className="label">Ends (optional)</label>
                <input className="input" type="datetime-local" value={editing.ends_at || ''} onChange={(e) => setEditing({ ...editing, ends_at: e.target.value ? new Date(e.target.value).toISOString() : '' })} />
              </div>
            </div>
            <div>
              <label className="label">Usage limit (0 = unlimited)</label>
              <input className="input" type="number" min="0" value={editing.usage_limit || 0} onChange={(e) => setEditing({ ...editing, usage_limit: Number(e.target.value) })} />
            </div>
            <button onClick={save} className="btn-gold w-full">Save promotion</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
