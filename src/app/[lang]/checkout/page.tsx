import { notFound } from 'next/navigation';
import { isLang, getDict, type Lang } from '@/lib/i18n';
import { getPublicSettings } from '@/lib/settings';
import CheckoutForm from '@/components/CheckoutForm';

export default async function CheckoutPage({
  params, searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ table?: string }>;
}) {
  const { lang: raw } = await params;
  const { table } = await searchParams;
  if (!isLang(raw)) notFound();
  const lang = raw as Lang;
  const dict = getDict(lang) as unknown as Record<string, string>;
  const s = getPublicSettings();
  return (
    <div className="pt-8">
      <CheckoutForm
        lang={lang}
        dict={dict}
        currencySymbol={s.currency_symbol || '$'}
        settings={{
          delivery_enabled: s.delivery_enabled !== false,
          pickup_enabled: s.pickup_enabled !== false,
          delivery_zones: (s.delivery_zones as { name: string; fee: number }[]) || [],
          default_delivery_fee: Number(s.default_delivery_fee || 0),
          payment_methods: (s.payment_methods as string[]) || ['cash_on_delivery', 'cash_at_pickup'],
        }}
        tableNumber={table || ''}
      />
    </div>
  );
}
