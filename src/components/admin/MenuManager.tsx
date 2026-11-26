'use client';
import { useMemo, useState } from 'react';
import { formatMoney } from '@/lib/format';

interface Category { id: number; slug: string; name_en: string; name_ar: string; name_fr: string; sort_order: number; active: number }
interface Product {
  id: number; category_id: number; name: string; name_ar: string; name_fr: string;
  description: string; description_ar: string; price_cents: number; image: string;
  available: number; sold_out: number; featured: number; best_seller: number; is_new: number;
  cost_ingredients_cents: number; cost_preparation_cents: number; cost_packaging_cents: number; cost_other_cents: number;
}
interface Extra { id: number; name: string; price_cents: number }

export default function MenuManager({
  initialCategories, initialProducts, allExtras, productExtras, recommendations,
}: {
  initialCategories: Category[];
  initialProducts: Product[];
  allExtras: Extra[];
  productExtras: { product_id: number; extra_id: number }[];
  recommendations: { product_id: number; recommended_product_id: number }[];
}) {
  const [categories, setCategories] = useState(initialCategories);
  const [products, setProducts] = useState(initialProducts);
  const [extrasMap, setExtrasMap] = useState<Record<number, number[]>>(() => {
    const m: Record<number, number[]> = {};
    for (const pe of productExtras) (m[pe.product_id] ||= []).push(pe.extra_id);
    return m;
  });
  const [recsMap, setRecsMap] = useState<Record<number, number[]>>(() => {
    const m: Record<number, number[]> = {};
    for (const r of recommendations) (m[r.product_id] ||= []).push(r.recommended_product_id);
    return m;
  });
  const [tab, setTab] = useState<'products' | 'categories'>('products');
  const [editing, setEditing] = useState<Product | null>(null);
  const [adding, setAdding] = useState(false);
  const [filterCat, setFilterCat] = useState(0);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState('');

  function note(msg: string) { setToast(msg); setTimeout(() => setToast(''), 2500); }

  async function api(path: string, method: string, body?: unknown) {
    const res = await fetch(path, {
      method, headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined,
    });
    return res.ok;
  }

  async function toggle(p: Product, field: 'available' | 'sold_out' | 'featured' | 'best_seller' | 'is_new') {
    const val = !p[field];
    if (await api('/api/products', 'PATCH', { id: p.id, [field]: val })) {
      setProducts((prev) => prev.map((x) => (x.id === p.id ? { ...x, [field]: val ? 1 : 0 } : x)));
      note('Saved. Live on the menu now.');
    }
  }

  async function saveProduct(p: Product, extraIds: number[], recIds: number[]) {
    const ok = await api('/api/products', 'PATCH', { ...p, price_cents: p.price_cents, extra_ids: extraIds, recommended_ids: recIds });
    if (ok) {
      setProducts((prev) => prev.map((x) => (x.id === p.id ? p : x)));
      setExtrasMap((prev) => ({ ...prev, [p.id]: extraIds }));
      setRecsMap((prev) => ({ ...prev, [p.id]: recIds }));
      setEditing(null);
      note('Product updated. Live on the menu now.');
    }
  }

  async function addProduct(p: Partial<Product>) {
    const res = await fetch('/api/products', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(p),
    });
    if (res.ok) {
      const data = await res.json();
      setProducts((prev) => [...prev, {
        id: data.id, category_id: Number(p.category_id), name: String(p.name),
        name_ar: '', name_fr: '', description: String(p.description || ''), description_ar: '',
        price_cents: Math.round(Number(p.price_cents)), image: '', available: 1, sold_out: 0,
        featured: 0, best_seller: 0, is_new: 1,
        cost_ingredients_cents: 0, cost_preparation_cents: 0, cost_packaging_cents: 0, cost_other_cents: 0,
      }]);
      setAdding(false);
      note('Product added.');
    }
  }

  async function deleteProduct(p: Product) {
    if (!confirm(`Delete "${p.name}"? This cannot be undone.`)) return;
    if (await api(`/api/products?id=${p.id}`, 'DELETE')) {
      setProducts((prev) => prev.filter((x) => x.id !== p.id));
      note('Product deleted.');
    }
  }

  async function uploadImage(p: Product, file: File) {
    const form = new FormData();
    form.append('file', file);
    const res = await fetch('/api/upload', { method: 'POST', body: form });
    if (res.ok) {
      const data = await res.json();
      if (await api('/api/products', 'PATCH', { id: p.id, image: data.url })) {
        setProducts((prev) => prev.map((x) => (x.id === p.id ? { ...x, image: data.url } : x)));
        setEditing((prev) => (prev && prev.id === p.id ? { ...prev, image: data.url } : prev));
        note('Image uploaded.');
      }
    } else {
      const d = await res.json().catch(() => ({}));
      note(`Upload failed: ${d.error || 'error'}`);
    }
  }

  async function moveCategory(id: number, dir: -1 | 1) {
    const sorted = [...categories].sort((a, b) => a.sort_order - b.sort_order);
    const idx = sorted.findIndex((c) => c.id === id);
    const swap = idx + dir;
    if (swap < 0 || swap >= sorted.length) return;
    const ids = sorted.map((c) => c.id);
    [ids[idx], ids[swap]] = [ids[swap], ids[idx]];
    if (await api('/api/categories/reorder', 'POST', { ids })) {
      setCategories(sorted.map((c, i) => ({ ...c, sort_order: ids.indexOf(c.id) + 1 })));
      note('Order updated.');
    }
  }

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      if (filterCat && p.category_id !== filterCat) return false;
      if (q && !p.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [products, filterCat, search]);

  return (
    <div className="mt-5">
      {toast && <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-gold-500 px-5 py-2.5 text-sm font-semibold text-ink-950 shadow-glow animate-fadeUp">{toast}</div>}

      <div className="flex flex-wrap items-center gap-2">
        <TabBtn active={tab === 'products'} onClick={() => setTab('products')} label={`Products (${products.length})`} />
        <TabBtn active={tab === 'categories'} onClick={() => setTab('categories')} label={`Categories (${categories.length})`} />
        <div className="flex-1" />
        {tab === 'products' && <button onClick={() => setAdding(true)} className="btn-gold px-4 py-2 text-sm">+ Add product</button>}
        {tab === 'categories' && (
          <button
            onClick={async () => {
              const name = prompt('Category name (English):');
              if (!name) return;
              const res = await fetch('/api/categories', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name_en: name }) });
              if (res.ok) {
                const d = await res.json();
                setCategories((prev) => [...prev, { id: d.id, slug: d.slug, name_en: name, name_ar: '', name_fr: '', sort_order: prev.length + 1, active: 1 }]);
              }
            }}
            className="btn-gold px-4 py-2 text-sm"
          >
            + Add category
          </button>
        )}
      </div>

      {tab === 'products' && (
        <>
          <div className="mt-4 flex flex-wrap gap-2">
            <input className="input max-w-xs py-2 text-sm" placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)} />
            <select className="input max-w-[180px] py-2 text-sm" value={filterCat} onChange={(e) => setFilterCat(Number(e.target.value))}>
              <option value={0}>All categories</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name_en}</option>)}
            </select>
          </div>
          <div className="mt-4 grid gap-2">
            {visible.map((p) => (
              <div key={p.id} className={`card flex flex-wrap items-center gap-3 p-3 ${!p.available ? 'opacity-55' : ''}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.image || '/images/placeholders/burgers.svg'} alt="" className="h-12 w-12 rounded-lg object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{p.name}</p>
                  <p className="text-xs text-ink-400">{categories.find((c) => c.id === p.category_id)?.name_en} · {formatMoney(p.price_cents)}</p>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <MiniToggle on={!!p.available} onClick={() => toggle(p, 'available')} label="On" title="Available on menu" />
                  <MiniToggle on={!!p.sold_out} onClick={() => toggle(p, 'sold_out')} label="Sold out" warn title="Mark sold out" />
                  <MiniToggle on={!!p.best_seller} onClick={() => toggle(p, 'best_seller')} label="★" title="Best seller badge" />
                  <MiniToggle on={!!p.featured} onClick={() => toggle(p, 'featured')} label="Feat." title="Featured on homepage" />
                  <button onClick={() => setEditing({ ...p })} className="btn-ghost px-3 py-1.5 text-xs">Edit</button>
                  <button onClick={() => deleteProduct(p)} className="rounded-full border border-ink-600 px-3 py-1.5 text-xs text-ink-500 transition hover:border-ember-600 hover:text-ember-400">Delete</button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {tab === 'categories' && (
        <div className="mt-4 grid gap-2">
          {[...categories].sort((a, b) => a.sort_order - b.sort_order).map((c) => (
            <div key={c.id} className={`card flex flex-wrap items-center gap-3 p-3 ${!c.active ? 'opacity-55' : ''}`}>
              <div className="flex flex-col">
                <button onClick={() => moveCategory(c.id, -1)} className="text-ink-400 hover:text-gold-400" aria-label="Move up">▲</button>
                <button onClick={() => moveCategory(c.id, 1)} className="text-ink-400 hover:text-gold-400" aria-label="Move down">▼</button>
              </div>
              <div className="flex-1">
                <p className="font-medium">{c.name_en}{c.name_ar && <span className="ms-2 text-ink-400">{c.name_ar}</span>}</p>
                <p className="text-xs text-ink-500">{products.filter((p) => p.category_id === c.id).length} products · /{c.slug}</p>
              </div>
              <button
                onClick={async () => {
                  const nameAr = prompt('Arabic name:', c.name_ar) ?? c.name_ar;
                  const nameFr = prompt('French name:', c.name_fr) ?? c.name_fr;
                  if (await api('/api/categories', 'PATCH', { id: c.id, name_ar: nameAr, name_fr: nameFr })) {
                    setCategories((prev) => prev.map((x) => (x.id === c.id ? { ...x, name_ar: nameAr, name_fr: nameFr } : x)));
                  }
                }}
                className="btn-ghost px-3 py-1.5 text-xs"
              >
                Translate
              </button>
              <MiniToggle on={!!c.active} onClick={async () => {
                if (await api('/api/categories', 'PATCH', { id: c.id, active: !c.active })) {
                  setCategories((prev) => prev.map((x) => (x.id === c.id ? { ...x, active: c.active ? 0 : 1 } : x)));
                }
              }} label="On" title="Show category" />
              <button
                onClick={async () => {
                  if (!confirm(`Delete category "${c.name_en}" and ALL its products?`)) return;
                  if (await api(`/api/categories?id=${c.id}`, 'DELETE')) {
                    setCategories((prev) => prev.filter((x) => x.id !== c.id));
                    setProducts((prev) => prev.filter((p) => p.category_id !== c.id));
                  }
                }}
                className="rounded-full border border-ink-600 px-3 py-1.5 text-xs text-ink-500 hover:border-ember-600 hover:text-ember-400"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}

      {adding && <AddProductModal categories={categories} onClose={() => setAdding(false)} onSave={addProduct} />}
      {editing && (
        <EditProductModal
          product={editing}
          categories={categories}
          allExtras={allExtras}
          allProducts={products}
          selectedExtras={extrasMap[editing.id] || []}
          selectedRecs={recsMap[editing.id] || []}
          onClose={() => setEditing(null)}
          onSave={saveProduct}
          onUpload={uploadImage}
        />
      )}
    </div>
  );
}

function TabBtn({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button onClick={onClick} className={`rounded-full px-4 py-2 text-sm font-medium transition ${active ? 'bg-gold-500 text-ink-950' : 'border border-ink-600 text-ink-300 hover:border-gold-500'}`}>
      {label}
    </button>
  );
}

function MiniToggle({ on, onClick, label, warn, title }: { on: boolean; onClick: () => void; label: string; warn?: boolean; title: string }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold transition ${
        on
          ? warn ? 'border-ember-500 bg-ember-500/15 text-ember-400' : 'border-gold-500 bg-gold-500/15 text-gold-300'
          : 'border-ink-600 text-ink-500 hover:border-ink-500'
      }`}
    >
      {label}
    </button>
  );
}

function AddProductModal({ categories, onClose, onSave }: {
  categories: Category[]; onClose: () => void; onSave: (p: Partial<Product>) => void;
}) {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [categoryId, setCategoryId] = useState(categories[0]?.id || 0);
  const [description, setDescription] = useState('');
  return (
    <Modal onClose={onClose} title="Add product">
      <div className="grid gap-4">
        <div>
          <label className="label">Name *</label>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} maxLength={120} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Price (USD) *</label>
            <input className="input" type="number" min="0" step="0.05" value={price} onChange={(e) => setPrice(e.target.value)} />
          </div>
          <div>
            <label className="label">Category *</label>
            <select className="input" value={categoryId} onChange={(e) => setCategoryId(Number(e.target.value))}>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name_en}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="label">Description (optional)</label>
          <textarea className="input resize-none" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} maxLength={500} />
        </div>
        <button
          onClick={() => name.trim() && Number(price) >= 0 && onSave({ name: name.trim(), price_cents: Math.round(Number(price) * 100), category_id: categoryId, description })}
          className="btn-gold w-full"
        >
          Add product
        </button>
      </div>
    </Modal>
  );
}

function EditProductModal({ product, categories, allExtras, allProducts, selectedExtras, selectedRecs, onClose, onSave, onUpload }: {
  product: Product;
  categories: Category[];
  allExtras: Extra[];
  allProducts: Product[];
  selectedExtras: number[];
  selectedRecs: number[];
  onClose: () => void;
  onSave: (p: Product, extras: number[], recs: number[]) => void;
  onUpload: (p: Product, f: File) => void;
}) {
  const [p, setP] = useState(product);
  const [extraIds, setExtraIds] = useState<number[]>(selectedExtras);
  const [recIds, setRecIds] = useState<number[]>(selectedRecs);
  const set = (k: keyof Product, v: unknown) => setP((prev) => ({ ...prev, [k]: v }));

  return (
    <Modal onClose={onClose} title={`Edit: ${product.name}`}>
      <div className="grid max-h-[70vh] gap-4 overflow-y-auto pe-1">
        <div className="flex items-center gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={p.image || '/images/placeholders/burgers.svg'} alt="" className="h-20 w-20 rounded-xl object-cover" />
          <label className="btn-ghost cursor-pointer px-4 py-2 text-sm">
            Upload image
            <input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" className="hidden"
              onChange={(e) => e.target.files?.[0] && onUpload(p, e.target.files[0])} />
          </label>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div><label className="label">Name (EN) *</label><input className="input" value={p.name} onChange={(e) => set('name', e.target.value)} /></div>
          <div><label className="label">Name (AR)</label><input className="input" dir="rtl" value={p.name_ar} onChange={(e) => set('name_ar', e.target.value)} /></div>
          <div><label className="label">Name (FR)</label><input className="input" value={p.name_fr} onChange={(e) => set('name_fr', e.target.value)} /></div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Price (USD) *</label>
            <input className="input" type="number" min="0" step="0.05" value={(p.price_cents / 100).toString()} onChange={(e) => set('price_cents', Math.round(Number(e.target.value) * 100))} />
          </div>
          <div>
            <label className="label">Category</label>
            <select className="input" value={p.category_id} onChange={(e) => set('category_id', Number(e.target.value))}>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name_en}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="label">Description (EN)</label>
          <textarea className="input resize-none" rows={2} value={p.description} onChange={(e) => set('description', e.target.value)} maxLength={500} />
        </div>
        <div>
          <label className="label">Description (AR)</label>
          <textarea className="input resize-none" rows={2} dir="rtl" value={p.description_ar} onChange={(e) => set('description_ar', e.target.value)} maxLength={500} />
        </div>

        <fieldset>
          <legend className="label">Extras offered with this product</legend>
          <div className="grid grid-cols-2 gap-1.5">
            {allExtras.map((e) => (
              <label key={e.id} className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition ${extraIds.includes(e.id) ? 'border-gold-500 bg-gold-500/10' : 'border-ink-600'}`}>
                <input type="checkbox" className="accent-gold-500" checked={extraIds.includes(e.id)}
                  onChange={(ev) => setExtraIds((prev) => ev.target.checked ? [...prev, e.id] : prev.filter((x) => x !== e.id))} />
                {e.name} <span className="ms-auto text-xs text-ink-400">{formatMoney(e.price_cents)}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="label">Upsell recommendations (owner-controlled)</legend>
          <div className="grid max-h-40 grid-cols-2 gap-1.5 overflow-y-auto">
            {allProducts.filter((x) => x.id !== p.id).map((x) => (
              <label key={x.id} className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-1.5 text-xs transition ${recIds.includes(x.id) ? 'border-gold-500 bg-gold-500/10' : 'border-ink-600'}`}>
                <input type="checkbox" className="accent-gold-500" checked={recIds.includes(x.id)}
                  onChange={(ev) => setRecIds((prev) => ev.target.checked ? [...prev, x.id] : prev.filter((y) => y !== x.id))} />
                {x.name}
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="label">Cost breakdown (for profit analytics, USD)</legend>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {([
              ['cost_ingredients_cents', 'Ingredients'],
              ['cost_preparation_cents', 'Preparation'],
              ['cost_packaging_cents', 'Packaging'],
              ['cost_other_cents', 'Other'],
            ] as [keyof Product, string][]).map(([k, lbl]) => (
              <div key={k}>
                <label className="text-xs text-ink-400">{lbl}</label>
                <input className="input mt-1 py-2 text-sm" type="number" min="0" step="0.05"
                  value={((p[k] as number) / 100).toString()}
                  onChange={(e) => set(k, Math.round(Number(e.target.value) * 100))} />
              </div>
            ))}
          </div>
        </fieldset>

        <div className="flex gap-2">
          <button onClick={() => onSave(p, extraIds, recIds)} className="btn-gold flex-1">Save changes</button>
          <button onClick={onClose} className="btn-ghost">Cancel</button>
        </div>
      </div>
    </Modal>
  );
}

export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/80 p-4 backdrop-blur-sm animate-fadeIn" onClick={onClose}>
      <div className="card w-full max-w-2xl p-6 animate-slideUp" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold">{title}</h2>
          <button onClick={onClose} className="text-ink-400 hover:text-ink-100" aria-label="Close">✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}
