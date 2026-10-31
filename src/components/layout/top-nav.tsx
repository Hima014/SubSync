"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";

const pageTitles: Record<string, { title: string; category: string }> = {
  "/": { title: "Executive Dashboard", category: "Overview" },
  "/customers": { title: "Customer Ledger", category: "Directory" },
  "/plans": { title: "Subscription Plans", category: "Catalog" },
  "/subscriptions": { title: "Active Subscriptions", category: "Management" },
  "/billing-engine": { title: "Billing Engine", category: "Calculations" },
  "/billing-guard": { title: "Billing Integrity Guard", category: "Audit & Compliance" },
  "/simulator": { title: "Billing Simulator", category: "Sandbox" },
  "/invoices": { title: "Generated Invoices", category: "Receivables" },
  "/invoice-passport": { title: "Invoice Passport", category: "Explainability" },
  "/payments": { title: "Payment Ledger", category: "Settlements" },
  "/settings": { title: "System Settings", category: "Configuration" },
};

export function TopNav({ onMenuClick }: { onMenuClick?: () => void }) {
  const pathname = usePathname();
  const pageInfo = pageTitles[pathname] || { title: "SUBSYNC", category: "Platform" };

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/90 backdrop-blur-md border-b border-border px-4 lg:px-8 flex items-center justify-between">
      {/* Left: Mobile trigger & breadcrumbs */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-lg text-charcoal-muted hover:text-charcoal hover:bg-surface-muted transition-colors"
          aria-label="Open navigation menu"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <div>
          <div className="flex items-center gap-1.5 text-[11px] text-charcoal-soft font-medium">
            <span>SUBSYNC</span>
            <span>/</span>
            <span className="text-gold-800">{pageInfo.category}</span>
          </div>
          <h1 className="text-sm lg:text-base font-semibold text-charcoal tracking-tight">
            {pageInfo.title}
          </h1>
        </div>
      </div>

      {/* Right: Guard ticker, currency pill, and CTA */}
      <div className="flex items-center gap-3">
        {/* Guard Health Pill */}
        <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-full bg-ivory-200 border border-border text-[11px] font-medium text-charcoal">
          <span className="inline-block w-2 h-2 rounded-full bg-integrity-passed" />
          <span>Guard Active</span>
          <span className="text-charcoal-soft font-mono">v1.0</span>
        </div>

        {/* Currency Tag */}
        <div className="hidden md:flex items-center px-2 py-1 rounded-md bg-surface-muted border border-border text-[11px] font-mono text-charcoal font-semibold">
          ₹ INR
        </div>

        {/* Fast Action */}
        <Link href="/billing-guard">
          <Button variant="gold" size="sm" className="hidden sm:inline-flex shadow-xs">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            Audit Guard
          </Button>
        </Link>
      </div>
    </header>
  );
}

