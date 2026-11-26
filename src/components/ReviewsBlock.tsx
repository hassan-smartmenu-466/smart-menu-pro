import ReviewForm from './ReviewForm';

export interface ReviewRow {
  id: number; customer_name: string; rating: number; text: string;
  owner_reply: string; created_at: string;
}

// Only real, owner-approved reviews render here. No fake reviews, ever.
export default function ReviewsBlock({ dict, reviews, showForm = true }: {
  dict: Record<string, string>;
  reviews: ReviewRow[];
  showForm?: boolean;
}) {
  return (
    <section>
      {reviews.length === 0 ? (
        <p className="text-ink-400">{dict.no_reviews}</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {reviews.map((r) => (
            <figure key={r.id} className="card p-5 animate-fadeUp">
              <div className="flex items-center justify-between">
                <figcaption className="font-semibold">{r.customer_name}</figcaption>
                <span className="text-gold-400" aria-label={`${r.rating}/5`}>
                  {'★'.repeat(r.rating)}<span className="text-ink-600">{'★'.repeat(5 - r.rating)}</span>
                </span>
              </div>
              {r.text && <blockquote className="mt-2 text-sm text-ink-300">{r.text}</blockquote>}
              {r.owner_reply && (
                <p className="mt-3 rounded-lg border-s-2 border-gold-500 bg-ink-800 p-2.5 text-xs text-ink-300">
                  <span className="font-semibold text-gold-300">{dict.owner_response}: </span>
                  {r.owner_reply}
                </p>
              )}
            </figure>
          ))}
        </div>
      )}
      {showForm && (
        <div className="mt-8">
          <h3 className="font-display text-lg font-bold">{dict.leave_review}</h3>
          <ReviewForm dict={dict} />
        </div>
      )}
    </section>
  );
}
