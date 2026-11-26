import type { Metadata } from 'next';
import LoginForm from '@/components/admin/LoginForm';

export const metadata: Metadata = { title: 'Admin login', robots: { index: false } };

export default function AdminLogin() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-950 px-4">
      <div className="card w-full max-w-sm p-8 animate-fadeUp">
        <div className="text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/placeholders/logo.svg" alt="" className="mx-auto h-14 w-14" />
          <h1 className="font-display mt-4 text-xl font-bold">SMART MENU PRO</h1>
          <p className="mt-1 text-sm text-ink-400">Restaurant dashboard</p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
