import { redirect } from 'next/navigation';
import { getPublicSettings } from '@/lib/settings';
import { isLang } from '@/lib/i18n';

export default function Index() {
  const s = getPublicSettings();
  const def = isLang(String(s.language_default || 'en')) ? String(s.language_default) : 'en';
  redirect(`/${def}`);
}
