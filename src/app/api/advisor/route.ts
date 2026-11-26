import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/api-guard';
import { buildAdvisorReport, llmSummary } from '@/lib/advisor';

export async function GET() {
  const denied = await requireAdmin();
  if (denied) return denied;
  const report = buildAdvisorReport();
  const summary = await llmSummary(report);
  return NextResponse.json({ ...report, llmSummary: summary, llmEnabled: !!process.env.OPENAI_API_KEY });
}

export async function POST(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const body = await req.json().catch(() => ({}));
  const report = buildAdvisorReport(String(body.question || ''));
  const summary = await llmSummary(report);
  return NextResponse.json({ ...report, llmSummary: summary, llmEnabled: !!process.env.OPENAI_API_KEY });
}
