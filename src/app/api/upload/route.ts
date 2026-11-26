import { NextRequest, NextResponse } from 'next/server';
import path from 'node:path';
import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import { requireAdmin } from '@/lib/api-guard';

const ALLOWED: Record<string, string> = {
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/webp': '.webp',
  'image/svg+xml': '.svg',
};
const MAX_BYTES = 5 * 1024 * 1024;

// Local file storage (./public/uploads). To move to hosted storage
// (Supabase Storage / S3), replace the write below; docs/DEPLOYMENT.md covers it.
export async function POST(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;
  const form = await req.formData().catch(() => null);
  if (!form) return NextResponse.json({ ok: false, error: 'bad_form' }, { status: 400 });
  const file = form.get('file');
  if (!(file instanceof File)) return NextResponse.json({ ok: false, error: 'no_file' }, { status: 400 });
  const ext = ALLOWED[file.type];
  if (!ext) return NextResponse.json({ ok: false, error: 'bad_type' }, { status: 400 });
  if (file.size > MAX_BYTES) return NextResponse.json({ ok: false, error: 'too_large' }, { status: 400 });
  const name = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`;
  const dir = path.join(process.cwd(), 'public', 'uploads');
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, name), Buffer.from(await file.arrayBuffer()));
  return NextResponse.json({ ok: true, url: `/uploads/${name}` });
}
