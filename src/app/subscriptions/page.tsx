'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Layers,
  Plus,
  ShieldCheck,
  Pause,
  Play,
  XCircle,
  Clock,
  ArrowRight,
  Filter,
  Search,
  CheckCircle2,
  Sliders,
  DollarSign,
  Calendar,
} from 'lucide-react';
import {
  getSubscriptions,
  getPlans,
  getCustomers,
  createSubscription,
  pauseSubscription,
  resumeSubscription,
  cancelSubscription,
} from '@/lib/repository';
import { formatMinorUnits } from '@/lib/billing-engine';
import { Subscription, Plan, Customer, SubscriptionStatus } from '@/types';
import { Badge } from '@/components/Badge';
import { Modal } from '@/components/Modal';
import { useToast } from '@/components/ToastProvider';

export default function SubscriptionsPage() {
  const { addToast } = useToast();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Create Sub Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newCustId, setNewCustId] = useState('');
  const [newPlanId, setNewPlanId] = useState('');
  const [newQuantity, setNewQuantity] = useState(1);
  const [newDiscount, setNewDiscount] = useState(0);
  const [newStartDate, setNewStartDate] = useState(new Date().toISOString().split('T')[0]);

  // Cancel Modal State
  const [cancelSubId, setCancelSubId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('Customer requested plan cancellation');

  const loadData = async () => {
    try {
      const [subs, pls, custs] = await Promise.all([
        getSubscriptions(),
        getPlans(),
        getCustomers(),
      ]);
      setSubscriptions(subs);
      setPlans(pls);
      setCustomers(custs);
      if (custs.length > 0) setNewCustId(custs[0].id);
      if (pls.length > 0) setNewPlanId(pls[0].id);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateSub = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustId || !newPlanId) return;

    try {
      const plan = plans.find((p) => p.id === newPlanId)!;
      const start = new Date(newStartDate);
      const nextDate = new Date(start);

      if (plan.billingInterval === 'yearly') {
        nextDate.setFullYear(nextDate.getFullYear() + 1);
      } else if (plan.billingInterval === 'quarterly') {
        nextDate.setMonth(nextDate.getMonth() + 3);
      } else {
        nextDate.setMonth(nextDate.getMonth() + 1);
      }

      const currentPeriodStart = newStartDate;
      const currentPeriodEnd = nextDate.toISOString().split('T')[0];

      await createSubscription({
        customerId: newCustId,
        planId: newPlanId,
        status: 'active',
        quantity: newQuantity,
        startDate: newStartDate,
        currentPeriodStart,
        currentPeriodEnd,
        nextBillingDate: currentPeriodEnd,
        discountPercent: newDiscount,
      });

      addToast({
        type: 'success',
        title: 'Subscription Created',
        message: 'New subscription activated. Protected by Billing Integrity Guard.',
      });

      setIsCreateOpen(false);
      await loadData();
    } catch (e: any) {
      addToast({
        type: 'error',
        title: 'Creation Failed',
        message: e.message,
      });
    }
  };

  const handlePause = async (id: string) => {
    try {
      await pauseSubscription(id);
      addToast({
        type: 'info',
        title: 'Subscription Paused',
        message: 'Billing has been suspended. Future charges will be blocked by Integrity Guard.',
      });
      await loadData();
    } catch (e: any) {
      addToast({ type: 'error', title: 'Action Failed', message: e.message });
    }
  };

  const handleResume = async (id: string) => {
    try {
      await resumeSubscription(id);
      addToast({
        type: 'success',
        title: 'Subscription Resumed',
        message: 'Subscription restored to Active status.',
      });
      await loadData();
    } catch (e: any) {
      addToast({ type: 'error', title: 'Action Failed', message: e.message });
    }
  };

  const handleCancelSubmit = async () => {
    if (!cancelSubId) return;
    try {
      await cancelSubscription(cancelSubId, cancelReason);
      addToast({
        type: 'warning',
        title: 'Subscription Cancelled',
        message: 'Status set to Cancelled. Future billing will be blocked.',
      });
      setCancelSubId(null);
      await loadData();
    } catch (e: any) {
      addToast({ type: 'error', title: 'Cancellation Failed', message: e.message });
    }
  };

  const filteredSubs = subscriptions.filter((sub) => {
    if (statusFilter !== 'all' && sub.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const cust = customers.find((c) => c.id === sub.customerId);
      const plan = plans.find((p) => p.id === sub.planId);
      const query = searchQuery.toLowerCase();
      const matchCust = cust?.name.toLowerCase().includes(query) || cust?.company.toLowerCase().includes(query);
      const matchPlan = plan?.name.toLowerCase().includes(query);
      const matchId = sub.id.toLowerCase().includes(query);
      if (!matchCust && !matchPlan && !matchId) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            Subscription Lifecycle Management
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage subscriber states, tiers, proration dates, and launch pre-billing integrity validation.
          </p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs transition-colors shadow-lg shadow-emerald-500/20"
        >
          <Plus className="w-4 h-4" />
          <span>New Subscription</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#0e1524] border border-slate-800 p-4 rounded-2xl">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by customer, plan or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Status Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {(['all', 'active', 'paused', 'past_due', 'trialing', 'cancelled'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize whitespace-nowrap transition-colors ${
                statusFilter === st
                  ? 'bg-emerald-500 text-slate-950'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Subscriptions Table */}
      <div className="bg-[#0e1524] border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider bg-slate-900/40">
                <th className="py-3.5 px-4">Subscription & Customer</th>
                <th className="py-3.5 px-4">Plan & Billing Interval</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Current Period</th>
                <th className="py-3.5 px-4">Seats & Rate</th>
                <th className="py-3.5 px-4 text-right">Integrity Guard & Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filteredSubs.length > 0 ? (
                filteredSubs.map((sub) => {
                  const cust = customers.find((c) => c.id === sub.customerId);
                  const plan = plans.find((p) => p.id === sub.planId);

                  return (
                    <tr key={sub.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-4 px-4">
                        <div className="font-bold text-white text-sm">
                          {cust?.company || cust?.name || 'Unknown'}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                          {sub.id}
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <div className="font-semibold text-slate-200">{plan?.name}</div>
                        <div className="text-[11px] text-slate-400 capitalize">
                          {plan?.billingInterval} cycle
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <Badge status={sub.status} size="sm" />
                        {sub.cancelReason && (
                          <div className="text-[10px] text-rose-400 mt-1 max-w-xs truncate">
                            {sub.cancelReason}
                          </div>
                        )}
                      </td>

                      <td className="py-4 px-4">
                        <div className="font-mono text-slate-300">
                          {sub.currentPeriodStart} <span className="text-slate-500">→</span> {sub.currentPeriodEnd}
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          Next billing: {sub.nextBillingDate}
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <div className="font-medium text-white">
                          {sub.quantity} seat{sub.quantity > 1 ? 's' : ''}
                        </div>
                        <div className="text-[11px] text-emerald-400 font-mono">
                          {plan ? formatMinorUnits(plan.priceMinorUnits * sub.quantity, plan.currency) : '-'}
                          {sub.discountPercent ? ` (${sub.discountPercent}% off)` : ''}
                        </div>
                      </td>

                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* Direct Launch into Integrity Guard */}
                          <Link
                            href={`/integrity?subId=${sub.id}&start=${sub.currentPeriodStart}&end=${sub.currentPeriodEnd}`}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 font-semibold text-xs transition-colors"
                            title="Run Billing Integrity Guard"
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>Validate Billing</span>
                          </Link>

                          {/* Lifecycle State Controls */}
                          {sub.status === 'active' && (
                            <button
                              onClick={() => handlePause(sub.id)}
                              title="Pause Subscription"
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-amber-400 transition-colors"
                            >
                              <Pause className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {sub.status === 'paused' && (
                            <button
                              onClick={() => handleResume(sub.id)}
                              title="Resume Subscription"
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-emerald-400 transition-colors"
                            >
                              <Play className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {sub.status !== 'cancelled' && (
                            <button
                              onClick={() => {
                                setCancelSubId(sub.id);
                              }}
                              title="Cancel Subscription"
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-rose-400 transition-colors"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    No subscriptions match current criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Create Subscription */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Create New Subscription"
        description="Assign subscriber account, select tier, configure seat count and initial dates."
      >
        <form onSubmit={handleCreateSub} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-400 mb-1">Target Customer</label>
            <select
              value={newCustId}
              onChange={(e) => setNewCustId(e.target.value)}
              required
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
            >
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.company})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-400 mb-1">Subscription Plan</label>
            <select
              value={newPlanId}
              onChange={(e) => setNewPlanId(e.target.value)}
              required
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
            >
              {plans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — ${(p.priceMinorUnits / 100).toFixed(2)} / {p.billingInterval}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-400 mb-1">Quantity / Seats</label>
              <input
                type="number"
                min="1"
                value={newQuantity}
                onChange={(e) => setNewQuantity(parseInt(e.target.value) || 1)}
                required
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-400 mb-1">Discount (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                value={newDiscount}
                onChange={(e) => setNewDiscount(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-400 mb-1">Start Date</label>
            <input
              type="date"
              value={newStartDate}
              onChange={(e) => setNewStartDate(e.target.value)}
              required
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="pt-4 flex justify-end gap-2 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold"
            >
              Create Subscription
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Confirm Cancel */}
      <Modal
        isOpen={!!cancelSubId}
        onClose={() => setCancelSubId(null)}
        title="Confirm Subscription Cancellation"
        description="Transitioning to Cancelled will block future billing cycles in the Integrity Guard."
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-400 mb-1">Reason for Cancellation</label>
            <input
              type="text"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-rose-500"
            />
          </div>

          <div className="pt-4 flex justify-end gap-2 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setCancelSubId(null)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium"
            >
              Keep Active
            </button>
            <button
              type="button"
              onClick={handleCancelSubmit}
              className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold"
            >
              Confirm Cancellation
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

