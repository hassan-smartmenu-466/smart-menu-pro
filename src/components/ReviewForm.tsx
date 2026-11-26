'use client';
import { useState } from 'react';

export default function ReviewForm({ dict }: { dict: Record<string, string> }) {
  const [name, setName] = useState('');
  const [rating, setRating] = useState(5);
  const [text, setText] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');

  async function submit() {
    if (!name.trim() || state === 'sending') return;
    setState('sending');
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerName: name.trim(), rating, text: text.trim() }),
      });
      setState(res.ok ? 'done' : 'error');
    } catch {
      setState('error');
    }
  }

  if (state === 'done') {
    return <p className="card mt-4 p-5 text-center text-gold-300 animate-fadeIn">{dict.review_thanks}</p>;
  }

  return (
    <div className="card mt-4 p-5">
      <label className="label">{dict.your_rating}</label>
      <div className="flex gap-1" role="radiogroup" aria-label={dict.your_rating}>
        {[1, 2, 3, 4, 5].map((r) => (
          <button
            key={r}
            onClick={() => setRating(r)}
            className={`text-2xl transition ${r <= rating ? 'text-gold-400' : 'text-ink-600 hover:text-ink-400'}`}
            aria-label={`${r}`}
          >
            ★
          </button>
        ))}
      </div>
      <div className="mt-4 grid gap-3">
        <input className="input" placeholder={dict.full_name} value={name} onChange={(e) => setName(e.target.value)} maxLength={60} />
        <textarea className="input resize-none" rows={3} placeholder={dict.your_review} value={text} onChange={(e) => setText(e.target.value)} maxLength={600} />
      </div>
      <button onClick={submit} disabled={state === 'sending' || !name.trim()} className="btn-gold mt-4">
        {dict.submit_review}
      </button>
      {state === 'error' && <p className="mt-2 text-sm text-ember-400">{dict.order_failed}</p>}
    </div>
  );
}
