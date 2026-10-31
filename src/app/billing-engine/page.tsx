"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useApp } from "@/context/app-context";
import { calculateBilling, BillingCalculationInput } from "@/lib/billing-calculator";
import { BreakdownCard } from "@/components/billing/breakdown-card";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

export default function BillingEnginePage() {
  const { subscriptions, settings } = useApp();

  // Mode: "custom" or "subscription"
  const [mode, setMode] = useState<"custom" | "subscription">("custom");
  const [selectedSubId, setSelectedSubId] = useState<string>(
    subscriptions[0]?.id || ""
  );

  // Custom parameters
  const [basePrice, setBasePrice] = useState<number>(1000);
  const [seats, setSeats] = useState<number>(1);
  const [discountPercentage, setDiscountPercentage] = useState<number>(10);
  const [taxRate, setTaxRate] = useState<number>(18);
  const [isProrated, setIsProrated] = useState<boolean>(false);
  const [activeDays, setActiveDays] = useState<number>(15);
  const [totalDays, setTotalDays] = useState<number>(30);

  // Apply Presets
  const applyPreset = (preset: "prompt-example" | "growth-pro" | "enterprise" | "prorated") => {
    setMode("custom");
    if (preset === "prompt-example") {
      setBasePrice(1000);
      setSeats(1);
      setDiscountPercentage(10);
      setTaxRate(18);
      setIsProrated(false);
    } else if (preset === "growth-pro") {
      setBasePrice(2499);
      setSeats(5);
      setDiscountPercentage(10);
      setTaxRate(18);
      setIsProrated(false);
    } else if (preset === "enterprise") {
      setBasePrice(8999);
      setSeats(10);
      setDiscountPercentage(25);
      setTaxRate(18);
      setIsProrated(false);
    } else if (preset === "prorated") {
      setBasePrice(2499);
      setSeats(5);
      setDiscountPercentage(0);
      setTaxRate(18);
      setIsProrated(true);
      setActiveDays(15);
      setTotalDays(30);
    }
  };

  // Derive input based on mode
  let calculationInput: BillingCalculationInput = {
    basePrice,
    seats,
    discountPercentage,
    taxRatePercentage: taxRate,
    prorateActiveDays: isProrated ? activeDays : undefined,
    prorateTotalDays: isProrated ? totalDays : undefined,
  };

  if (mode === "subscription") {
    const sub = subscriptions.find((s) => s.id === selectedSubId) || subscriptions[0];
    if (sub) {
      calculationInput = {
        basePrice: sub.unitPrice,
        seats: sub.seats,
        discountPercentage: sub.discountPercentage,
        taxRatePercentage: sub.taxRatePercentage || settings.defaultGstRate,
      };
    }
  }

  const result = calculateBilling(calculationInput);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-ivory-200 border border-border text-[10px] font-bold uppercase tracking-wider text-charcoal mb-1">
            <span>Core Calculation Engine</span>
            <span>•</span>
            <span>Deterministic Math</span>
          </div>
          <h2 className="text-xl lg:text-2xl font-bold tracking-tight text-charcoal">
            Billing Engine Laboratory
          </h2>
          <p className="text-xs text-charcoal-soft mt-0.5">
            Transparent subtotal computation, coupon allocation, statutory GST split, and proration analysis
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/billing-guard">
            <Button variant="gold" size="md" className="shadow-xs">
              <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              Run Integrity Guard
            </Button>
          </Link>
        </div>
      </div>

      {/* Preset Quick-Buttons */}
      <div className="flex flex-wrap items-center gap-2 p-3 rounded-xl bg-white border border-border shadow-xs">
        <span className="text-xs font-semibold text-charcoal mr-2">Benchmark Presets:</span>
        <button
          onClick={() => applyPreset("prompt-example")}
          className="px-2.5 py-1 rounded-lg text-xs font-medium border border-gold/60 bg-gold-50/60 hover:bg-gold-100 text-charcoal transition-colors flex items-center gap-1.5"
        >
          <span>🎯</span>
          <span>Prompt Example (₹1,000 @ 10% = ₹1,062)</span>
        </button>
        <button
          onClick={() => applyPreset("growth-pro")}
          className="px-2.5 py-1 rounded-lg text-xs font-medium border border-border bg-surface-muted hover:bg-ivory-200 text-charcoal transition-colors"
        >
          Growth Pro (5 Seats @ 10%)
        </button>
        <button
          onClick={() => applyPreset("enterprise")}
          className="px-2.5 py-1 rounded-lg text-xs font-medium border border-border bg-surface-muted hover:bg-ivory-200 text-charcoal transition-colors"
        >
          Enterprise Scale (10 Seats @ 25%)
        </button>
        <button
          onClick={() => applyPreset("prorated")}
          className="px-2.5 py-1 rounded-lg text-xs font-medium border border-border bg-surface-muted hover:bg-ivory-200 text-charcoal transition-colors"
        >
          Prorated Cycle (15/30 Days)
        </button>
      </div>

      {/* Main 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Calculator Controls (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Calculation Parameters</CardTitle>
                <div className="flex items-center gap-1 bg-ivory-200 p-0.5 rounded-lg border border-border">
                  <button
                    onClick={() => setMode("custom")}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                      mode === "custom"
                        ? "bg-white text-charcoal shadow-xs font-semibold"
                        : "text-charcoal-soft hover:text-charcoal"
                    }`}
                  >
                    Custom Inputs
                  </button>
                  <button
                    onClick={() => setMode("subscription")}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                      mode === "subscription"
                        ? "bg-white text-charcoal shadow-xs font-semibold"
                        : "text-charcoal-soft hover:text-charcoal"
                    }`}
                  >
                    Load Live Sub
                  </button>
                </div>
              </div>
              <CardDescription>
                {mode === "custom"
                  ? "Adjust variables to observe real-time arithmetic flow"
                  : "Inspect real-time billing metrics for an existing customer contract"}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {mode === "subscription" ? (
                <div className="space-y-3">
                  <Select
                    label="Choose Existing Subscription"
                    value={selectedSubId}
                    onChange={(e) => setSelectedSubId(e.target.value)}
                    options={subscriptions.map((s) => ({
                      value: s.id,
                      label: `${s.customerName || s.id} — ${s.planName} (${s.seats} seats)`,
                    }))}
                  />

                  {(() => {
                    const activeSub = subscriptions.find((s) => s.id === selectedSubId);
                    if (!activeSub) return null;
                    return (
                      <div className="p-3 rounded-lg bg-surface-muted border border-border text-xs space-y-1.5">
                        <div className="flex justify-between">
                          <span className="text-charcoal-soft">Subscription ID:</span>
                          <span className="font-mono font-bold text-charcoal">{activeSub.id}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-charcoal-soft">Catalog Unit Price:</span>
                          <span className="font-mono text-charcoal">₹{activeSub.unitPrice}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-charcoal-soft">Provisioned Seats:</span>
                          <span className="font-mono text-charcoal">{activeSub.seats} seats</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-charcoal-soft">Discount Voucher:</span>
                          <span className="font-mono text-charcoal">
                            {activeSub.discountPercentage > 0
                              ? `${activeSub.discountCode || "VOUCHER"} (${activeSub.discountPercentage}%)`
                              : "None"}
                          </span>
                        </div>
                        <div className="flex justify-between items-center pt-1 border-t border-border/60">
                          <span className="text-charcoal-soft">Integrity Gate:</span>
                          <Badge
                            variant={
                              activeSub.integrityStatus === "Passed"
                                ? "passed"
                                : activeSub.integrityStatus === "Warning"
                                ? "warning"
                                : "critical"
                            }
                            size="sm"
                            dot
                          >
                            {activeSub.integrityStatus}
                          </Badge>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Base Price */}
                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <label className="text-charcoal uppercase tracking-wider text-[11px]">
                        Base Unit Price (₹)
                      </label>
                      <span className="font-mono text-charcoal font-bold">₹{basePrice}</span>
                    </div>
                    <Input
                      type="number"
                      min="0"
                      step="50"
                      value={basePrice}
                      onChange={(e) => setBasePrice(parseFloat(e.target.value) || 0)}
                    />
                  </div>

                  {/* Seats */}
                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <label className="text-charcoal uppercase tracking-wider text-[11px]">
                        Provisioned Seats / Qty
                      </label>
                      <span className="font-mono text-charcoal font-bold">{seats} seats</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="50"
                      value={seats}
                      onChange={(e) => setSeats(parseInt(e.target.value) || 1)}
                      className="w-full accent-charcoal"
                    />
                  </div>

                  {/* Discount */}
                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <label className="text-charcoal uppercase tracking-wider text-[11px]">
                        Promotional Discount (%)
                      </label>
                      <span className="font-mono text-integrity-passed font-bold">
                        {discountPercentage}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      value={discountPercentage}
                      onChange={(e) => setDiscountPercentage(parseFloat(e.target.value) || 0)}
                      className="w-full accent-gold"
                    />
                  </div>

                  {/* Tax Rate */}
                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <label className="text-charcoal uppercase tracking-wider text-[11px]">
                        Statutory GST Rate (%)
                      </label>
                      <span className="font-mono text-charcoal font-bold">{taxRate}%</span>
                    </div>
                    <Select
                      value={taxRate.toString()}
                      onChange={(e) => setTaxRate(parseFloat(e.target.value))}
                      options={[
                        { value: "18", label: "18% GST (Standard SaaS: 9% CGST + 9% SGST)" },
                        { value: "12", label: "12% GST (6% CGST + 6% SGST)" },
                        { value: "5", label: "5% GST (2.5% CGST + 2.5% SGST)" },
                        { value: "0", label: "0% GST (Tax Exempt / SEZ)" },
                      ]}
                    />
                  </div>

                  {/* Proration Toggle */}
                  <div className="pt-2 border-t border-border/80 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-charcoal">
                        Mid-Cycle Proration Factor
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsProrated(!isProrated)}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          isProrated ? "bg-gold" : "bg-border-dark"
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            isProrated ? "translate-x-4" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </div>

                    {isProrated && (
                      <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-surface-muted border border-border text-xs">
                        <Input
                          label="Active Days"
                          type="number"
                          min="1"
                          max={totalDays}
                          value={activeDays}
                          onChange={(e) => setActiveDays(parseInt(e.target.value) || 1)}
                        />
                        <Input
                          label="Cycle Days"
                          type="number"
                          min="1"
                          value={totalDays}
                          onChange={(e) => setTotalDays(parseInt(e.target.value) || 30)}
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Breakdown Card & Actions (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <BreakdownCard result={result} />

          {/* Quick Hand-Off CTAs */}
          <div className="p-4 rounded-xl bg-white border border-border shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div>
              <h4 className="text-xs font-bold text-charcoal">Proceed with this Calculation?</h4>
              <p className="text-[11px] text-charcoal-soft">
                Submit this payload to Billing Integrity Guard for pre-invoice sanity checks.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/simulator">
                <Button variant="outline" size="sm">
                  What-If Simulation
                </Button>
              </Link>
              <Link href="/billing-guard">
                <Button variant="gold" size="sm" className="shadow-xs">
                  Run Integrity Guard →
                </Button>
              </Link>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
