import type { Metadata } from 'next';
import './globals.css';
import { ToastProvider } from '@/components/ToastProvider';
import { AppShell } from '@/components/AppShell';

export const metadata: Metadata = {
  title: 'SUBSYNC — Every Subscription in Sync. Every Billing Action Protected.',
  description:
    'Subscription and Billing Management Platform with built-in Billing Integrity Guard and What-If Simulator.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-[#070b12] text-slate-100 antialiased selection:bg-emerald-500/30 selection:text-emerald-200">
        <ToastProvider>
          <AppShell>{children}</AppShell>
        </ToastProvider>
      </body>
    </html>
  );
}

