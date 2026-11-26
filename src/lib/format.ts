// Money is stored as integer cents everywhere.
export function cents(amount: number): number {
  return Math.round(amount * 100);
}

export function formatMoney(centsValue: number, symbol = '$'): string {
  const v = centsValue / 100;
  const str = v % 1 === 0 ? String(v) : v.toFixed(2);
  return `${symbol}${str}`;
}

export function formatMoneyAr(centsValue: number, symbol = '$'): string {
  const v = centsValue / 100;
  const str = v % 1 === 0 ? String(v) : v.toFixed(2);
  return `${str} ${symbol}`;
}
