'use client';
import { useState } from 'react';
import type { Settings } from '@/lib/settings';

export default function SettingsForm({ initial }: { initial: Settings }) {
  const [s, setS] = useState<Settings>(initial);
  const [toast, setToast] = useState('');
  const set = (k: keyof Settings, v: unknown) => setS((prev) => ({ ...prev, [k]: v }));

  async function save() {
    const res = await fetch('/api/settings', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(s),
    });
    setToast(res.ok ? 'Saved. Live on the site now.' : 'Save failed');
    setTimeout(() => setToast(''), 2500);
  }

  async function upload(field: 'logo' | 'cover_image', file: File) {
    const form = new FormData();
    form.append('file', file);
    const res = await fetch('/api/upload', { method: 'POST', body: form });
    if (res.ok) set(field, (await res.json()).url);
  }

  return (
    <div className="mt-6 grid max-w-3xl gap-6">
      {toast && <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-gold-500 px-5 py-2.5 text-sm font-semibold text-ink-950 animate-fadeUp">{toast}</div>}

      <section className="card p-5">
        <h2 className="mb-4 font-semibold text-gold-300">Identity</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><label className="label">Restaurant name</label><input className="input" value={s.restaurant_name} onChange={(e) => set('restaurant_name', e.target.value)} /></div>
          <div><label className="label">Tagline</label><input className="input" value={s.tagline} onChange={(e) => set('tagline', e.target.value)} /></div>
          <div>
            <label className="label">Logo</label>
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={s.logo || '/images/placeholders/logo.svg'} alt="" className="h-12 w-12 rounded-full object-cover" />
              <label className="btn-ghost cursor-pointer px-3 py-1.5 text-xs">Upload<input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && upload('logo', e.target.files[0])} /></label>
            </div>
          </div>
          <div>
            <label className="label">Cover image</label>
            <div className="flex items-center gap-3">
              {s.cover_image && /* eslint-disable-next-line @next/next/no-img-element */ <img src={s.cover_image} alt="" className="h-12 w-20 rounded-lg object-cover" />}
              <label className="btn-ghost cursor-pointer px-3 py-1.5 text-xs">Upload<input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && upload('cover_image', e.target.files[0])} /></label>
            </div>
          </div>
          <div className="sm:col-span-2"><label className="label">Description (EN)</label><textarea className="input resize-none" rows={2} value={s.description} onChange={(e) => set('description', e.target.value)} /></div>
          <div className="sm:col-span-2"><label className="label">Description (AR)</label><textarea className="input resize-none" rows={2} dir="rtl" value={s.description_ar} onChange={(e) => set('description_ar', e.target.value)} /></div>
        </div>
      </section>

      <section className="card p-5">
        <h2 className="mb-4 font-semibold text-gold-300">Contact</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><label className="label">Phone</label><input className="input" dir="ltr" value={s.phone} onChange={(e) => set('phone', e.target.value)} placeholder="+961 ..." /></div>
          <div><label className="label">WhatsApp number</label><input className="input" dir="ltr" value={s.whatsapp_number} onChange={(e) => set('whatsapp_number', e.target.value)} placeholder="+961 ..." /></div>
          <div><label className="label">Address</label><input className="input" value={s.address} onChange={(e) => set('address', e.target.value)} /></div>
          <div><label className="label">Opening hours</label><input className="input" value={s.opening_hours} onChange={(e) => set('opening_hours', e.target.value)} placeholder="Daily 11:00 - 03:00" /></div>
          <div><label className="label">Instagram URL</label><input className="input" dir="ltr" value={s.social_instagram} onChange={(e) => set('social_instagram', e.target.value)} /></div>
          <div><label className="label">Facebook URL</label><input className="input" dir="ltr" value={s.social_facebook} onChange={(e) => set('social_facebook', e.target.value)} /></div>
          <div><label className="label">TikTok URL</label><input className="input" dir="ltr" value={s.social_tiktok} onChange={(e) => set('social_tiktok', e.target.value)} /></div>
        </div>
      </section>

      <section className="card p-5">
        <h2 className="mb-4 font-semibold text-gold-300">Ordering & delivery</h2>
        <div className="flex flex-wrap gap-4">
          <Check label="Delivery enabled" on={s.delivery_enabled} onChange={(v) => set('delivery_enabled', v)} />
          <Check label="Pickup enabled" on={s.pickup_enabled} onChange={(v) => set('pickup_enabled', v)} />
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div><label className="label">Default delivery fee (USD)</label><input className="input" type="number" min="0" step="0.5" value={s.default_delivery_fee} onChange={(e) => set('default_delivery_fee', Number(e.target.value))} /></div>
        </div>
        <fieldset className="mt-4">
          <legend className="label">Delivery zones (address match → fee)</legend>
          <div className="grid gap-2">
            {s.delivery_zones.map((z, i) => (
              <div key={i} className="flex gap-2">
                <input className="input flex-1 py-2 text-sm" value={z.name} placeholder="Zone name (e.g. Saida)"
                  onChange={(e) => set('delivery_zones', s.delivery_zones.map((x, xi) => xi === i ? { ...x, name: e.target.value } : x))} />
                <input className="input w-28 py-2 text-sm" type="number" min="0" step="0.5" value={z.fee}
                  onChange={(e) => set('delivery_zones', s.delivery_zones.map((x, xi) => xi === i ? { ...x, fee: Number(e.target.value) } : x))} />
                <button onClick={() => set('delivery_zones', s.delivery_zones.filter((_, xi) => xi !== i))} className="text-ink-500 hover:text-ember-400">✕</button>
              </div>
            ))}
            <button onClick={() => set('delivery_zones', [...s.delivery_zones, { name: '', fee: 0 }])} className="btn-ghost w-fit px-3 py-1.5 text-xs">+ Add zone</button>
          </div>
        </fieldset>
        <fieldset className="mt-4">
          <legend className="label">Payment methods</legend>
          <div className="flex flex-wrap gap-4">
            <Check label="Cash on delivery" on={s.payment_methods.includes('cash_on_delivery')}
              onChange={(v) => set('payment_methods', v ? [...s.payment_methods, 'cash_on_delivery'] : s.payment_methods.filter((m) => m !== 'cash_on_delivery'))} />
            <Check label="Cash at pickup" on={s.payment_methods.includes('cash_at_pickup')}
              onChange={(v) => set('payment_methods', v ? [...s.payment_methods, 'cash_at_pickup'] : s.payment_methods.filter((m) => m !== 'cash_at_pickup'))} />
          </div>
          <p className="mt-2 text-xs text-ink-500">Online card payments need a payment gateway integration; they are off until real credentials are connected.</p>
        </fieldset>
      </section>

      <section className="card p-5">
        <h2 className="mb-4 font-semibold text-gold-300">Localization & loyalty</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><label className="label">Currency code</label><input className="input" value={s.currency} onChange={(e) => set('currency', e.target.value.toUpperCase())} maxLength={4} /></div>
          <div><label className="label">Currency symbol</label><input className="input" value={s.currency_symbol} onChange={(e) => set('currency_symbol', e.target.value)} maxLength={4} /></div>
          <div>
            <label className="label">Default language</label>
            <select className="input" value={s.language_default} onChange={(e) => set('language_default', e.target.value)}>
              <option value="en">English</option><option value="ar">العربية</option><option value="fr">Français</option>
            </select>
          </div>
          <div>
            <label className="label">Enabled languages</label>
            <div className="flex gap-4 pt-2">
              {[['en', 'EN'], ['ar', 'AR'], ['fr', 'FR']].map(([id, lbl]) => (
                <Check key={id} label={lbl} on={s.languages_enabled.includes(id)}
                  onChange={(v) => set('languages_enabled', v ? [...s.languages_enabled, id] : s.languages_enabled.filter((l) => l !== id))} />
              ))}
            </div>
          </div>
          <Check label="Loyalty points enabled" on={s.loyalty_enabled} onChange={(v) => set('loyalty_enabled', v)} />
          <div><label className="label">Points per $1 spent</label><input className="input" type="number" min="0" step="0.5" value={s.loyalty_points_per_dollar} onChange={(e) => set('loyalty_points_per_dollar', Number(e.target.value))} /></div>
        </div>
      </section>

      <button onClick={save} className="btn-gold w-full py-3.5 text-base shadow-glow">Save all settings</button>
    </div>
  );
}

function Check({ label, on, onChange }: { label: string; on: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm">
      <input type="checkbox" className="h-4 w-4 accent-gold-500" checked={!!on} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  );
}
