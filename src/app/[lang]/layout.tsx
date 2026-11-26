import { notFound } from 'next/navigation';
import { isLang, getDict, dirOf, type Lang } from '@/lib/i18n';
import { getPublicSettings } from '@/lib/settings';
import { CartProvider } from '@/components/CartProvider';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SetHtmlAttrs from '@/components/SetHtmlAttrs';

export function generateStaticParams() {
  return [{ lang: 'en' }, { lang: 'ar' }, { lang: 'fr' }];
}

export default async function LangLayout({
  children, params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang: raw } = await params;
  if (!isLang(raw)) notFound();
  const lang = raw as Lang;
  const dict = getDict(lang) as unknown as Record<string, string>;
  const s = getPublicSettings();
  const settings = {
    restaurant_name: s.restaurant_name || '',
    logo: s.logo || '',
    languages_enabled: (s.languages_enabled as string[]) || ['en', 'ar'],
  };

  return (
    <CartProvider>
      <SetHtmlAttrs lang={lang} dir={dirOf(lang)} />
      <Header
        lang={lang}
        dict={dict}
        settings={settings}
        cartHref={`/${lang}/cart`}
        menuHref={`/${lang}#menu`}
        reviewsHref={`/${lang}/reviews`}
      />
      <main className="mx-auto min-h-[70vh] max-w-6xl px-4 pb-24">{children}</main>
      <Footer
        lang={lang}
        dict={dict}
        settings={{
          restaurant_name: s.restaurant_name || '',
          phone: s.phone || '',
          address: s.address || '',
          opening_hours: s.opening_hours || '',
          social_instagram: s.social_instagram || '',
          social_facebook: s.social_facebook || '',
          social_tiktok: s.social_tiktok || '',
        }}
      />
    </CartProvider>
  );
}
