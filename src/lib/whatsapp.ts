// Builds the WhatsApp order message and a wa.me deep link.
// The restaurant's WhatsApp number comes from Settings, never fabricated:
// if it is not configured we return a share link with no recipient, so the
// customer picks a contact, and the admin UI flags that setup is needed.
export interface WhatsAppOrderData {
  orderNumber: string;
  customerName: string;
  phone: string;
  fulfillment: string;
  address: string;
  notes: string;
  paymentMethod: string;
  lines: { name: string; quantity: number; unitPriceCents: number; extras: { name: string; priceCents: number }[]; instructions: string; lineTotalCents: number }[];
  subtotalCents: number;
  discountCents: number;
  deliveryFeeCents: number;
  totalCents: number;
  tableNumber: string;
}

function money(c: number, symbol: string): string {
  const v = c / 100;
  return `${symbol}${v % 1 === 0 ? v : v.toFixed(2)}`;
}

export function buildWhatsAppMessage(o: WhatsAppOrderData, restaurantName: string, symbol = '$'): string {
  const lines: string[] = [];
  lines.push(`*${restaurantName || 'SMART MENU PRO'}*`);
  lines.push(`Order: ${o.orderNumber}`);
  if (o.tableNumber) lines.push(`Table: ${o.tableNumber}`);
  lines.push('-------------------');
  for (const l of o.lines) {
    lines.push(`${l.quantity}x ${l.name} - ${money(l.lineTotalCents, symbol)}`);
    for (const e of l.extras) lines.push(`   + ${e.name} (${money(e.priceCents, symbol)})`);
    if (l.instructions) lines.push(`   Note: ${l.instructions}`);
  }
  lines.push('-------------------');
  lines.push(`Subtotal: ${money(o.subtotalCents, symbol)}`);
  if (o.discountCents > 0) lines.push(`Discount: -${money(o.discountCents, symbol)}`);
  if (o.fulfillment === 'delivery') lines.push(`Delivery fee: ${money(o.deliveryFeeCents, symbol)}`);
  lines.push(`*Total: ${money(o.totalCents, symbol)}*`);
  lines.push('-------------------');
  lines.push(`Name: ${o.customerName}`);
  lines.push(`Phone: ${o.phone}`);
  lines.push(o.fulfillment === 'delivery' ? `Delivery to: ${o.address}` : 'Pickup');
  if (o.notes) lines.push(`Notes: ${o.notes}`);
  if (o.paymentMethod) lines.push(`Payment: ${o.paymentMethod.replace(/_/g, ' ')}`);
  return lines.join('\n');
}

export function whatsappLink(message: string, whatsappNumber: string): string {
  const encoded = encodeURIComponent(message);
  const digits = (whatsappNumber || '').replace(/[^0-9]/g, '');
  if (!digits) return `https://wa.me/?text=${encoded}`;
  return `https://wa.me/${digits}?text=${encoded}`;
}
