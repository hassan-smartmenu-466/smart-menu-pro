import type { Metadata } from 'next';
import AdvisorView from '@/components/admin/AdvisorView';

export const metadata: Metadata = { title: 'AI Advisor', robots: { index: false } };
export const dynamic = 'force-dynamic';

export default function AdminAdvisor() {
  return (
    <div>
      <h1 className="font-display text-2xl font-bold">AI Business Advisor</h1>
      <p className="mt-1 text-sm text-ink-400">
        Recommendations computed from your real sales data. Add OPENAI_API_KEY to your environment for natural-language summaries; the analysis engine works without it.
      </p>
      <AdvisorView />
    </div>
  );
}
