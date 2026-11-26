import { notFound } from 'next/navigation';
import { isLang, getDict, type Lang } from '@/lib/i18n';
import { getPublicSettings } from '@/lib/settings';
import CartView from '@/components/CartView';

export default async function CartPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: raw } = await params;
  if (!isLang(raw)) notFound();
  const lang = raw as Lang;
  const dict = getDict(lang) as unknown as Record<string, string>;
  const s = getPublicSettings();
  return (
    <div className="mx-auto max-w-2xl pt-8">
      <CartView lang={lang} dict={dict} currencySymbol={s.currency_symbol || '$'} suggestionsEndpoint="/api/recommendations" />
    </div>
  );
}
