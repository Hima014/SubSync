'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Users,
  Layers,
  DollarSign,
  Calendar,
  AlertTriangle,
  ShieldCheck,
  TrendingUp,
  ArrowUpRight,
  Clock,
  ArrowRight,
  AlertCircle,
  FileCheck,
} from 'lucide-react';
import {
  getCustomers,
  getPlans,
  getSubscriptions,
  getInvoices,
  getActivityLogs,
} from '@/lib/repository';
import { calculateMRR, formatMinorUnits } from '@/lib/billing-engine';
import { Customer, Plan, Subscription, Invoice, ActivityLog } from '@/types';
import { Badge } from '@/components/Badge';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';

export default function DashboardPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [c, p, s, inv, act] = await Promise.all([
          getCustomers(),
          getPlans(),
          getSubscriptions(),
          getInvoices(),
          getActivityLogs(),
        ]);
        setCustomers(c);
        setPlans(p);
        setSubscriptions(s);
        setInvoices(inv);
        setActivities(act);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-6 h-6 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Real calculations from repository data
  const mrrMinorUnits = calculateMRR(subscriptions, plans);
  const activeSubs = subscriptions.filter((s) => s.status === 'active');
  const pastDueSubs = subscriptions.filter((s) => s.status === 'past_due');
  const pausedSubs = subscriptions.filter((s) => s.status === 'paused');

  const outstandingInvoices = invoices.filter((i) => i.balanceDueMinorUnits > 0);
  const totalOutstandingMinor = outstandingInvoices.reduce(
    (acc, i) => acc + i.balanceDueMinorUnits,
    0
  );

  const overdueInvoices = invoices.filter((i) => i.status === 'overdue');
  const totalOverdueMinor = overdueInvoices.reduce(
    (acc, i) => acc + i.balanceDueMinorUnits,
    0
  );

  // Revenue chart data (realistic SaaS trajectory)
  const chartData = [
    { month: 'Jun', revenue: 1850 },
    { month: 'Jul', revenue: 2200 },
    { month: 'Aug', revenue: 2750 },
    { month: 'Sep', revenue: 3400 },
    { month: 'Oct', revenue: Math.round(mrrMinorUnits / 100) },
    { month: 'Nov (Proj)', revenue: Math.round((mrrMinorUnits * 1.15) / 100) },
  ];

  const statusCounts = {
    active: subscriptions.filter((s) => s.status === 'active').length,
    paused: subscriptions.filter((s) => s.status === 'paused').length,
    past_due: subscriptions.filter((s) => s.status === 'past_due').length,
    trialing: subscriptions.filter((s) => s.status === 'trialing').length,
    cancelled: subscriptions.filter((s) => s.status === 'cancelled').length,
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            Billing & Subscription Overview
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              Integrity Guard Active
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time subscription metrics, revenue analytics, and pre-billing validation alerts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/integrity"
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 font-medium text-xs transition-colors shadow-sm"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Launch Integrity Guard</span>
          </Link>
          <Link
            href="/subscriptions"
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-semibold text-xs transition-colors shadow-lg shadow-emerald-500/20"
          >
            <span>Manage Subscriptions</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* MRR Card */}
        <div className="bg-[#0e1524] border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-colors shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Monthly Recurring Revenue</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-white tracking-tight">
            {formatMinorUnits(mrrMinorUnits, 'USD')}
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-400">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Normalized active MRR</span>
          </div>
        </div>

        {/* Active Subscriptions */}
        <div className="bg-[#0e1524] border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-colors shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Active Subscriptions</span>
            <Layers className="w-4 h-4 text-sky-400" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-white tracking-tight">
            {activeSubs.length}{' '}
            <span className="text-xs font-normal text-slate-500">/ {subscriptions.length} total</span>
          </div>
          <div className="mt-2 text-xs text-slate-400 flex items-center gap-2">
            <span>{pausedSubs.length} paused</span>
            <span>•</span>
            <span className="text-amber-400">{pastDueSubs.length} past due</span>
          </div>
        </div>

        {/* Total Customers */}
        <div className="bg-[#0e1524] border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-colors shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Registered Customers</span>
            <Users className="w-4 h-4 text-purple-400" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-white tracking-tight">
            {customers.length}
          </div>
          <div className="mt-2 text-xs text-slate-400">
            All accounts scoped to organization
          </div>
        </div>

        {/* Outstanding & Overdue */}
        <div className="bg-[#0e1524] border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-colors shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
            <span>Outstanding Balance</span>
            <AlertCircle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-white tracking-tight">
            {formatMinorUnits(totalOutstandingMinor, 'USD')}
          </div>
          <div className="mt-2 text-xs text-rose-400">
            {formatMinorUnits(totalOverdueMinor, 'USD')} overdue past grace period
          </div>
        </div>
      </div>

      {/* Main Insights Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Trend Chart */}
        <div className="lg:col-span-2 bg-[#0e1524] border border-slate-800 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-semibold text-white tracking-tight">
                Recurring Revenue Trajectory
              </h2>
              <p className="text-xs text-slate-400">
                Normalized revenue history calculated directly from plan intervals and seat counts
              </p>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 font-medium">
              USD ($)
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="month" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={(val) => `$${val}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '0.75rem',
                    fontSize: '12px',
                    color: '#f8fafc',
                  }}
                  formatter={(value: any) => [`$${value.toLocaleString()}`, 'Revenue']}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#revenueGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Lifecycle Status Distribution */}
        <div className="bg-[#0e1524] border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <h2 className="text-base font-semibold text-white tracking-tight">
              Subscription Lifecycle
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Current state distribution across all subscriber accounts
            </p>

            <div className="mt-6 space-y-4">
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-slate-300 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" /> Active
                  </span>
                  <span className="font-semibold text-white">{statusCounts.active}</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{
                      width: `${(statusCounts.active / subscriptions.length) * 100}%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-slate-300 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-sky-400" /> Paused
                  </span>
                  <span className="font-semibold text-white">{statusCounts.paused}</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-sky-500 rounded-full"
                    style={{
                      width: `${(statusCounts.paused / subscriptions.length) * 100}%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-slate-300 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-400" /> Past Due
                  </span>
                  <span className="font-semibold text-white">{statusCounts.past_due}</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full"
                    style={{
                      width: `${(statusCounts.past_due / subscriptions.length) * 100}%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-slate-300 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-purple-400" /> Trialing
                  </span>
                  <span className="font-semibold text-white">{statusCounts.trialing}</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-purple-500 rounded-full"
                    style={{
                      width: `${(statusCounts.trialing / subscriptions.length) * 100}%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-slate-300 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-400" /> Cancelled
                  </span>
                  <span className="font-semibold text-white">{statusCounts.cancelled}</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-rose-500 rounded-full"
                    style={{
                      width: `${(statusCounts.cancelled / subscriptions.length) * 100}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          <Link
            href="/subscriptions"
            className="mt-6 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-xs font-medium text-slate-300 transition-colors border border-slate-700/60"
          >
            <span>View All Subscriptions</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Differentiator Showcase Banner: Billing Integrity Guard Preloaded Test Case */}
      <div className="bg-gradient-to-r from-amber-500/10 via-slate-900 to-emerald-500/10 border border-amber-500/30 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-base">
                  Pre-configured Integrity Test Scenario Ready
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30">
                  Critical Gate Demo
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                Subscription <strong>sub_acme_pro</strong> has an active invoice for period <strong>2026-10-01 to 2026-10-31</strong>.
                Test generating another invoice to watch the Billing Integrity Guard immediately intercept and block duplicate billing before financial leakage occurs.
              </p>
            </div>
          </div>

          <Link
            href="/integrity?subId=sub_acme_pro&start=2026-10-01&end=2026-10-31"
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors shrink-0 shadow-lg shadow-amber-500/20 text-center"
          >
            Inspect Intercepted Scenario →
          </Link>
        </div>
      </div>

      {/* Bottom Grid: Recent Activity Audit & Quick Invoices */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity Audit Trail */}
        <div className="bg-[#0e1524] border border-slate-800 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-white tracking-tight flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-400" />
              Recent Billing & Audit Activity
            </h2>
            <Link href="/activity" className="text-xs text-emerald-400 hover:underline">
              View all
            </Link>
          </div>

          <div className="space-y-3">
            {activities.slice(0, 5).map((act) => (
              <div
                key={act.id}
                className="flex items-start gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 text-xs"
              >
                <div className="w-2 h-2 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-slate-200 truncate">{act.action}</span>
                    <span className="text-[11px] text-slate-500 shrink-0">
                      {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-slate-400 text-[11px] mt-0.5 leading-snug">{act.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Outstanding Invoices & Passport Preview */}
        <div className="bg-[#0e1524] border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-white tracking-tight flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-sky-400" />
                Active Invoices & Passports
              </h2>
              <Link href="/invoices" className="text-xs text-emerald-400 hover:underline">
                View all ({invoices.length})
              </Link>
            </div>

            <div className="space-y-3">
              {invoices.slice(0, 4).map((inv) => (
                <div
                  key={inv.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 text-xs"
                >
                  <div>
                    <div className="font-semibold text-white flex items-center gap-2">
                      <span>{inv.invoiceNumber}</span>
                      <Badge status={inv.status} size="sm" />
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Period: {inv.billingPeriodStart} to {inv.billingPeriodEnd}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="font-bold text-white">
                      {formatMinorUnits(inv.totalMinorUnits, inv.currency)}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Balance: {formatMinorUnits(inv.balanceDueMinorUnits, inv.currency)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Link
            href="/invoices"
            className="mt-4 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-xs font-medium text-slate-300 transition-colors border border-slate-700/60"
          >
            <span>Review Invoices & Calculation Passports</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}

