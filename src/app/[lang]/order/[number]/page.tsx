import { notFound } from 'next/navigation';
import { isLang, getDict, type Lang } from '@/lib/i18n';
import { getPublicSettings } from '@/lib/settings';
import { getDb } from '@/lib/db';
import { buildWhatsAppMessage, whatsappLink } from '@/lib/whatsapp';
import OrderView from '@/components/OrderView';

export default async function OrderPage({ params }: { params: Promise<{ lang: string; number: string }> }) {
  const { lang: raw, number } = await params;
  if (!isLang(raw)) notFound();
  const lang = raw as Lang;
  const dict = getDict(lang) as unknown as Record<string, string>;
  const s = getPublicSettings();
  const symbol = s.currency_symbol || '$';

  const db = getDb();
  const order = db.prepare('SELECT * FROM orders WHERE order_number = ?').get(number) as Record<string, unknown> | undefined;
  if (!order) notFound();
  const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(Number(order.id)) as Record<string, unknown>[];

  const lines = items.map((i) => ({
    name: String(i.name),
    quantity: Number(i.quantity),
    unitPriceCents: Number(i.unit_price_cents),
    extras: (JSON.parse(String(i.extras || '[]')) as { name: string; priceCents: number }[]),
    instructions: String(i.instructions || ''),
    lineTotalCents: Number(i.line_total_cents),
  }));

  const message = buildWhatsAppMessage(
    {
      orderNumber: String(order.order_number),
      customerName: String(order.customer_name),
      phone: String(order.phone),
      fulfillment: String(order.fulfillment),
      address: String(order.address || ''),
      notes: String(order.notes || ''),
      paymentMethod: String(order.payment_method || ''),
      lines, subtotalCents: Number(order.subtotal_cents), discountCents: Number(order.discount_cents),
      deliveryFeeCents: Number(order.delivery_fee_cents), totalCents: Number(order.total_cents),
      tableNumber: String(order.table_number || ''),
    },
    s.restaurant_name || 'SMART MENU PRO',
    symbol
  );

  return (
    <div className="pt-10">
      <OrderView
        lang={lang}
        dict={dict}
        currencySymbol={symbol}
        restaurantName={s.restaurant_name || 'SMART MENU PRO'}
        order={{
          orderNumber: String(order.order_number),
          status: String(order.status),
          customerName: String(order.customer_name),
          phone: String(order.phone),
          fulfillment: String(order.fulfillment),
          address: String(order.address || ''),
          notes: String(order.notes || ''),
          paymentMethod: String(order.payment_method || ''),
          subtotalCents: Number(order.subtotal_cents),
          discountCents: Number(order.discount_cents),
          deliveryFeeCents: Number(order.delivery_fee_cents),
          totalCents: Number(order.total_cents),
          tableNumber: String(order.table_number || ''),
          createdAt: String(order.created_at),
          whatsappUrl: whatsappLink(message, s.whatsapp_number || ''),
          whatsappConfigured: !!s.whatsapp_number,
          lines,
        }}
      />
    </div>
  );
}
