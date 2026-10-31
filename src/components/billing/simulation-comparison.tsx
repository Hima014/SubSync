"use client";

import React from "react";
import { BillingCalculationResult } from "@/lib/billing-calculator";
import { formatINR } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface SimulationComparisonProps {
  baseline: BillingCalculationResult;
  simulated: BillingCalculationResult;
}

export function SimulationComparison({ baseline, simulated }: SimulationComparisonProps) {
  const diffAmount = simulated.finalAmount - baseline.finalAmount;
  const percentChange =
    baseline.finalAmount > 0
      ? ((simulated.finalAmount - baseline.finalAmount) / baseline.finalAmount) * 100
      : 0;

  const rows = [
    { label: "Gross Base Amount", base: baseline.grossAmount, sim: simulated.grossAmount },
    { label: "Discount Deduction", base: -baseline.discountAmount, sim: -simulated.discountAmount },
    { label: "Taxable Subtotal", base: baseline.taxableAmount, sim: simulated.taxableAmount },
    { label: "CGST", base: baseline.cgst, sim: simulated.cgst },
    { label: "SGST", base: baseline.sgst, sim: simulated.sgst },
    { label: "Total GST", base: baseline.taxTotal, sim: simulated.taxTotal },
    { label: "Net Final Amount", base: baseline.finalAmount, sim: simulated.finalAmount, isTotal: true },
  ];

  return (
    <div className="rounded-xl border border-border bg-white overflow-hidden shadow-card">
      {/* Header */}
      <div className="px-5 py-4 border-b border-border bg-surface-muted/50 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-charcoal">Current vs. Simulated Comparison</h3>
        <span
          className={cn(
            "inline-flex items-center gap-1 font-mono font-bold text-sm px-3 py-1 rounded-full border",
            diffAmount > 0
              ? "bg-integrity-critical-bg text-integrity-critical border-integrity-critical-border"
              : diffAmount < 0
              ? "bg-integrity-passed-bg text-integrity-passed border-integrity-passed-border"
              : "bg-ivory-200 text-charcoal border-border"
          )}
        >
          {diffAmount > 0 ? "▲" : diffAmount < 0 ? "▼" : "="}
          {" "}
          {Math.abs(percentChange).toFixed(1)}%
          {" "}
          ({diffAmount > 0 ? "+" : ""}{formatINR(diffAmount)})
        </span>
      </div>

      {/* Comparison Table */}
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-border text-[10px] font-bold uppercase tracking-wider text-charcoal-soft">
            <th className="py-2.5 px-4 text-left">Line Item</th>
            <th className="py-2.5 px-4 text-right">Current Billing</th>
            <th className="py-2.5 px-4 text-right">Simulated Billing</th>
            <th className="py-2.5 px-4 text-right">Variance (Δ)</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/50">
          {rows.map((row) => {
            const delta = row.sim - row.base;
            return (
              <tr
                key={row.label}
                className={cn(
                  "transition-colors",
                  row.isTotal
                    ? "bg-charcoal text-white font-semibold"
                    : "hover:bg-surface-muted/50"
                )}
              >
                <td className={cn("py-2.5 px-4 font-medium", row.isTotal ? "text-white" : "text-charcoal")}>
                  {row.label}
                </td>
                <td className={cn("py-2.5 px-4 text-right font-mono", row.isTotal ? "text-gold-400" : "text-charcoal")}>
                  {formatINR(row.base)}
                </td>
                <td className={cn("py-2.5 px-4 text-right font-mono font-semibold", row.isTotal ? "text-gold-300" : "text-charcoal")}>
                  {formatINR(row.sim)}
                </td>
                <td className="py-2.5 px-4 text-right font-mono">
                  {delta !== 0 ? (
                    <span className={delta > 0 ? "text-integrity-critical" : "text-integrity-passed"}>
                      {delta > 0 ? "+" : ""}{formatINR(delta)}
                    </span>
                  ) : (
                    <span className={row.isTotal ? "text-ivory-300" : "text-charcoal-light"}>—</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Safe Sandbox Notice */}
      <div className="px-4 py-3 border-t border-border bg-ivory-100/60 flex items-center gap-2 text-[11px] text-charcoal-soft">
        <svg className="w-3.5 h-3.5 text-integrity-passed shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        <span>
          <strong className="text-integrity-passed">Safe Sandbox Mode:</strong> This simulation runs entirely in memory. No subscription records, invoices, or payments are modified.
        </span>
      </div>
    </div>
  );
}

