"use client";

import React from "react";
import Link from "next/link";
import { useApp } from "@/context/app-context";
import { formatINR } from "@/lib/utils";
import { StatCard } from "@/components/dashboard/stat-card";
import { IntegrityAlertBanner } from "@/components/dashboard/integrity-alert-banner";
import { RevenueChart } from "@/components/dashboard/revenue-chart";
import { UpcomingRenewalsCard } from "@/components/dashboard/upcoming-renewals-card";
import { RecentInvoicesTable } from "@/components/dashboard/recent-invoices-table";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  const {
    customers,
    subscriptions,
    invoices,
    integrityAlertsCount,
    resetToMockData,
  } = useApp();

  // Financial calculations
  const activeSubs = subscriptions.filter((s) => s.status === "Active");
  const currentMRR = activeSubs.reduce((acc, sub) => acc + sub.unitPrice * sub.seats, 0);
  const pendingInvoices = invoices.filter((i) => i.status === "Issued" || i.status === "Draft");
  const pendingAmount = pendingInvoices.reduce((acc, i) => acc + i.totalAmount, 0);

  // Billing Integrity Health Score
  const totalAudited = subscriptions.length;
  const healthScore =
    totalAudited > 0
      ? Math.round((integrityAlertsCount.passed / totalAudited) * 100)
      : 100;

  return (
    <div className="space-y-8">
      {/* Executive Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-gold-50 border border-gold-300 text-gold-900 text-xs font-semibold mb-1.5">
            <span>Billing Integrity Platform</span>
            <span>•</span>
            <span>Operational Suite</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-charcoal">
            Executive Financial Overview
          </h2>
          <p className="text-xs text-charcoal-soft mt-0.5">
            Real-time subscription metrics, pre-invoice integrity telemetry, and revenue monitoring
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={resetToMockData}
            title="Reset demo data to default baseline"
            className="px-3 py-1.5 rounded-lg border border-border bg-white text-xs font-medium text-charcoal-soft hover:text-charcoal hover:bg-surface-muted transition-colors flex items-center gap-1.5"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Reset Demo Data
          </button>

          <Link href="/billing-guard">
            <Button variant="gold" size="sm" className="shadow-xs">
              <svg className="w-3.5 h-3.5 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              Run Integrity Audit
            </Button>
          </Link>
        </div>
      </div>

      {/* Main Integrity Alert Banner */}
      <IntegrityAlertBanner
        criticalCount={integrityAlertsCount.critical}
        warningCount={integrityAlertsCount.warning}
        passedCount={integrityAlertsCount.passed}
      />

      {/* Primary KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Monthly Recurring Revenue"
          value={formatINR(currentMRR, { minimumFractionDigits: 0 })}
          subtext={`Annualized ARR: ${formatINR(currentMRR * 12, { minimumFractionDigits: 0 })}`}
          trend={{ value: "14.2% MoM", isPositive: true }}
          variant="gold"
          icon={
            <svg className="w-5 h-5 text-gold-800" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />

        <StatCard
          title="Active Subscriptions"
          value={`${activeSubs.length} / ${subscriptions.length}`}
          subtext={`${activeSubs.reduce((acc, s) => acc + s.seats, 0)} total provisioned seats`}
          trend={{ value: "2 pending", isPositive: false }}
          icon={
            <svg className="w-5 h-5 text-charcoal" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          }
        />

        <StatCard
          title="Total Customers"
          value={customers.length.toString()}
          subtext={`${customers.filter((c) => c.status === "Active").length} in good standing`}
          trend={{ value: "+1 this month", isPositive: true }}
          icon={
            <svg className="w-5 h-5 text-charcoal" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          }
        />

        <StatCard
          title="Integrity Health Score"
          value={`${healthScore}%`}
          subtext={`${integrityAlertsCount.critical} blocking errors detected`}
          variant={healthScore < 80 ? "critical" : "passed"}
          icon={
            <svg className="w-5 h-5 text-charcoal" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          }
        />
      </div>

      {/* Revenue Trajectory & Upcoming Renewals */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RevenueChart />
        </div>
        <div>
          <UpcomingRenewalsCard subscriptions={subscriptions} />
        </div>
      </div>

      {/* Recent Invoices Ledger & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recent Verified Invoices</CardTitle>
                <CardDescription>
                  Invoices generated following automated pre-billing integrity validation
                </CardDescription>
              </div>
              <Link href="/invoices">
                <Button variant="outline" size="sm">
                  View All ({invoices.length})
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="p-0">
              <RecentInvoicesTable invoices={invoices} />
            </CardContent>
          </Card>
        </div>

        {/* Quick Launch & Workflow Shortcuts */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Workflow Shortcuts</CardTitle>
              <CardDescription>Rapid access to key financial operations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2.5">
              <Link href="/customers" className="block">
                <div className="p-3 rounded-lg border border-border hover:border-gold hover:bg-surface-muted transition-all flex items-center justify-between text-xs group">
                  <div className="flex items-center gap-2.5">
                    <span className="p-1.5 rounded bg-ivory-200 text-charcoal">👥</span>
                    <span className="font-semibold text-charcoal">Customer Directory</span>
                  </div>
                  <span className="text-charcoal-soft group-hover:translate-x-0.5 transition-transform">→</span>
                </div>
              </Link>

              <Link href="/subscriptions" className="block">
                <div className="p-3 rounded-lg border border-border hover:border-gold hover:bg-surface-muted transition-all flex items-center justify-between text-xs group">
                  <div className="flex items-center gap-2.5">
                    <span className="p-1.5 rounded bg-ivory-200 text-charcoal">🔄</span>
                    <span className="font-semibold text-charcoal">Assign Subscriptions</span>
                  </div>
                  <span className="text-charcoal-soft group-hover:translate-x-0.5 transition-transform">→</span>
                </div>
              </Link>

              <Link href="/simulator" className="block">
                <div className="p-3 rounded-lg border border-border hover:border-gold hover:bg-surface-muted transition-all flex items-center justify-between text-xs group">
                  <div className="flex items-center gap-2.5">
                    <span className="p-1.5 rounded bg-ivory-200 text-charcoal">⚡</span>
                    <span className="font-semibold text-charcoal">Billing Simulator</span>
                  </div>
                  <span className="text-charcoal-soft group-hover:translate-x-0.5 transition-transform">→</span>
                </div>
              </Link>

              <Link href="/invoice-passport" className="block">
                <div className="p-3 rounded-lg border border-border hover:border-gold hover:bg-surface-muted transition-all flex items-center justify-between text-xs group">
                  <div className="flex items-center gap-2.5">
                    <span className="p-1.5 rounded bg-ivory-200 text-charcoal">🔍</span>
                    <span className="font-semibold text-charcoal">Invoice Passport Explainer</span>
                  </div>
                  <span className="text-charcoal-soft group-hover:translate-x-0.5 transition-transform">→</span>
                </div>
              </Link>
            </CardContent>
          </Card>

          {/* Pending Invoices Summary Card */}
          <Card className="bg-gradient-to-br from-white to-gold-50/30 border-gold-200">
            <CardContent className="p-5">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-semibold uppercase tracking-wider text-charcoal-soft">Uncollected Receivables</span>
                <span className="px-2 py-0.5 rounded bg-gold-200 text-gold-900 font-bold text-[10px]">
                  {pendingInvoices.length} Pending
                </span>
              </div>
              <h4 className="text-2xl font-bold font-mono text-charcoal">
                {formatINR(pendingAmount)}
              </h4>
              <p className="text-[11px] text-charcoal-muted mt-1 leading-relaxed">
                Awaiting payment settlement against issued invoices. Track records in the Payments ledger.
              </p>
              <div className="mt-3 pt-3 border-t border-gold-200/60">
                <Link href="/payments">
                  <Button variant="gold" size="sm" className="w-full">
                    View Payments Ledger
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
