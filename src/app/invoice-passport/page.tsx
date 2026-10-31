"use client";

import React, { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useApp } from "@/context/app-context";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { formatINR, formatDate } from "@/lib/utils";
import { Invoice } from "@/types";
import Link from "next/link";

/** Renders a single step row in the provenance breakdown */
function FormulaStep({
  step,
  label,
  value,
  note,
  highlight,
  negative,
}: {
  step: string;
  label: string;
  value: string;
  note?: string;
  highlight?: boolean;
  negative?: boolean;
}) {
  return (
    <div className={`flex items-start gap-3 py-3 ${highlight ? "bg-gold/5 rounded-lg px-2" : ""}`}>
      <div className="w-7 h-7 rounded-full bg-ivory-200 border border-border flex items-center justify-center shrink-0 mt-0.5">
        <span className="text-[10px] font-bold text-charcoal">{step}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-semibold text-charcoal">{label}</div>
        {note && <div className="text-[11px] text-charcoal-soft mt-0.5 leading-relaxed">{note}</div>}
      </div>
      <div className={`text-sm font-bold font-mono tabular-nums shrink-0 ${
        highlight ? "text-charcoal text-base" : negative ? "text-integrity-passed" : "text-charcoal"
      }`}>
        {value}
      </div>
    </div>
  );
}

/** Renders an invoice line item row */
function LineItemRow({ description, qty, unitPrice, amount, type }: {
  description: string;
  qty: number;
  unitPrice: number;
  amount: number;
  type: string;
}) {
  const typeColors: Record<string, string> = {
    base: "bg-ivory-200 text-charcoal border-border",
    discount: "bg-integrity-passed-bg text-integrity-passed border-integrity-passed-border",
    tax: "bg-amber-50 text-amber-700 border-amber-200",
    seats: "bg-blue-50 text-blue-700 border-blue-200",
    proration: "bg-purple-50 text-purple-700 border-purple-200",
  };

  return (
    <tr className="border-b border-border last:border-0">
      <td className="py-3 pr-4">
        <div className="flex items-center gap-2">
          <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${typeColors[type] || typeColors.base}`}>
            {type}
          </span>
          <span className="text-sm text-charcoal">{description}</span>
        </div>
      </td>
      <td className="py-3 text-right font-mono text-xs text-charcoal-soft tabular-nums">{qty}</td>
      <td className="py-3 text-right font-mono text-xs text-charcoal-soft tabular-nums">{formatINR(Math.abs(unitPrice))}</td>
      <td className={`py-3 text-right font-mono text-sm font-semibold tabular-nums ${amount < 0 ? "text-integrity-passed" : "text-charcoal"}`}>
        {amount < 0 ? `−${formatINR(Math.abs(amount))}` : formatINR(amount)}
      </td>
    </tr>
  );
}

function InvoicePassportContent() {
  const searchParams = useSearchParams();
  const { invoices, subscriptions } = useApp();

  const paramId = searchParams.get("invoiceId");
  const [selectedId, setSelectedId] = useState<string>(paramId || invoices[0]?.id || "");

  const invoice: Invoice | undefined = invoices.find((inv) => inv.id === selectedId);
  const snap = invoice?.calculationSnapshot;

  const linkedSub = invoice
    ? subscriptions.find((s) => s.id === invoice.subscriptionId)
    : undefined;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-ivory-200 border border-border text-[10px] font-bold uppercase tracking-wider text-charcoal mb-1">
            <span>Invoice Passport</span>
            <span className="w-1.5 h-1.5 rounded-full bg-gold" />
            <span>Mathematical Provenance</span>
          </div>
          <h2 className="text-xl lg:text-2xl font-bold tracking-tight text-charcoal">Invoice Passport</h2>
          <p className="text-xs text-charcoal-soft mt-0.5">
            Immutable calculation record — exactly how this invoice was computed, frozen at generation time
          </p>
        </div>
        <Link href="/simulator">
          <Button variant="outline" size="sm">
            Re-simulate in Sandbox →
          </Button>
        </Link>
      </div>

      {/* Invoice selector */}
      <Card>
        <CardContent className="p-4">
          <div className="max-w-md">
            <Select
              label="Select Invoice"
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              options={invoices.map((inv) => ({
                value: inv.id,
                label: `${inv.invoiceNumber} — ${inv.customerName} (${formatINR(inv.totalAmount)})`,
              }))}
            />
          </div>
        </CardContent>
      </Card>

      {!invoice || !snap ? (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="w-14 h-14 mx-auto rounded-full bg-ivory-200 border border-border flex items-center justify-center mb-4">
              <svg className="w-7 h-7 text-charcoal-light" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-sm text-charcoal-soft">No invoice selected. Select one above to view its passport.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* Left: Invoice metadata */}
          <div className="lg:col-span-4 space-y-4">
            {/* Invoice identity card */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-base">{invoice.invoiceNumber}</CardTitle>
                    <CardDescription className="mt-0.5">{invoice.customerName}</CardDescription>
                  </div>
                  <Badge
                    variant={
                      invoice.status === "Paid" ? "passed"
                      : invoice.status === "Overdue" ? "critical"
                      : invoice.status === "Issued" ? "warning"
                      : "neutral"
                    }
                    dot
                  >
                    {invoice.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { label: "Plan", value: invoice.planName },
                  { label: "Issue Date", value: formatDate(invoice.issueDate) },
                  { label: "Due Date", value: formatDate(invoice.dueDate) },
                  { label: "Billing Period", value: `${formatDate(invoice.billingPeriodStart)} – ${formatDate(invoice.billingPeriodEnd)}` },
                ].map((row) => (
                  <div key={row.label} className="flex justify-between items-start gap-2 text-xs">
                    <span className="text-charcoal-muted font-medium uppercase tracking-wider text-[10px]">{row.label}</span>
                    <span className="text-charcoal text-right font-medium">{row.value}</span>
                  </div>
                ))}

                <div className="border-t border-border pt-3 flex justify-between items-center">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-charcoal-muted">Total Due</span>
                  <span className="text-lg font-bold font-mono tabular-nums text-charcoal">{formatINR(invoice.totalAmount)}</span>
                </div>
              </CardContent>
            </Card>

            {/* Frozen Snapshot badge */}
            <div className="p-3 rounded-xl bg-gold/5 border border-gold/20 text-xs space-y-1.5">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-gold shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span className="font-bold text-charcoal">Frozen Calculation Snapshot</span>
              </div>
              <p className="text-charcoal-soft leading-relaxed">
                This calculation is permanently frozen at invoice generation time. Even if plan prices,
                discounts, or tax rates change later, this record reflects the exact figures used.
              </p>
              <div className="pt-1 text-charcoal-muted font-mono">
                Captured: {new Date(snap.timestamp).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
              </div>
            </div>

            {/* Link to subscription / billing guard */}
            {linkedSub && (
              <div className="flex flex-col gap-2">
                <Link href={`/billing-guard?subId=${linkedSub.id}`}>
                  <Button variant="outline" size="sm" className="w-full">
                    View in Billing Guard →
                  </Button>
                </Link>
                <Link href={`/simulator?subId=${linkedSub.id}`}>
                  <Button variant="secondary" size="sm" className="w-full">
                    Simulate Changes →
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Right: Full provenance */}
          <div className="lg:col-span-8 space-y-4">

            {/* Natural language explanation */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Plain English Explanation</CardTitle>
                <CardDescription>Why each charge is included in this invoice</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-charcoal leading-relaxed">{snap.explanation}</p>
              </CardContent>
            </Card>

            {/* Step-by-step formula */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Calculation Walkthrough</CardTitle>
                <CardDescription>Mathematical provenance — step by step</CardDescription>
              </CardHeader>
              <CardContent className="divide-y divide-border">
                <FormulaStep
                  step="1"
                  label="Gross Base Amount"
                  value={formatINR(snap.subtotal)}
                  note={`₹${snap.basePrice.toLocaleString("en-IN")} per unit × ${snap.seats} seat${snap.seats > 1 ? "s" : ""}`}
                />
                {snap.discountAmount > 0 && (
                  <FormulaStep
                    step="2"
                    label={`Discount Applied${snap.discountCode ? ` — ${snap.discountCode}` : ""}`}
                    value={`−${formatINR(snap.discountAmount)}`}
                    note={`Deducted from gross base before tax calculation`}
                    negative
                  />
                )}
                <FormulaStep
                  step={snap.discountAmount > 0 ? "3" : "2"}
                  label="Taxable Amount"
                  value={formatINR(snap.taxableAmount)}
                  note="Gross Base minus any applicable discounts"
                />
                <FormulaStep
                  step={snap.discountAmount > 0 ? "4" : "3"}
                  label={`CGST @ ${snap.gstRate / 2}%`}
                  value={formatINR(snap.cgst)}
                  note="Central Goods & Services Tax on taxable amount"
                />
                <FormulaStep
                  step={snap.discountAmount > 0 ? "5" : "4"}
                  label={`SGST @ ${snap.gstRate / 2}%`}
                  value={formatINR(snap.sgst)}
                  note="State Goods & Services Tax on taxable amount"
                />
                {snap.prorationDays && (
                  <FormulaStep
                    step="Pro"
                    label="Prorated Period"
                    value={`${snap.prorationDays} days`}
                    note="Charge adjusted for partial billing period"
                  />
                )}
                <FormulaStep
                  step="✓"
                  label="Final Invoice Amount"
                  value={formatINR(snap.finalAmount)}
                  note="Taxable amount plus CGST and SGST"
                  highlight
                />
              </CardContent>
            </Card>

            {/* Machine-readable formula */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Machine Formula</CardTitle>
                <CardDescription>Frozen arithmetic expression used by the billing engine</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-charcoal rounded-lg p-4 font-mono text-xs text-ivory-50 leading-relaxed overflow-x-auto whitespace-pre-wrap break-all">
                  {snap.formula}
                </div>
              </CardContent>
            </Card>

            {/* Line items */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Invoice Line Items</CardTitle>
                <CardDescription>Individual charges composing this invoice</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="pb-2 text-[10px] font-bold uppercase tracking-wider text-charcoal-muted">Description</th>
                        <th className="pb-2 text-right text-[10px] font-bold uppercase tracking-wider text-charcoal-muted">Qty</th>
                        <th className="pb-2 text-right text-[10px] font-bold uppercase tracking-wider text-charcoal-muted">Unit</th>
                        <th className="pb-2 text-right text-[10px] font-bold uppercase tracking-wider text-charcoal-muted">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoice.lineItems.map((li) => (
                        <LineItemRow
                          key={li.id}
                          description={li.description}
                          qty={li.quantity}
                          unitPrice={li.unitPrice}
                          amount={li.amount}
                          type={li.type}
                        />
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-charcoal/20">
                        <td colSpan={3} className="pt-3 text-right text-xs font-bold uppercase tracking-wider text-charcoal-muted pr-4">
                          Invoice Total
                        </td>
                        <td className="pt-3 text-right font-mono font-bold text-charcoal tabular-nums">
                          {formatINR(invoice.totalAmount)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* Summary sub-totals */}
                <div className="mt-4 pt-4 border-t border-border space-y-1.5">
                  {[
                    { label: "Subtotal (Gross)", value: formatINR(invoice.subtotal) },
                    ...(invoice.discountTotal > 0 ? [{ label: "Discount", value: `−${formatINR(invoice.discountTotal)}` }] : []),
                    { label: "Tax (GST)", value: formatINR(invoice.taxTotal) },
                  ].map((row) => (
                    <div key={row.label} className="flex justify-between text-xs">
                      <span className="text-charcoal-soft">{row.label}</span>
                      <span className="font-mono text-charcoal">{row.value}</span>
                    </div>
                  ))}
                  <div className="flex justify-between text-sm font-bold pt-2 border-t border-border">
                    <span className="text-charcoal">Total Due</span>
                    <span className="font-mono tabular-nums text-charcoal">{formatINR(invoice.totalAmount)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

export default function InvoicePassportPage() {
  return (
    <Suspense fallback={<div className="p-8 text-charcoal-soft text-sm">Loading Invoice Passport…</div>}>
      <InvoicePassportContent />
    </Suspense>
  );
}
