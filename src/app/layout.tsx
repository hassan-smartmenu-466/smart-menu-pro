import type { Metadata, Viewport } from 'next';
import { Sora, Inter, Cairo } from 'next/font/google';
import '@/styles/globals.css';

const display = Sora({ subsets: ['latin'], variable: '--font-display', display: 'swap' });
const body = Inter({ subsets: ['latin'], variable: '--font-body', display: 'swap' });
const arabic = Cairo({ subsets: ['arabic', 'latin'], variable: '--font-arabic', display: 'swap' });

export const metadata: Metadata = {
  title: { default: 'SMART MENU PRO', template: '%s | SMART MENU PRO' },
  description: 'More Than a Menu. A Sales Machine. Premium restaurant digital menu and online ordering.',
};

export const viewport: Viewport = {
  themeColor: '#0a0a0c',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html suppressHydrationWarning className={`${display.variable} ${body.variable} ${arabic.variable}`}>
      <body>{children}</body>
    </html>
  );
}
