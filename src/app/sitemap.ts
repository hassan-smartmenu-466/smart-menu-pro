import type { MetadataRoute } from 'next';
import { listCategories, listProducts } from '@/lib/data';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_BASE_URL || process.env.RENDER_EXTERNAL_URL || 'http://localhost:3000';
  const langs = ['en', 'ar'];
  const urls: MetadataRoute.Sitemap = [];
  for (const lang of langs) {
    urls.push({ url: `${base}/${lang}`, changeFrequency: 'daily', priority: 1 });
    urls.push({ url: `${base}/${lang}/reviews`, changeFrequency: 'weekly', priority: 0.4 });
    for (const p of listProducts(true)) {
      urls.push({ url: `${base}/${lang}/product/${p.id}`, changeFrequency: 'weekly', priority: 0.7 });
    }
  }
  void listCategories;
  return urls;
}
