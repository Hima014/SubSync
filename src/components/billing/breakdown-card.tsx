"use client";

import React from "react";
import { BillingCalculationResult } from "@/lib/billing-calculator";
import { formatINR } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface BreakdownCardProps {
  result: BillingCalculationResult;
  title?: string;
  subtitle?: string;
}

export function BreakdownCard({
  result,
  title = "Calculation Breakdown",
  subtitle = "Deterministic step-by-step arithmetic verified by Billing Engine",
}: BreakdownCardProps) {
  return (
    <Card className="border-gold/50 shadow-md bg-gradient-to-b from-white to-gold-50/20">
      <CardHeader className="border-b border-border/80">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{subtitle}</CardDescription>
          </div>
          <Badge variant="passed" dot size="sm">
            Arithmetic Verified
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-5 pt-5">
        {/* Step-by-Step Ledger Flow */}
        <div className="space-y-3">
          {/* Step 1: Gross Base */}
          <div className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-surface-muted/60 border border-border/60">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-charcoal text-white text-[10px] font-bold flex items-center justify-center">
                1
              </span>
              <div>
                <span className="font-semibold text-charcoal">Base Subscription Charges</span>
                {result.isProrated && (
                  <span className="text-[10px] text-gold-800 ml-1.5 font-medium">
                    (Pro-rated @ {Math.round(result.prorationFactor * 100)}%)
                  </span>
                )}
              </div>
            </div>
            <span className="font-mono font-semibold text-charcoal text-sm">
              {formatINR(result.grossAmount)}
            </span>
          </div>

          {/* Step 2: Discount */}
          <div className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-surface-muted/60 border border-border/60">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-gold-600 text-white text-[10px] font-bold flex items-center justify-center">
                2
              </span>
              <span className="font-semibold text-charcoal">Promotional Discount Deductions</span>
            </div>
            <span className="font-mono font-semibold text-integrity-passed text-sm">
              {result.discountAmount > 0
                ? `- ${formatINR(result.discountAmount)}`
                : "₹0.00"}
            </span>
          </div>

          {/* Step 3: Taxable Base */}
          <div className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-ivory-200/80 border border-border">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-charcoal-soft text-white text-[10px] font-bold flex items-center justify-center">
                3
              </span>
              <span className="font-bold text-charcoal">Taxable Subtotal (Base - Discount)</span>
            </div>
            <span className="font-mono font-bold text-charcoal text-sm">
              {formatINR(result.taxableAmount)}
            </span>
          </div>

          {/* Step 4: Statutory GST Split */}
          <div className="p-3 rounded-lg bg-surface-muted/40 border border-border/80 space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-charcoal">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-charcoal text-white text-[10px] font-bold flex items-center justify-center">
                  4
                </span>
                <span>Statutory GST ({result.gstRate}% Total)</span>
              </div>
              <span className="font-mono text-sm">{formatINR(result.taxTotal)}</span>
            </div>

            <div className="pl-7 space-y-1 text-[11px] text-charcoal-soft border-t border-border/40 pt-2">
              <div className="flex justify-between font-mono">
                <span>Central GST (CGST @ {result.gstRate / 2}%)</span>
                <span>{formatINR(result.cgst)}</span>
              </div>
              <div className="flex justify-between font-mono">
                <span>State GST (SGST @ {result.gstRate / 2}%)</span>
                <span>{formatINR(result.sgst)}</span>
              </div>
            </div>
          </div>

          {/* Step 5: Final Net Payable */}
          <div className="p-4 rounded-xl bg-charcoal text-white flex items-center justify-between shadow-card">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-gold-400 block">
                Final Total Amount (Net Payable)
              </span>
              <span className="text-xs text-ivory-300">
                Inclusive of all discounts and statutory GST
              </span>
            </div>
            <span className="text-2xl font-bold font-mono text-gold-400 tabular-nums">
              {formatINR(result.finalAmount)}
            </span>
          </div>
        </div>

        {/* Formula Code Snapshot */}
        <div className="p-3 rounded-lg bg-ivory-200 border border-border text-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-charcoal-muted block mb-1">
            Mathematical Formula Expression:
          </span>
          <code className="block font-mono text-xs text-charcoal font-semibold break-all">
            {result.formula}
          </code>
        </div>

        {/* Natural Language Explanation */}
        <div className="p-3 rounded-lg bg-white border border-border/80 text-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-charcoal-muted block mb-1">
            Auditor Explanation:
          </span>
          <p className="text-[11px] text-charcoal-soft leading-relaxed">
            {result.explanation}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

