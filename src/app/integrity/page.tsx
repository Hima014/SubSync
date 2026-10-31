'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  ShieldCheck,
  AlertTriangle,
  XCircle,
  CheckCircle2,
  Sliders,
  FilePlus,
  RefreshCw,
  Info,
  Calendar,
  Layers,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import {
  getSubscriptions,
  getPlans,
  getCustomers,
  getInvoices,
  createInvoice,
} from '@/lib/repository';
import { evaluateBillingIntegrity } from '@/lib/integrity-guard';
import {
  calculateBilling,
  createInvoicePassport,
  formatMinorUnits,
} from '@/lib/billing-engine';
import {
  Customer,
  Plan,
  Subscription,
  Invoice,
  IntegrityCheckResult,
} from '@/types';
import { Badge } from '@/components/Badge';
import { useToast } from '@/components/ToastProvider';

export default function IntegrityPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="w-6 h-6 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <IntegrityContent />
    </Suspense>
  );
}

function IntegrityContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { addToast } = useToast();

  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [selectedSubId, setSelectedSubId] = useState<string>('');
  const [periodStart, setPeriodStart] = useState<string>('2026-10-01');
  const [periodEnd, setPeriodEnd] = useState<string>('2026-10-31');
  const [unitPriceMajor, setUnitPriceMajor] = useState<string>('199.00');
  const [quantity, setQuantity] = useState<number>(3);
  const [discountPercent, setDiscountPercent] = useState<number>(10);
  const [taxRatePercent, setTaxRatePercent] = useState<number>(10);

  // Evaluation result state
  const [evaluation, setEvaluation] = useState<IntegrityCheckResult | null>(null);
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  useEffect(() => {
    async function init() {
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

        // Preload based on URL params or default to sub_acme_pro
        const paramSubId = searchParams.get('subId');
        const initialSub =
          subs.find((s) => s.id === paramSubId) ||
          subs.find((s) => s.id === 'sub_acme_pro') ||
          subs[0];

        if (initialSub) {
          setSelectedSubId(initialSub.id);
          const subPlan = pls.find((p) => p.id === initialSub.planId);
          if (subPlan) {
            setUnitPriceMajor((subPlan.priceMinorUnits / 100).toFixed(2));
            setTaxRatePercent(subPlan.taxRatePercent);
          }
          setQuantity(initialSub.quantity);
          setDiscountPercent(initialSub.discountPercent || 0);

          const start = searchParams.get('start') || initialSub.currentPeriodStart;
          const end = searchParams.get('end') || initialSub.currentPeriodEnd;
          setPeriodStart(start);
          setPeriodEnd(end);

          // Run initial evaluation
          const targetCust = custs.find((c) => c.id === initialSub.customerId);
          if (targetCust && subPlan) {
            const res = evaluateBillingIntegrity({
              subscription: initialSub,
              plan: subPlan,
              customer: targetCust,
              billingPeriodStart: start,
              billingPeriodEnd: end,
              proposedUnitPriceMinorUnits: subPlan.priceMinorUnits,
              proposedQuantity: initialSub.quantity,
              proposedDiscountPercent: initialSub.discountPercent || 0,
              proposedTaxRatePercent: subPlan.taxRatePercent,
              existingInvoices: invs,
            });
            setEvaluation(res);
          }
        }
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [searchParams]);

  const handleSubscriptionChange = (subId: string) => {
    setSelectedSubId(subId);
    const sub = subscriptions.find((s) => s.id === subId);
    if (!sub) return;

    const plan = plans.find((p) => p.id === sub.planId);
    if (plan) {
      setUnitPriceMajor((plan.priceMinorUnits / 100).toFixed(2));
      setTaxRatePercent(plan.taxRatePercent);
    }
    setQuantity(sub.quantity);
    setDiscountPercent(sub.discountPercent || 0);
    setPeriodStart(sub.currentPeriodStart);
    setPeriodEnd(sub.currentPeriodEnd);

    // Auto evaluate
    const cust = customers.find((c) => c.id === sub.customerId);
    if (cust && plan) {
      const res = evaluateBillingIntegrity({
        subscription: sub,
        plan,
        customer: cust,
        billingPeriodStart: sub.currentPeriodStart,
        billingPeriodEnd: sub.currentPeriodEnd,
        proposedUnitPriceMinorUnits: plan.priceMinorUnits,
        proposedQuantity: sub.quantity,
        proposedDiscountPercent: sub.discountPercent || 0,
        proposedTaxRatePercent: plan.taxRatePercent,
        existingInvoices: invoices,
      });
      setEvaluation(res);
    }
  };

  const handleRunEvaluation = () => {
    setIsEvaluating(true);
    const sub = subscriptions.find((s) => s.id === selectedSubId);
    if (!sub) return;

    const plan = plans.find((p) => p.id === sub.planId);
    const cust = customers.find((c) => c.id === sub.customerId);
    if (!plan || !cust) return;

    const unitPriceMinor = Math.round(parseFloat(unitPriceMajor || '0') * 100);

    const res = evaluateBillingIntegrity({
      subscription: sub,
      plan,
      customer: cust,
      billingPeriodStart: periodStart,
      billingPeriodEnd: periodEnd,
      proposedUnitPriceMinorUnits: unitPriceMinor,
      proposedQuantity: quantity,
      proposedDiscountPercent: discountPercent,
      proposedTaxRatePercent: taxRatePercent,
      existingInvoices: invoices,
    });

    setEvaluation(res);
    setIsEvaluating(false);

    if (res.status === 'BLOCKED') {
      addToast({
        type: 'error',
        title: 'Billing Operation Blocked',
        message: 'Critical integrity issues detected. Invoice generation was prevented.',
      });
    } else if (res.status === 'REVIEW_REQUIRED') {
      addToast({
        type: 'warning',
        title: 'Integrity Warning',
        message: 'Non-critical discrepancies detected. Review required.',
      });
    } else {
      addToast({
        type: 'success',
        title: 'Integrity Verified',
        message: 'All 8 integrity gates passed! Operation is safe to execute.',
      });
    }
  };

  // Test Case Preset Loaders
  const loadPreset = (type: 'duplicate' | 'cancelled' | 'reverse_dates' | 'zero_qty' | 'valid') => {
    if (type === 'duplicate') {
      handleSubscriptionChange('sub_acme_pro');
      setPeriodStart('2026-10-01');
      setPeriodEnd('2026-10-31');
    } else if (type === 'cancelled') {
      handleSubscriptionChange('sub_acme_cancelled');
    } else if (type === 'reverse_dates') {
      handleSubscriptionChange('sub_cloudscale_ent');
      setPeriodStart('2027-02-15');
      setPeriodEnd('2026-02-15'); // Reverse!
    } else if (type === 'zero_qty') {
      handleSubscriptionChange('sub_acme_pro');
      setQuantity(0); // Zero seats
    } else if (type === 'valid') {
      // Clean next cycle for Acme Pro: 2026-11-01 to 2026-11-30
      handleSubscriptionChange('sub_acme_pro');
      setPeriodStart('2026-11-01');
      setPeriodEnd('2026-11-30');
    }
    setTimeout(handleRunEvaluation, 50);
  };

  const handleGenerateInvoice = async () => {
    if (!evaluation || !evaluation.canProceed) return;

    setIsGenerating(true);
    try {
      const sub = subscriptions.find((s) => s.id === selectedSubId)!;
      const plan = plans.find((p) => p.id === sub.planId)!;
      const cust = customers.find((c) => c.id === sub.customerId)!;

      const unitPriceMinor = Math.round(parseFloat(unitPriceMajor) * 100);

      const calc = calculateBilling({
        unitPriceMinorUnits: unitPriceMinor,
        quantity,
        discountPercent,
        taxRatePercent,
      });

      const lineItem = {
        id: `li_${Date.now()}`,
        description: `${plan.name} (${quantity} unit${quantity > 1 ? 's' : ''}) - ${periodStart} to ${periodEnd}`,
        quantity,
        unitPriceMinorUnits: unitPriceMinor,
        subtotalMinorUnits: calc.baseAmountMinorUnits,
      };

      const passport = createInvoicePassport({
        invoiceId: `pending_creation_${Date.now()}`,
        subscriptionId: sub.id,
        customerId: cust.id,
        issuedAt: new Date().toISOString(),
        periodStart,
        periodEnd,
        planName: plan.name,
        calculation: calc,
        integrityResult: evaluation,
      });

      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 14);

      const newInv = await createInvoice({
        customerId: cust.id,
        subscriptionId: sub.id,
        status: 'issued',
        billingPeriodStart: periodStart,
        billingPeriodEnd: periodEnd,
        currency: plan.currency,
        lineItems: [lineItem],
        subtotalMinorUnits: calc.baseAmountMinorUnits,
        discountMinorUnits: calc.discountMinorUnits,
        taxMinorUnits: calc.taxMinorUnits,
        totalMinorUnits: calc.totalMinorUnits,
        amountPaidMinorUnits: 0,
        balanceDueMinorUnits: calc.totalMinorUnits,
        dueDate: dueDate.toISOString().split('T')[0],
        issuedDate: new Date().toISOString().split('T')[0],
        passport: { ...passport, invoiceId: 'assigned' },
        notes: `Validated by Billing Integrity Guard. Hash: ${passport.integritySnapshot.hash}`,
      });

      addToast({
        type: 'success',
        title: 'Invoice Issued & Passport Sealed',
        message: `${newInv.invoiceNumber} created with complete calculation breakdown.`,
      });

      router.push(`/invoices?highlight=${newInv.id}`);
    } catch (e: any) {
      addToast({
        type: 'error',
        title: 'Invoice Creation Failed',
        message: e.message,
      });
    } finally {
      setIsGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-6 h-6 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const activeSub = subscriptions.find((s) => s.id === selectedSubId);
  const activePlan = plans.find((p) => p.id === activeSub?.planId);
  const activeCust = customers.find((c) => c.id === activeSub?.customerId);

  const calculatedPreview = calculateBilling({
    unitPriceMinorUnits: Math.round(parseFloat(unitPriceMajor || '0') * 100),
    quantity,
    discountPercent,
    taxRatePercent,
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Billing Integrity Guard
            </h1>
            <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              Primary Differentiator
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed">
            Deterministic pre-billing validation engine. Intercepts proposed charges before invoice generation
            to prevent duplicate billing periods, malformed date ranges, invalid lifecycle states, seat count errors, and floating-point mismatches.
          </p>
        </div>

        {/* Quick Test Case Presets */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mr-1">
            Test Scenarios:
          </span>
          <button
            onClick={() => loadPreset('duplicate')}
            className="px-2.5 py-1 text-xs rounded-lg bg-rose-500/15 text-rose-300 hover:bg-rose-500/25 border border-rose-500/30 transition-colors font-medium"
          >
            Duplicate Period (Block)
          </button>
          <button
            onClick={() => loadPreset('cancelled')}
            className="px-2.5 py-1 text-xs rounded-lg bg-rose-500/15 text-rose-300 hover:bg-rose-500/25 border border-rose-500/30 transition-colors font-medium"
          >
            Cancelled Sub (Block)
          </button>
          <button
            onClick={() => loadPreset('reverse_dates')}
            className="px-2.5 py-1 text-xs rounded-lg bg-amber-500/15 text-amber-300 hover:bg-amber-500/25 border border-amber-500/30 transition-colors font-medium"
          >
            Reverse Dates (Block)
          </button>
          <button
            onClick={() => loadPreset('valid')}
            className="px-2.5 py-1 text-xs rounded-lg bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25 border border-emerald-500/30 transition-colors font-medium"
          >
            Valid Next Cycle (Pass)
          </button>
        </div>
      </div>

      {/* Main Guard Layout: Configuration on Left, Live Engine Guard on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Operation Inputs */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-[#0e1524] border border-slate-800 rounded-2xl p-6 shadow-xl">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 mb-4 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-emerald-400" />
              Proposed Billing Operation Parameters
            </h2>

            <div className="space-y-4">
              {/* Target Subscription */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                  Target Subscription
                </label>
                <select
                  value={selectedSubId}
                  onChange={(e) => handleSubscriptionChange(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                >
                  {subscriptions.map((s) => {
                    const cust = customers.find((c) => c.id === s.customerId);
                    const plan = plans.find((p) => p.id === s.planId);
                    return (
                      <option key={s.id} value={s.id}>
                        {cust?.company || cust?.name} — {plan?.name} ({s.status})
                      </option>
                    );
                  })}
                </select>
                {activeSub && (
                  <div className="mt-2 p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                    <span>
                      Customer: <strong className="text-white">{activeCust?.company}</strong>
                    </span>
                    <Badge status={activeSub.status} size="sm" />
                  </div>
                )}
              </div>

              {/* Billing Period Start & End */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                    Period Start
                  </label>
                  <input
                    type="date"
                    value={periodStart}
                    onChange={(e) => setPeriodStart(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                    Period End
                  </label>
                  <input
                    type="date"
                    value={periodEnd}
                    onChange={(e) => setPeriodEnd(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Unit Price & Quantity */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                    Unit Price ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={unitPriceMajor}
                    onChange={(e) => setUnitPriceMajor(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                  {activePlan && (
                    <div className="text-[10px] text-slate-400 mt-1">
                      Catalog: ${(activePlan.priceMinorUnits / 100).toFixed(2)}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                    Quantity / Seats
                  </label>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Discount & Tax */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                    Discount (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={discountPercent}
                    onChange={(e) => setDiscountPercent(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                    Tax Rate (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={taxRatePercent}
                    onChange={(e) => setTaxRatePercent(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Calculation Preview */}
              <div className="mt-4 p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2 text-xs">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 pb-1 border-b border-slate-800">
                  Minor-Unit Calculation Summary
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Subtotal ({quantity} seats):</span>
                  <span>{formatMinorUnits(calculatedPreview.baseAmountMinorUnits, 'USD')}</span>
                </div>
                <div className="flex justify-between text-emerald-400">
                  <span>Discount ({discountPercent}%):</span>
                  <span>-{formatMinorUnits(calculatedPreview.discountMinorUnits, 'USD')}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Tax ({taxRatePercent}%):</span>
                  <span>+{formatMinorUnits(calculatedPreview.taxMinorUnits, 'USD')}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-white pt-2 border-t border-slate-800">
                  <span>Total Due:</span>
                  <span>{formatMinorUnits(calculatedPreview.totalMinorUnits, 'USD')}</span>
                </div>
              </div>

              <button
                onClick={handleRunEvaluation}
                disabled={isEvaluating}
                className="w-full py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-sm transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 active:scale-[0.99]"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>{isEvaluating ? 'Evaluating Integrity...' : 'Execute Integrity Guard'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Integrity Evaluation Verdict & 8-Gate Audit */}
        <div className="lg:col-span-7 space-y-6">
          {evaluation && (
            <>
              {/* Verdict Banner */}
              <div
                className={`p-6 rounded-2xl border shadow-2xl backdrop-blur-md transition-all ${
                  evaluation.status === 'BLOCKED'
                    ? 'bg-rose-500/10 border-rose-500/40 text-rose-300'
                    : evaluation.status === 'REVIEW_REQUIRED'
                    ? 'bg-amber-500/10 border-amber-500/40 text-amber-300'
                    : 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${
                        evaluation.status === 'BLOCKED'
                          ? 'bg-rose-500/20 border-rose-500/50 text-rose-400'
                          : evaluation.status === 'REVIEW_REQUIRED'
                          ? 'bg-amber-500/20 border-amber-500/50 text-amber-400'
                          : 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                      }`}
                    >
                      {evaluation.status === 'BLOCKED' ? (
                        <XCircle className="w-7 h-7" />
                      ) : evaluation.status === 'REVIEW_REQUIRED' ? (
                        <AlertTriangle className="w-7 h-7" />
                      ) : (
                        <CheckCircle2 className="w-7 h-7" />
                      )}
                    </div>
                    <div>
                      <div className="text-xl font-extrabold tracking-tight text-white flex items-center gap-2">
                        <span>VERDICT: {evaluation.status}</span>
                      </div>
                      <p className="text-xs mt-1 text-slate-300">
                        {evaluation.status === 'BLOCKED'
                          ? 'Billing mutation strictly prevented. Critical compliance or double-billing violations detected.'
                          : evaluation.status === 'REVIEW_REQUIRED'
                          ? 'Warnings detected. Invoice generation requires deliberate administrator confirmation.'
                          : 'Deterministic validation complete. All 8 financial integrity gates verified.'}
                      </p>
                    </div>
                  </div>

                  <Badge status={evaluation.status} size="md" />
                </div>

                {/* Primary Action Button */}
                <div className="mt-6 pt-5 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="text-xs text-slate-400">
                    Validated timestamp: {new Date(evaluation.checkedAt).toLocaleTimeString()}
                  </div>

                  {evaluation.canProceed ? (
                    <button
                      onClick={handleGenerateInvoice}
                      disabled={isGenerating}
                      className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
                    >
                      <FilePlus className="w-4 h-4" />
                      <span>{isGenerating ? 'Sealing Passport...' : 'Issue Invoice & Seal Passport'}</span>
                    </button>
                  ) : (
                    <div className="text-xs font-semibold text-rose-400 flex items-center gap-1.5">
                      <XCircle className="w-4 h-4" />
                      <span>Invoice Generation Locked</span>
                    </div>
                  )}
                </div>
              </div>

              {/* 8-Gate Detailed Audit Inspection */}
              <div className="bg-[#0e1524] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">
                    Verification Gates Audit
                  </h3>
                  <span className="text-xs text-slate-400">
                    {evaluation.issues.length === 0
                      ? '8/8 Gates Passed Cleanly'
                      : `${evaluation.issues.length} Gate Alert(s)`}
                  </span>
                </div>

                {/* Issues List if any */}
                {evaluation.issues.length > 0 ? (
                  <div className="space-y-3">
                    {evaluation.issues.map((issue) => (
                      <div
                        key={issue.id}
                        className={`p-4 rounded-xl border text-xs space-y-2 ${
                          issue.severity === 'CRITICAL'
                            ? 'bg-rose-500/10 border-rose-500/30'
                            : issue.severity === 'WARNING'
                            ? 'bg-amber-500/10 border-amber-500/30'
                            : 'bg-sky-500/10 border-sky-500/30'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white text-sm flex items-center gap-2">
                            {issue.severity === 'CRITICAL' ? (
                              <XCircle className="w-4 h-4 text-rose-400" />
                            ) : issue.severity === 'WARNING' ? (
                              <AlertTriangle className="w-4 h-4 text-amber-400" />
                            ) : (
                              <Info className="w-4 h-4 text-sky-400" />
                            )}
                            {issue.title}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              issue.severity === 'CRITICAL'
                                ? 'bg-rose-500/20 text-rose-400'
                                : issue.severity === 'WARNING'
                                ? 'bg-amber-500/20 text-amber-400'
                                : 'bg-sky-500/20 text-sky-400'
                            }`}
                          >
                            {issue.severity}
                          </span>
                        </div>

                        <p className="text-slate-300 leading-relaxed">{issue.message}</p>

                        <div className="pt-2 border-t border-slate-800/80 flex items-start gap-1.5 text-slate-400">
                          <strong className="text-slate-300 shrink-0">Recommendation:</strong>
                          <span>{issue.recommendation}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-center space-y-2">
                    <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                    <div className="font-bold text-white text-sm">
                      Zero Financial Integrity Violations Found
                    </div>
                    <p className="text-xs text-slate-400 max-w-md mx-auto">
                      All criteria passed: duplicate periods absent, chronology valid, subscription state active, price matches catalog baseline, and financial minor-unit math confirmed.
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

