import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { isLang, getDict, type Lang } from '@/lib/i18n';
import { getPublicSettings } from '@/lib/settings';
import { listCategories, listProducts, activePromotions, homepageReviews, placeholderFor } from '@/lib/data';
import { formatMoney } from '@/lib/format';
import MenuBrowser from '@/components/MenuBrowser';
import ReviewsBlock from '@/components/ReviewsBlock';

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  const s = getPublicSettings();
  const name = s.restaurant_name || 'SMART MENU PRO';
  const base = process.env.NEXT_PUBLIC_BASE_URL || process.env.RENDER_EXTERNAL_URL || 'http://localhost:3000';
  return {
    title: `${name} - ${lang === 'ar' ? 'المنيو' : lang === 'fr' ? 'Menu' : 'Menu'}`,
    description: s.description || 'Premium digital menu and online ordering.',
    openGraph: {
      title: name,
      description: s.description || 'Order online',
      images: [`${base}/images/placeholders/og.svg`],
      locale: lang === 'ar' ? 'ar_LB' : lang === 'fr' ? 'fr_FR' : 'en_US',
    },
    alternates: { canonical: `${base}/${lang}` },
  };
}

export default async function HomePage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: raw } = await params;
  if (!isLang(raw)) notFound();
  const lang = raw as Lang;
  const dict = getDict(lang) as unknown as Record<string, string>;
  const s = getPublicSettings();
  const symbol = s.currency_symbol || '$';

  const cats = listCategories(true);
  const prods = listProducts(true);
  const promos = activePromotions();
  const reviews = homepageReviews();

  const browserCats = cats.map((c) => ({
    id: c.id, slug: c.slug,
    label: (lang === 'ar' && c.name_ar) ? c.name_ar : (lang === 'fr' && c.name_fr) ? c.name_fr : c.name_en,
  }));
  const browserProds = prods.map((p) => ({
    id: p.id,
    categorySlug: cats.find((c) => c.id === p.category_id)?.slug || '',
    name: (lang === 'ar' && p.name_ar) ? p.name_ar : (lang === 'fr' && p.name_fr) ? p.name_fr : p.name,
    description: (lang === 'ar' && p.description_ar) ? p.description_ar : (lang === 'fr' && p.description_fr) ? p.description_fr : p.description,
    priceCents: p.price_cents,
    image: p.image || placeholderFor(cats.find((c) => c.id === p.category_id)?.slug || 'burgers'),
    soldOut: !!p.sold_out,
    bestSeller: !!p.best_seller,
    isNew: !!p.is_new,
  }));
  const featured = browserProds.filter((p) => prods.find((x) => x.id === p.id)?.featured);
  const bestSellers = browserProds.filter((p) => p.bestSeller).slice(0, 8);
  const name = s.restaurant_name || 'SMART MENU PRO';
  const description = (lang === 'ar' && s.description_ar) ? s.description_ar : s.description || '';

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Restaurant',
    name,
    description: description || undefined,
    telephone: s.phone || undefined,
    address: s.address || undefined,
    openingHours: s.opening_hours || undefined,
    servesCuisine: 'Burgers',
    priceRange: '$',
    hasMenu: { '@type': 'Menu', hasMenuSection: browserCats.map((c) => ({ '@type': 'MenuSection', name: c.label })) },
  };

  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* HERO */}
      <section className="relative -mx-4 overflow-hidden px-4 pb-14 pt-16 sm:pt-24" style={{ backgroundImage: 'url(/images/placeholders/hero.svg)', backgroundSize: 'cover', backgroundPosition: 'center' }}>
        <div className="absolute inset-0 bg-gradient-to-b from-ink-950/40 via-ink-950/60 to-ink-950" />
        <div className="relative mx-auto max-w-2xl text-center animate-fadeUp">
          <p className="chip mx-auto bg-gold-500/15 text-gold-300 border border-gold-600/50">{s.tagline || 'More Than a Menu. A Sales Machine.'}</p>
          <h1 className="font-display mt-5 text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
            {name}
          </h1>
          {description && <p className="mx-auto mt-4 max-w-xl text-ink-300">{description}</p>}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <a href="#menu" className="btn-gold px-8 py-3.5 text-lg shadow-glow">{dict.order_now}</a>
            {s.whatsapp_number && (
              <a
                href={`https://wa.me/${String(s.whatsapp_number).replace(/[^0-9]/g, '')}?text=${encodeURIComponent(dict.order_via_whatsapp)}`}
                target="_blank" rel="noreferrer"
                className="btn-ghost border-[#25D366]/60 text-[#3ee07c] hover:border-[#25D366] hover:text-[#3ee07c]"
              >
                WhatsApp
              </a>
            )}
          </div>
        </div>
      </section>

      {/* SPECIAL OFFERS (real promotions only) */}
      {promos.length > 0 && (
        <section className="mt-4">
          <h2 className="font-display mb-4 text-2xl font-bold">{dict.special_offers}</h2>
          <div className="rail flex gap-4 overflow-x-auto pb-2">
            {promos.map((pr) => (
              <div key={String(pr.id)} className="card w-72 shrink-0 border-gold-600/40 bg-gradient-to-br from-ink-850 to-ink-800 p-5">
                <span className="chip bg-ember-500/15 text-ember-400 border border-ember-600/40">{dict.ends_soon}</span>
                <p className="font-display mt-3 text-lg font-bold">{String(pr.name)}</p>
                <p className="mt-1 text-sm text-gold-400">
                  {pr.type === 'percent' && `${Number(pr.percent)}% ${dict.off}`}
                  {pr.type === 'fixed' && `${formatMoney(Number(pr.amount_cents), symbol)} ${dict.off}`}
                  {pr.type === 'promo_code' && (
                    <>{Number(pr.percent) > 0 ? `${Number(pr.percent)}% ${dict.off}` : `${formatMoney(Number(pr.amount_cents), symbol)} ${dict.off}`} · {dict.promo_code}: <b dir="ltr">{String(pr.code)}</b></>
                  )}
                  {pr.type === 'combo' && `${dict.combo_deal}: ${formatMoney(Number(pr.combo_price_cents), symbol)}`}
                  {pr.type === 'product_offer' && `${Number(pr.percent)}% ${dict.off}`}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* FEATURED / BEST SELLERS */}
      {(featured.length > 0 || bestSellers.length > 0) && (
        <section className="mt-10">
          <h2 className="font-display mb-4 text-2xl font-bold">{featured.length > 0 ? dict.featured : dict.best_sellers}</h2>
          <div className="rail flex gap-4 overflow-x-auto pb-2">
            {(featured.length > 0 ? featured : bestSellers).map((p) => (
              <Link key={p.id} href={`/${lang}/product/${p.id}`} className="card w-56 shrink-0 overflow-hidden transition hover:border-gold-600">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.image} alt={p.name} loading="lazy" className="aspect-[4/3] w-full object-cover" />
                <div className="p-3">
                  <p className="truncate font-semibold">{p.name}</p>
                  <p className="font-display mt-1 font-bold text-gold-400">{formatMoney(p.priceCents, symbol)}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* MENU */}
      <section id="menu" className="mt-12 scroll-mt-20">
        <h2 className="font-display mb-5 text-2xl font-bold">{dict.our_menu}</h2>
        <MenuBrowser lang={lang} dict={dict} categories={browserCats} products={browserProds} currencySymbol={symbol} />
      </section>

      {/* REVIEWS */}
      <section className="mt-16">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-2xl font-bold">{dict.reviews_title}</h2>
          <Link href={`/${lang}/reviews`} className="text-sm text-gold-400 hover:underline">{dict.see_all_reviews}</Link>
        </div>
        <ReviewsBlock dict={dict} reviews={reviews as never} showForm={false} />
      </section>

      {/* INFO */}
      <section className="mt-16 grid gap-4 sm:grid-cols-3">
        <div className="card p-5">
          <h3 className="font-semibold text-gold-300">{dict.opening_hours}</h3>
          <p className="mt-2 text-sm text-ink-300">{s.opening_hours || dict.hours_tbc}</p>
        </div>
        <div className="card p-5">
          <h3 className="font-semibold text-gold-300">{dict.delivery_info}</h3>
          <p className="mt-2 text-sm text-ink-300">
            {(s.delivery_zones || []).length > 0
              ? (s.delivery_zones as { name: string; fee: number }[]).map((z) => `${z.name}: ${formatMoney(Math.round(z.fee * 100), symbol)}`).join(' · ')
              : dict.hours_tbc}
          </p>
        </div>
        <div className="card p-5">
          <h3 className="font-semibold text-gold-300">{dict.contact_us}</h3>
          <p className="mt-2 text-sm text-ink-300">
            {s.phone ? <a href={`tel:${s.phone}`} className="text-gold-400" dir="ltr">{s.phone}</a> : dict.hours_tbc}
          </p>
          {s.address && <p className="mt-1 text-sm text-ink-300">{s.address}</p>}
        </div>
      </section>
    </div>
  );
}
