import { notFound } from 'next/navigation';
import { isLang, getDict, type Lang } from '@/lib/i18n';
import { getDb } from '@/lib/db';
import ReviewsBlock, { type ReviewRow } from '@/components/ReviewsBlock';

export default async function ReviewsPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang: raw } = await params;
  if (!isLang(raw)) notFound();
  const lang = raw as Lang;
  const dict = getDict(lang) as unknown as Record<string, string>;
  const reviews = getDb().prepare(
    "SELECT * FROM reviews WHERE status = 'approved' ORDER BY id DESC LIMIT 50"
  ).all() as unknown as ReviewRow[];
  return (
    <div className="mx-auto max-w-3xl pt-8">
      <h1 className="font-display text-2xl font-bold">{dict.reviews}</h1>
      <div className="mt-6">
        <ReviewsBlock dict={dict} reviews={reviews} showForm />
      </div>
    </div>
  );
}
