// Lightweight SVG bar chart: no chart library, fully owned rendering.
export default function BarChart({ data, height = 180 }: { data: { label: string; value: number }[]; height?: number }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="flex items-end gap-1.5" style={{ height }} role="img" aria-label="Sales chart">
      {data.map((d, i) => (
        <div key={i} className="group flex flex-1 flex-col items-center justify-end gap-1 self-stretch">
          <span className="text-[10px] text-ink-500 opacity-0 transition group-hover:opacity-100">${d.value % 1 === 0 ? d.value : d.value.toFixed(2)}</span>
          <div
            className="w-full rounded-t-md bg-gradient-to-t from-gold-700 to-gold-400 transition-all group-hover:from-gold-600 group-hover:to-gold-300"
            style={{ height: `${Math.max(2, (d.value / max) * 78)}%` }}
          />
          <span className="w-full truncate text-center text-[9px] text-ink-500">{d.label}</span>
        </div>
      ))}
    </div>
  );
}
