'use client';
import { useEffect, useState } from 'react';

interface Review {
  id: number; customer_name: string; rating: number; text: string;
  status: string; owner_reply: string; show_on_homepage: number; created_at: string;
}

export default function ReviewsManager() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [replyFor, setReplyFor] = useState<number | null>(null);
  const [replyText, setReplyText] = useState('');

  async function load() {
    const res = await fetch('/api/reviews');
    if (res.ok) setReviews((await res.json()).reviews);
  }
  useEffect(() => { load(); }, []);

  async function patch(id: number, body: Record<string, unknown>) {
    await fetch(`/api/reviews/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    load();
  }

  async function remove(id: number) {
    if (!confirm('Delete this review permanently?')) return;
    await fetch(`/api/reviews/${id}`, { method: 'DELETE' });
    load();
  }

  const pending = reviews.filter((r) => r.status === 'pending');

  return (
    <div className="mt-5 grid gap-3">
      {reviews.length === 0 && <p className="card p-8 text-center text-ink-400">No reviews yet.</p>}
      {pending.length > 0 && <p className="chip w-fit bg-ember-500/15 text-ember-400 border border-ember-600">{pending.length} awaiting moderation</p>}
      {reviews.map((r) => (
        <div key={r.id} className="card p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="font-medium">{r.customer_name}</span>
              <span className="ms-2 text-gold-400">{'★'.repeat(r.rating)}<span className="text-ink-600">{'★'.repeat(5 - r.rating)}</span></span>
            </div>
            <span className={`chip border ${r.status === 'approved' ? 'border-[#3d6b23] bg-[#3d6b23]/25 text-[#9fce7a]' : r.status === 'rejected' ? 'border-ink-600 bg-ink-700 text-ink-400' : 'border-gold-600 bg-gold-500/15 text-gold-300'}`}>
              {r.status}
            </span>
          </div>
          {r.text && <p className="mt-2 text-sm text-ink-300">{r.text}</p>}
          {r.owner_reply && <p className="mt-2 rounded-lg border-s-2 border-gold-500 bg-ink-800 p-2 text-xs text-ink-300">{r.owner_reply}</p>}
          <div className="mt-3 flex flex-wrap gap-2">
            {r.status !== 'approved' && <button onClick={() => patch(r.id, { status: 'approved' })} className="btn-gold px-3 py-1.5 text-xs">Approve</button>}
            {r.status !== 'rejected' && <button onClick={() => patch(r.id, { status: 'rejected' })} className="btn-ghost px-3 py-1.5 text-xs">Reject</button>}
            {r.status === 'approved' && (
              <button onClick={() => patch(r.id, { show_on_homepage: !r.show_on_homepage })} className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${r.show_on_homepage ? 'border-gold-500 bg-gold-500/15 text-gold-300' : 'border-ink-600 text-ink-400'}`}>
                {r.show_on_homepage ? 'On homepage ✓' : 'Show on homepage'}
              </button>
            )}
            <button onClick={() => { setReplyFor(r.id); setReplyText(r.owner_reply); }} className="btn-ghost px-3 py-1.5 text-xs">Reply</button>
            <button onClick={() => remove(r.id)} className="rounded-full border border-ink-600 px-3 py-1.5 text-xs text-ink-500 hover:border-ember-600 hover:text-ember-400">Delete</button>
          </div>
          {replyFor === r.id && (
            <div className="mt-3 flex gap-2">
              <input className="input flex-1 py-2 text-sm" placeholder="Your reply..." value={replyText} onChange={(e) => setReplyText(e.target.value)} maxLength={600} />
              <button onClick={() => { patch(r.id, { owner_reply: replyText }); setReplyFor(null); }} className="btn-gold px-4 py-2 text-sm">Save</button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
