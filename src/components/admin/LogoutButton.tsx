'use client';
import { useRouter } from 'next/navigation';

export default function LogoutButton() {
  const router = useRouter();
  return (
    <button
      onClick={async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        router.push('/admin/login');
        router.refresh();
      }}
      className="flex items-center gap-2.5 whitespace-nowrap rounded-xl px-3.5 py-2.5 text-start text-sm text-ink-400 transition hover:bg-ink-800 hover:text-ember-400"
    >
      <span>🚪</span>Sign out
    </button>
  );
}
