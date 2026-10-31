"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useApp } from "@/context/app-context";
import { calculateBilling } from "@/lib/billing-calculator";
import { BreakdownCard } from "@/components/billing/breakdown-card";
import { SimulationComparison } from "@/components/billing/simulation-comparison";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatINR } from "@/lib/utils";

export default function SimulatorPage() {
  const { subscriptions, settings } = useApp();

  const [selectedSubId, setSelectedSubId] = useState(subscriptions[0]?.id || "");

  // Simulated parameters override
  const [simPrice, setSimPrice] = useState<number>(0);
  const [simSeats, setSimSeats] = useState<number>(0);
  const [simDiscount, setSimDiscount] = useState<number>(0);
  const [simTaxRate, setSimTaxRate] = useState<number>(18);
  const [hasInitialized, setHasInitialized] = useState(false);

  const selectedSub = subscriptions.find((s) => s.id === selectedSubId) || subscriptions[0];

  const initFromSub = (sub: typeof selectedSub) => {
    if (!sub) return;
    setSimPrice(sub.unitPrice);
    setSimSeats(sub.seats);
    setSimDiscount(sub.discountPercentage);
    setSimTaxRate(sub.taxRatePercentage || settings.defaultGstRate);
    setHasInitialized(true);
  };

const handleSubChange = (id: string) => {
  setSelectedSubId(id);
  const sub = subscriptions.find((s) => s.id === id);

  if (sub) {
    initFromSub(sub);
  }
};
  // Current (baseline) calculation
  const baseline = selectedSub
    ? calculateBilling({
        basePrice: selectedSub.unitPrice,
        seats: selectedSub.seats,
        discountPercentage: selectedSub.discountPercentage,
        taxRatePercentage: selectedSub.taxRatePercentage || settings.defaultGstRate,
      })
    : null;

  // Simulated calculation
  const simulated = hasInitialized && selectedSub
    ? calculateBilling({
        basePrice: simPrice,
        seats: simSeats,
        discountPercentage: simDiscount,
        taxRatePercentage: simTaxRate,
      })
    : null;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-ivory-200 border border-border text-[10px] font-bold uppercase tracking-wider text-charcoal mb-1">
            <span>Risk-Free What-If Sandbox</span>
            <span className="w-1.5 h-1.5 rounded-full bg-integrity-passed"></span>
            <span>Zero Production Impact</span>
          </div>
          <h2 className="text-xl lg:text-2xl font-bold tracking-tight text-charcoal">
            Billing Simulator
          </h2>
          <p className="text-xs text-charcoal-soft mt-0.5">
            Model pricing changes, seat adjustments, and discount scenarios without touching live subscription data
          </p>
        </div>
      </div>

      {/* Safe Sandbox Pill */}
      <div className="flex items-center gap-3 p-3 rounded-xl bg-integrity-passed-bg border border-integrity-passed-border text-xs">
        <svg className="w-4 h-4 text-integrity-passed shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        <span className="font-semibold text-integrity-passed">Safe Sandbox Mode Active</span>
        <span className="text-charcoal-muted">—</span>
        <span className="text-charcoal-soft">
          All projections run in-memory only. No subscriptions, invoices, or payment records are created or modified.
        </span>
      </div>

      {/* Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Left: Subscription loader + sim controls */}
        <div className="lg:col-span-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Simulation Parameters</CardTitle>
              <CardDescription>Adjust variables to model different billing outcomes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Step 1: Load a subscription */}
              <div className="space-y-2">
                <Select
                  label="Base Subscription (Baseline)"
                  value={selectedSubId}
                  onChange={(e) => handleSubChange(e.target.value)}
                  options={subscriptions.map((s) => ({
                    value: s.id,
                    label: `${s.customerName} — ${s.planName}`,
                  }))}
                />
                {!hasInitialized && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => initFromSub(selectedSub)}
                    className="w-full"
                  >
                    Load Baseline & Configure →
                  </Button>
                )}
              </div>

              {hasInitialized && (
                <>
                  <div className="border-t border-border pt-4 space-y-4">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-charcoal-muted block">
                      Simulated Parameters (What-If)
                    </span>

                    <div>
                      <div className="flex justify-between text-[11px] font-semibold mb-1">
                        <span className="uppercase tracking-wider text-charcoal">Unit Price (₹)</span>
                        <span className="font-mono text-charcoal">₹{simPrice.toLocaleString("en-IN")}</span>
                      </div>
                      <Input
                        type="number"
                        min="0"
                        step="100"
                        value={simPrice}
                        onChange={(e) => setSimPrice(parseFloat(e.target.value) || 0)}
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-[11px] font-semibold mb-1">
                        <span className="uppercase tracking-wider text-charcoal">Seats / Qty</span>
                        <span className="font-mono text-charcoal">{simSeats}</span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="100"
                        value={simSeats}
                        onChange={(e) => setSimSeats(parseInt(e.target.value))}
                        className="w-full accent-gold"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-[11px] font-semibold mb-1">
                        <span className="uppercase tracking-wider text-charcoal">Discount (%)</span>
                        <span className="font-mono text-integrity-passed">{simDiscount}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="5"
                        value={simDiscount}
                        onChange={(e) => setSimDiscount(parseFloat(e.target.value))}
                        className="w-full accent-charcoal"
                      />
                    </div>

                    <Select
                      label="GST Rate (%)"
                      value={simTaxRate.toString()}
                      onChange={(e) => setSimTaxRate(parseFloat(e.target.value))}
                      options={[
                        { value: "18", label: "18% GST (Standard)" },
                        { value: "12", label: "12% GST" },
                        { value: "5", label: "5% GST" },
                        { value: "0", label: "0% (Tax Exempt)" },
                      ]}
                    />
                  </div>

                  {/* Summary Snapshot */}
                  {baseline && simulated && (
                    <div className="p-3 rounded-lg bg-surface-muted border border-border text-xs space-y-1">
                      <div className="flex justify-between">
                        <span className="text-charcoal-soft">Current Final Amount:</span>
                        <span className="font-mono font-bold text-charcoal">{formatINR(baseline.finalAmount)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-charcoal-soft">Simulated Final Amount:</span>
                        <span className="font-mono font-bold text-charcoal">{formatINR(simulated.finalAmount)}</span>
                      </div>
                      <div className="flex justify-between pt-1 border-t border-border">
                        <span className="text-charcoal-soft">Variance:</span>
                        <span className={`font-mono font-bold ${simulated.finalAmount > baseline.finalAmount ? "text-integrity-critical" : simulated.finalAmount < baseline.finalAmount ? "text-integrity-passed" : "text-charcoal"}`}>
                          {simulated.finalAmount > baseline.finalAmount ? "+" : ""}{formatINR(simulated.finalAmount - baseline.finalAmount)}
                        </span>
                      </div>
                    </div>
                  )}

                  <Link href="/billing-guard">
                    <Button variant="gold" size="sm" className="w-full shadow-xs">
                      Proceed to Integrity Guard →
                    </Button>
                  </Link>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right: Breakdown cards + comparison */}
        <div className="lg:col-span-8 space-y-4">
          {!hasInitialized ? (
            <Card className="min-h-[400px] flex items-center justify-center">
              <div className="text-center p-8 max-w-sm">
                <div className="w-14 h-14 mx-auto rounded-full bg-ivory-200 border border-border flex items-center justify-center mb-4">
                  <svg className="w-7 h-7 text-charcoal-light" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-sm font-semibold text-charcoal mb-1">Select a Subscription to Simulate</h3>
                <p className="text-xs text-charcoal-soft leading-relaxed">
                  Choose an existing subscription as your baseline and click "Load Baseline" to begin modeling pricing scenarios.
                </p>
              </div>
            </Card>
          ) : (
            <>
              {baseline && simulated && (
                <SimulationComparison baseline={baseline} simulated={simulated} />
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {baseline && (
                  <BreakdownCard
                    result={baseline}
                    title="Current Billing (Baseline)"
                    subtitle="Live subscription charges as-is"
                  />
                )}
                {simulated && (
                  <BreakdownCard
                    result={simulated}
                    title="Simulated Billing"
                    subtitle="What-If scenario projection"
                  />
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
