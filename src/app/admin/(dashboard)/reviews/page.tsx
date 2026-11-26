import type { Metadata } from 'next';
import ReviewsManager from '@/components/admin/ReviewsManager';

export const metadata: Metadata = { title: 'Reviews', robots: { index: false } };
export const dynamic = 'force-dynamic';

export default function AdminReviews() {
  return (
    <div>
      <h1 className="font-display text-2xl font-bold">Reviews</h1>
      <p className="mt-1 text-sm text-ink-400">Approve, reply, or feature reviews on the homepage. Nothing is published without your approval.</p>
      <ReviewsManager />
    </div>
  );
}
