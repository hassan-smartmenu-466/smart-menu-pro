import { formatMoney } from '@/lib/format';

export default function Money({ cents, symbol = '$', className = '' }: { cents: number; symbol?: string; className?: string }) {
  return <span className={className}>{formatMoney(cents, symbol)}</span>;
}
