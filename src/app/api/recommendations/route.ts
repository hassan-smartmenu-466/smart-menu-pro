import { NextRequest, NextResponse } from 'next/server';
import { suggestionsFor } from '@/lib/recommendations';
import { getProduct, listCategories, placeholderFor } from '@/lib/data';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const ids = (url.searchParams.get('products') || '')
    .split(',').map((s) => Number(s)).filter((n) => Number.isInteger(n) && n > 0).slice(0, 30);
  const cats = listCategories(false);
  const suggestions = suggestionsFor(ids).map((s) => {
    const p = getProduct(s.id);
    const cat = p ? cats.find((c) => c.id === p.category_id) : undefined;
    return { id: s.id, name: s.name, priceCents: s.priceCents, image: p?.image || placeholderFor(cat?.slug || 'burgers'), reason: s.reason };
  });
  return NextResponse.json({ suggestions });
}
