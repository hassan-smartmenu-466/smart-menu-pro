import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { isLang, getDict, type Lang } from '@/lib/i18n';
import { getPublicSettings } from '@/lib/settings';
import { getProduct, productExtras, listCategories, placeholderFor } from '@/lib/data';
import { suggestionsFor } from '@/lib/recommendations';
import ProductDetails from '@/components/ProductDetails';

export async function generateMetadata({ params }: { params: Promise<{ lang: string; id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const p = getProduct(Number(id));
  if (!p) return {};
  return { title: p.name, description: p.description || `${p.name}` };
}

export default async function ProductPage({ params }: { params: Promise<{ lang: string; id: string }> }) {
  const { lang: raw, id } = await params;
  if (!isLang(raw)) notFound();
  const lang = raw as Lang;
  const p = getProduct(Number(id));
  if (!p || !p.available) notFound();
  const dict = getDict(lang) as unknown as Record<string, string>;
  const s = getPublicSettings();
  const symbol = s.currency_symbol || '$';
  const cats = listCategories(false);
  const cat = cats.find((c) => c.id === p.category_id);

  const extras = productExtras(p.id).map((e) => ({
    id: e.id,
    name: (lang === 'ar' && e.name_ar) ? e.name_ar : e.name,
    priceCents: e.price_cents,
  }));

  const suggestions = suggestionsFor([p.id]).map((sg) => {
    const sp = getProduct(sg.id);
    const scat = sp ? cats.find((c) => c.id === sp.category_id) : undefined;
    return {
      id: sg.id,
      name: (lang === 'ar' && sp?.name_ar) ? sp!.name_ar : sg.name,
      priceCents: sg.priceCents,
      image: sp?.image || placeholderFor(scat?.slug || 'burgers'),
    };
  });

  return (
    <div className="mx-auto max-w-3xl pt-6">
      <Link href={`/${lang}#menu`} className="text-sm text-ink-400 transition hover:text-gold-400">← {dict.back}</Link>
      <div className="mt-4">
        <ProductDetails
          lang={lang}
          dict={dict}
          product={{
            id: p.id,
            name: (lang === 'ar' && p.name_ar) ? p.name_ar : (lang === 'fr' && p.name_fr) ? p.name_fr : p.name,
            description: (lang === 'ar' && p.description_ar) ? p.description_ar : (lang === 'fr' && p.description_fr) ? p.description_fr : p.description,
            priceCents: p.price_cents,
            image: p.image || placeholderFor(cat?.slug || 'burgers'),
            soldOut: !!p.sold_out,
          }}
          extras={extras}
          suggestions={suggestions}
          currencySymbol={symbol}
        />
      </div>
    </div>
  );
}
