import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "@/components/layout/app-shell";
import { AppProvider } from "@/context/app-context";

export const metadata: Metadata = {
  title: "SUBSYNC — Subscription Management & Billing Integrity Platform",
  description:
    "Intelligent subscription management platform featuring the Billing Integrity Guard, transparent Invoice Passport, and real-time Billing Simulator.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-sans antialiased bg-ivory text-charcoal">
        <AppProvider>
          <AppShell>{children}</AppShell>
        </AppProvider>
      </body>
    </html>
  );
}
