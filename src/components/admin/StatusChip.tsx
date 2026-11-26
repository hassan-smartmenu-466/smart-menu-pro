export default function StatusChip({ status }: { status: string }) {
  const colors: Record<string, string> = {
    new: 'bg-ember-500/15 text-ember-400 border-ember-600',
    accepted: 'bg-blue-500/15 text-blue-300 border-blue-600',
    preparing: 'bg-gold-500/15 text-gold-300 border-gold-600',
    ready: 'bg-[#3d6b23]/25 text-[#9fce7a] border-[#3d6b23]',
    out_for_delivery: 'bg-purple-500/15 text-purple-300 border-purple-600',
    completed: 'bg-[#3d6b23]/25 text-[#9fce7a] border-[#3d6b23]',
    rejected: 'bg-ink-700 text-ink-300 border-ink-600',
    cancelled: 'bg-ink-700 text-ink-400 border-ink-600',
  };
  return <span className={`chip border ${colors[status] || 'bg-ink-700 text-ink-300 border-ink-600'}`}>{status.replace(/_/g, ' ')}</span>;
}
