import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api-guard';
import {
  averageOrderValue, bestSellingProducts, dailySeries, monthlySeries,
  popularHours, profitByProduct, repeatCustomers, revenueBetween, todayRange, totalCustomers,
} from '@/lib/analytics';

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  const { from, to } = todayRange();
  const today = revenueBetween(from, to);
  return NextResponse.json({
    today,
    aovCents: averageOrderValue(),
    totalCustomers: totalCustomers(),
    repeatCustomers: repeatCustomers(),
    daily: dailySeries(14),
    monthly: monthlySeries(12),
    bestSellers: bestSellingProducts(10),
    worstSellers: bestSellingProducts(10, true),
    popularHours: popularHours(),
    profit: profitByProduct(100),
  });
}
