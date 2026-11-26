'use client';
import { useEffect, useState } from 'react';

interface Report {
  hasData: boolean; orderCount: number; facts: string[]; recommendations: string[];
  llmSummary?: string; llmEnabled: boolean;
}

const SUGGESTED = [
  'Which products sell the most?',
  'Which products generate the highest profit?',
  'What are my busiest hours?',
  'How can I increase my average order value?',
  'Which products should I promote?',
  'What are my sales trends?',
];

export default function AdvisorView() {
  const [report, setReport] = useState<Report | null>(null);
  const [question, setQuestion] = useState('');
  const [busy, setBusy] = useState(false);

  async function load(q?: string) {
    setBusy(true);
    try {
      const res = q
        ? await fetch('/api/advisor', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ question: q }) })
        : await fetch('/api/advisor');
      if (res.ok) setReport(await res.json());
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => { load(); }, []);

  return (
    <div className="mt-5">
      <div className="flex flex-wrap gap-2">
        {SUGGESTED.map((q) => (
          <button key={q} onClick={() => { setQuestion(q); load(q); }} className="btn-ghost px-3 py-1.5 text-xs">{q}</button>
        ))}
      </div>
      <div className="mt-3 flex gap-2">
        <input className="input flex-1" placeholder="Ask about your business..." value={question} onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && load(question)} />
        <button onClick={() => load(question)} disabled={busy} className="btn-gold px-5">Ask</button>
      </div>

      {busy && <p className="mt-8 text-center text-ink-400 animate-pulseSoft">Analyzing your data...</p>}
      {!busy && report && (
        <div className="mt-6 grid gap-4 animate-fadeUp">
          {report.llmSummary && (
            <div className="card border-gold-600/50 p-5">
              <h2 className="font-semibold text-gold-300">Advisor briefing</h2>
              <p className="mt-2 whitespace-pre-wrap text-sm text-ink-200">{report.llmSummary}</p>
            </div>
          )}
          <div className="card p-5">
            <h2 className="font-semibold text-gold-300">The numbers</h2>
            <ul className="mt-3 list-disc space-y-1.5 ps-5 text-sm text-ink-200">
              {report.facts.map((f, i) => <li key={i}>{f}</li>)}
            </ul>
          </div>
          <div className="card p-5">
            <h2 className="font-semibold text-gold-300">Recommendations</h2>
            <ul className="mt-3 list-disc space-y-1.5 ps-5 text-sm text-ink-200">
              {report.recommendations.map((r, i) => <li key={i}>{r}</li>)}
            </ul>
          </div>
          {!report.llmEnabled && (
            <p className="text-xs text-ink-500">Natural-language summaries are off. Set OPENAI_API_KEY to enable them; the analysis above always works from your real data.</p>
          )}
        </div>
      )}
    </div>
  );
}
