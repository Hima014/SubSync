'use client';

import React, { useState, useEffect } from 'react';
import {
  Sliders,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  ArrowRight,
  Info,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Layers,
  Percent,
  Calendar,
} from 'lucide-react';
import { getSubscriptions, getPlans, getCustomers, getInvoices, updateSubscription } from '@/lib/repository';
import { calculateBilling, formatMinorUnits } from '@/lib/billing-engine';
import { evaluateBillingIntegrity } from '@/lib/integrity-guard';
import { Subscription, Plan, Customer, Invoice, BillingInterval, IntegrityCheckResult } from '@/types';
import { Badge } from '@/components/Badge';
import { useToast } from '@/components/ToastProvider';

export default function SimulatorPage() {
  const { addToast } = useToast();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  // Selected baseline
  const [selectedSubId, setSelectedSubId] = useState<string>('');

  // What-If Simulation Controls
  const [simPlanId, setSimPlanId] = useState<string>('');
  const [simSeats, setSimSeats] = useState<number>(1);
  const [simPriceMajor, setSimPriceMajor] = useState<string>('0');
  const [simDiscount, setSimDiscount] = useState<number>(0);
  const [simTaxRate, setSimTaxRate] = useState<number>(10);
  const [simInterval, setSimInterval] = useState<BillingInterval>('monthly');

  // Guard result on simulation
  const [simGuardResult, setSimGuardResult] = useState<IntegrityCheckResult | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [subs, pls, custs, invs] = await Promise.all([
          getSubscriptions(),
          getPlans(),
          getCustomers(),
          getInvoices(),
        ]);
        setSubscriptions(subs);
        setPlans(pls);
        setCustomers(custs);
        setInvoices(invs);

        if (subs.length > 0) {
          const firstSub = subs[0];
          setSelectedSubId(firstSub.id);
          applySubToSimulator(firstSub, pls, custs, invs);
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const applySubToSimulator = (
    sub: Subscription,
    pls: Plan[],
    custs: Customer[],
    invs: Invoice[]
  ) => {
    const plan = pls.find((p) => p.id === sub.planId);
    if (!plan) return;

    setSimPlanId(sub.planId);
    setSimSeats(sub.quantity);
    setSimPriceMajor((plan.priceMinorUnits / 100).toFixed(2));
    setSimDiscount(sub.discountPercent || 0);
    setSimTaxRate(plan.taxRatePercent);
    setSimInterval(plan.billingInterval);

    runSimGuard(sub, plan, sub.quantity, plan.priceMinorUnits, sub.discountPercent || 0, plan.taxRatePercent, custs, invs);
  };

  const handleSubSelect = (subId: string) => {
    setSelectedSubId(subId);
    const sub = subscriptions.find((s) => s.id === subId);
    if (sub) {
      applySubToSimulator(sub, plans, customers, invoices);
    }
  };

  const runSimGuard = (
    sub: Subscription,
    plan: Plan,
    quantity: number,
    priceMinor: number,
    discount: number,
    tax: number,
    custs: Customer[],
    invs: Invoice[]
  ) => {
    const cust = custs.find((c) => c.id === sub.customerId);
    if (!cust) return;

    const res = evaluateBillingIntegrity({
      subscription: sub,
      plan,
      customer: cust,
      billingPeriodStart: sub.currentPeriodStart,
      billingPeriodEnd: sub.currentPeriodEnd,
      proposedUnitPriceMinorUnits: priceMinor,
      proposedQuantity: quantity,
      proposedDiscountPercent: discount,
      proposedTaxRatePercent: tax,
      existingInvoices: invs,
    });
    setSimGuardResult(res);
  };

  const handlePlanChange = (planId: string) => {
    setSimPlanId(planId);
    const plan = plans.find((p) => p.id === planId);
    if (plan) {
      setSimPriceMajor((plan.priceMinorUnits / 100).toFixed(2));
      setSimTaxRate(plan.taxRatePercent);
      setSimInterval(plan.billingInterval);

      const sub = subscriptions.find((s) => s.id === selectedSubId);
      if (sub) {
        runSimGuard(sub, plan, simSeats, plan.priceMinorUnits, simDiscount, plan.taxRatePercent, customers, invoices);
      }
    }
  };

  const triggerLiveGuardUpdate = (
    newSeats: number,
    newPriceMajor: string,
    newDiscount: number,
    newTax: number
  ) => {
    const sub = subscriptions.find((s) => s.id === selectedSubId);
    const plan = plans.find((p) => p.id === simPlanId);
    if (sub && plan) {
      const priceMinor = Math.round(parseFloat(newPriceMajor || '0') * 100);
      runSimGuard(sub, plan, newSeats, priceMinor, newDiscount, newTax, customers, invoices);
    }
  };

  const handleResetSimulation = () => {
    const sub = subscriptions.find((s) => s.id === selectedSubId);
    if (sub) {
      applySubToSimulator(sub, plans, customers, invoices);
      addToast({
        type: 'info',
        title: 'Simulation Reset',
        message: 'Reverted simulation back to live subscription parameters.',
      });
    }
  };

  const handleApplyToSubscription = async () => {
    if (!confirm('Apply these simulated parameters to the actual subscription? This will update the real database record.')) {
      return;
    }

    try {
      await updateSubscription(selectedSubId, {
        planId: simPlanId,
        quantity: simSeats,
        discountPercent: simDiscount,
      });

      addToast({
        type: 'success',
        title: 'Subscription Updated',
        message: 'Simulated parameters successfully committed to active subscription.',
      });

      // Reload
      const updatedSubs = await getSubscriptions();
      setSubscriptions(updatedSubs);
    } catch (e: any) {
      addToast({
        type: 'error',
        title: 'Update Failed',
        message: e.message,
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-6 h-6 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const currentSub = subscriptions.find((s) => s.id === selectedSubId);
  const currentPlan = plans.find((p) => p.id === currentSub?.planId);
  const currentCust = customers.find((c) => c.id === currentSub?.customerId);

  // Baseline Current Calculation
  const currentCalc = currentSub && currentPlan
    ? calculateBilling({
        unitPriceMinorUnits: currentPlan.priceMinorUnits,
        quantity: currentSub.quantity,
        discountPercent: currentSub.discountPercent || 0,
        taxRatePercent: currentPlan.taxRatePercent,
      })
    : {
        baseAmountMinorUnits: 0,
        discountMinorUnits: 0,
        taxableAmountMinorUnits: 0,
        taxMinorUnits: 0,
        totalMinorUnits: 0,
      };

  // Proposed Simulation Calculation
  const proposedUnitPriceMinor = Math.round(parseFloat(simPriceMajor || '0') * 100);
  const proposedCalc = calculateBilling({
    unitPriceMinorUnits: proposedUnitPriceMinor,
    quantity: simSeats,
    discountPercent: simDiscount,
    taxRatePercent: simTaxRate,
  });

  // Differences
  const deltaTotalMinor = proposedCalc.totalMinorUnits - currentCalc.totalMinorUnits;
  const deltaPercent = currentCalc.totalMinorUnits > 0
    ? Math.round((deltaTotalMinor / currentCalc.totalMinorUnits) * 100)
    : 0;

  const deltaTaxMinor = proposedCalc.taxMinorUnits - currentCalc.taxMinorUnits;
  const deltaDiscountMinor = proposedCalc.discountMinorUnits - currentCalc.discountMinorUnits;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Banner with Strict Simulation Guarantee */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              What-If Billing Simulator
            </h1>
            <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full bg-purple-500/15 text-purple-400 border border-purple-500/30">
              Zero-Mutation Sandbox
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-3xl">
            Simulate plan migrations, price modifications, seat scaling, and promotional discounts in real time.
            Calculates exact tax, discount, and gross variance before running the Billing Integrity Guard.
          </p>
        </div>

        <button
          onClick={handleResetSimulation}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors border border-slate-700"
        >
          <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
          <span>Reset to Baseline</span>
        </button>
      </div>

      {/* Strict Non-Mutation Disclaimer Callout */}
      <div className="bg-purple-950/20 border border-purple-500/30 rounded-2xl p-4 flex items-center gap-3 text-xs text-purple-200">
        <Sparkles className="w-5 h-5 text-purple-400 shrink-0" />
        <div className="flex-1">
          <strong className="text-white">Pure Simulation Sandbox:</strong> Adjusting controls below calculates financial impacts instantly in-memory. No invoices are generated and the live subscription is never mutated without explicit confirmation.
        </div>
      </div>

      {/* Simulator Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Interactive Simulation Controls */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-[#0e1524] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-emerald-400" />
              Adjust Simulation Variables
            </h2>

            {/* Target Subscription Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                Baseline Subscription
              </label>
              <select
                value={selectedSubId}
                onChange={(e) => handleSubSelect(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
              >
                {subscriptions.map((s) => {
                  const cust = customers.find((c) => c.id === s.customerId);
                  const p = plans.find((pl) => pl.id === s.planId);
                  return (
                    <option key={s.id} value={s.id}>
                      {cust?.company || cust?.name} — {p?.name}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Simulated Plan Switch */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                Target Plan Migration
              </label>
              <select
                value={simPlanId}
                onChange={(e) => handlePlanChange(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
              >
                {plans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — ${(p.priceMinorUnits / 100).toFixed(2)} / {p.billingInterval}
                  </option>
                ))}
              </select>
            </div>

            {/* Seats / Quantity Slider */}
            <div>
              <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
                <span className="text-slate-400">Seats / Unit Quantity</span>
                <span className="text-white font-mono text-sm bg-slate-800 px-2 py-0.5 rounded">
                  {simSeats} seat{simSeats > 1 ? 's' : ''}
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="50"
                value={simSeats}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 1;
                  setSimSeats(val);
                  triggerLiveGuardUpdate(val, simPriceMajor, simDiscount, simTaxRate);
                }}
                className="w-full accent-emerald-500 cursor-pointer"
              />
            </div>

            {/* Unit Price Override */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                Unit Price Override ($)
              </label>
              <input
                type="number"
                step="0.01"
                value={simPriceMajor}
                onChange={(e) => {
                  setSimPriceMajor(e.target.value);
                  triggerLiveGuardUpdate(simSeats, e.target.value, simDiscount, simTaxRate);
                }}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
              />
            </div>

            {/* Discount % & Tax % */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                  Discount (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={simDiscount}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    setSimDiscount(val);
                    triggerLiveGuardUpdate(simSeats, simPriceMajor, val, simTaxRate);
                  }}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                  Tax Rate (%)
                </label>
                <input
                  type="number"
                  min="0"
                  value={simTaxRate}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    setSimTaxRate(val);
                    triggerLiveGuardUpdate(simSeats, simPriceMajor, simDiscount, val);
                  }}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            {/* Simulated Interval */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                Billing Interval
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['monthly', 'quarterly', 'yearly'] as BillingInterval[]).map((int) => (
                  <button
                    key={int}
                    type="button"
                    onClick={() => setSimInterval(int)}
                    className={`py-2 text-xs font-semibold rounded-xl border capitalize transition-all ${
                      simInterval === int
                        ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {int}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Comparative Financial Impact & Simulated Guard */}
        <div className="lg:col-span-7 space-y-6">
          {/* Comparison Cards: Current vs Proposed vs Delta */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Current */}
            <div className="bg-[#0e1524] border border-slate-800 rounded-2xl p-5 shadow-lg">
              <div className="text-xs text-slate-400 font-medium">Current Billing</div>
              <div className="mt-2 text-xl font-bold text-slate-200">
                {formatMinorUnits(currentCalc.totalMinorUnits, 'USD')}
              </div>
              <div className="mt-1 text-[11px] text-slate-400">
                {currentSub?.quantity} seat(s) • {currentPlan?.name}
              </div>
            </div>

            {/* Proposed */}
            <div className="bg-[#0e1524] border border-emerald-500/30 rounded-2xl p-5 shadow-lg">
              <div className="text-xs text-emerald-400 font-medium">Proposed Billing</div>
              <div className="mt-2 text-xl font-bold text-white">
                {formatMinorUnits(proposedCalc.totalMinorUnits, 'USD')}
              </div>
              <div className="mt-1 text-[11px] text-slate-400">
                {simSeats} seat(s) • {simDiscount}% off
              </div>
            </div>

            {/* Delta */}
            <div className="bg-[#0e1524] border border-slate-800 rounded-2xl p-5 shadow-lg">
              <div className="text-xs text-slate-400 font-medium">Net Variance</div>
              <div
                className={`mt-2 text-xl font-bold flex items-center gap-1 ${
                  deltaTotalMinor > 0
                    ? 'text-emerald-400'
                    : deltaTotalMinor < 0
                    ? 'text-rose-400'
                    : 'text-slate-300'
                }`}
              >
                {deltaTotalMinor > 0 ? (
                  <TrendingUp className="w-4 h-4" />
                ) : deltaTotalMinor < 0 ? (
                  <TrendingDown className="w-4 h-4" />
                ) : null}
                <span>
                  {deltaTotalMinor > 0 ? '+' : ''}
                  {formatMinorUnits(deltaTotalMinor, 'USD')}
                </span>
              </div>
              <div className="mt-1 text-[11px] text-slate-400">
                {deltaPercent > 0 ? `+${deltaPercent}%` : `${deltaPercent}%`} change
              </div>
            </div>
          </div>

          {/* Granular Breakdown Table */}
          <div className="bg-[#0e1524] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 pb-2 border-b border-slate-800">
              Side-by-Side Financial Comparison
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider">
                    <th className="py-2.5">Line Component</th>
                    <th className="py-2.5">Current Sub</th>
                    <th className="py-2.5">Simulated Sub</th>
                    <th className="py-2.5 text-right">Net Difference</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  <tr>
                    <td className="py-3 font-medium text-white">Base Unit Price</td>
                    <td className="py-3 font-mono">
                      {formatMinorUnits(currentPlan?.priceMinorUnits || 0, 'USD')}
                    </td>
                    <td className="py-3 font-mono text-emerald-400">
                      {formatMinorUnits(proposedUnitPriceMinor, 'USD')}
                    </td>
                    <td className="py-3 font-mono text-right">
                      {formatMinorUnits(
                        proposedUnitPriceMinor - (currentPlan?.priceMinorUnits || 0),
                        'USD'
                      )}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 font-medium text-white">Seats / Units</td>
                    <td className="py-3">{currentSub?.quantity}</td>
                    <td className="py-3 text-emerald-400">{simSeats}</td>
                    <td className="py-3 text-right">
                      {simSeats - (currentSub?.quantity || 0) > 0 ? '+' : ''}
                      {simSeats - (currentSub?.quantity || 0)}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 font-medium text-white">Base Subtotal</td>
                    <td className="py-3 font-mono">
                      {formatMinorUnits(currentCalc.baseAmountMinorUnits, 'USD')}
                    </td>
                    <td className="py-3 font-mono text-emerald-400">
                      {formatMinorUnits(proposedCalc.baseAmountMinorUnits, 'USD')}
                    </td>
                    <td className="py-3 font-mono text-right">
                      {formatMinorUnits(
                        proposedCalc.baseAmountMinorUnits - currentCalc.baseAmountMinorUnits,
                        'USD'
                      )}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 font-medium text-white">Discount Amount</td>
                    <td className="py-3 font-mono">
                      -{formatMinorUnits(currentCalc.discountMinorUnits, 'USD')}
                    </td>
                    <td className="py-3 font-mono text-emerald-400">
                      -{formatMinorUnits(proposedCalc.discountMinorUnits, 'USD')}
                    </td>
                    <td className="py-3 font-mono text-right">
                      {formatMinorUnits(deltaDiscountMinor, 'USD')}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-3 font-medium text-white">Taxes Applied</td>
                    <td className="py-3 font-mono">
                      +{formatMinorUnits(currentCalc.taxMinorUnits, 'USD')}
                    </td>
                    <td className="py-3 font-mono text-emerald-400">
                      +{formatMinorUnits(proposedCalc.taxMinorUnits, 'USD')}
                    </td>
                    <td className="py-3 font-mono text-right">
                      {formatMinorUnits(deltaTaxMinor, 'USD')}
                    </td>
                  </tr>
                  <tr className="font-bold text-white bg-slate-900/60">
                    <td className="py-3.5 pl-2">Total Periodic Charge</td>
                    <td className="py-3.5 font-mono">
                      {formatMinorUnits(currentCalc.totalMinorUnits, 'USD')}
                    </td>
                    <td className="py-3.5 font-mono text-emerald-400">
                      {formatMinorUnits(proposedCalc.totalMinorUnits, 'USD')}
                    </td>
                    <td className="py-3.5 pr-2 font-mono text-right text-emerald-400">
                      {deltaTotalMinor > 0 ? '+' : ''}
                      {formatMinorUnits(deltaTotalMinor, 'USD')}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Live Integrity Guard Verification on Simulated Scenario */}
          {simGuardResult && (
            <div className="bg-[#0e1524] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">
                    Simulated Scenario Integrity Verification
                  </h3>
                </div>
                <Badge status={simGuardResult.status} size="sm" />
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">
                The Billing Integrity Guard tested this what-if scenario. If this simulated scenario were committed to the live environment, it would be evaluated as:
              </p>

              <div
                className={`p-4 rounded-xl border text-xs flex items-start gap-3 ${
                  simGuardResult.status === 'BLOCKED'
                    ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                    : simGuardResult.status === 'REVIEW_REQUIRED'
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                    : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                }`}
              >
                {simGuardResult.status === 'BLOCKED' ? (
                  <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
                ) : (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                )}
                <div className="flex-1">
                  <div className="font-bold text-white text-sm">
                    {simGuardResult.status === 'VALIDATED'
                      ? 'Safe for Activation'
                      : simGuardResult.status === 'REVIEW_REQUIRED'
                      ? 'Warnings Detected'
                      : 'Integrity Guard Would Block Execution'}
                  </div>
                  <div className="mt-1 text-slate-300">
                    {simGuardResult.issues.length === 0
                      ? 'All gates verified successfully under simulated parameters.'
                      : simGuardResult.issues.map((i) => i.title).join(' • ')}
                  </div>
                </div>
              </div>

              {/* Action to Apply */}
              <div className="pt-2 flex justify-end">
                <button
                  onClick={handleApplyToSubscription}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition-colors flex items-center gap-2 shadow-lg shadow-purple-600/20"
                >
                  <span>Apply Simulation to Subscription</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

