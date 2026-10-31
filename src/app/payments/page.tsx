"use client";

import React, { useState } from "react";
import { useApp } from "@/context/app-context";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatINR, formatDate } from "@/lib/utils";
import { Payment, PaymentStatus } from "@/types";
import Link from "next/link";

const METHOD_ICONS: Record<string, string> = {
  UPI: "🔵",
  "Net Banking": "🏦",
  "Credit Card": "💳",
  "Bank Transfer": "🏧",
};

function StatusBadge({ status }: { status: PaymentStatus }) {
  if (status === "Paid") return <Badge variant="passed" dot>Paid</Badge>;
  if (status === "Pending") return <Badge variant="warning" dot>Pending</Badge>;
  return <Badge variant="critical" dot>Failed</Badge>;
}

export default function PaymentsPage() {
  const { payments, invoices, updatePaymentStatus } = useApp();

  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // KPI calculations
  const totalCollected = payments
    .filter((p) => p.status === "Paid")
    .reduce((sum, p) => sum + p.amount, 0);
  const pendingTotal = payments
    .filter((p) => p.status === "Pending")
    .reduce((sum, p) => sum + p.amount, 0);
  const failedTotal = payments
    .filter((p) => p.status === "Failed")
    .reduce((sum, p) => sum + p.amount, 0);

  const filtered =
    statusFilter === "All"
      ? payments
      : payments.filter((p) => p.status === statusFilter);

  /** Demo toggle: cycles Pending → Paid → Failed → Pending */
  const handleStatusToggle = (payment: Payment) => {
    setTogglingId(payment.id);
    const next: PaymentStatus =
      payment.status === "Pending" ? "Paid"
      : payment.status === "Paid" ? "Failed"
      : "Pending";
    setTimeout(() => {
      updatePaymentStatus(payment.id, next);
      setTogglingId(null);
    }, 400);
  };

  const getLinkedInvoice = (invoiceId: string) =>
    invoices.find((inv) => inv.id === invoiceId);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-ivory-200 border border-border text-[10px] font-bold uppercase tracking-wider text-charcoal mb-1">
            <span>Payment Ledger</span>
            <span className="w-1.5 h-1.5 rounded-full bg-gold" />
            <span>Demo Mode</span>
          </div>
          <h2 className="text-xl lg:text-2xl font-bold tracking-tight text-charcoal">Payments</h2>
          <p className="text-xs text-charcoal-soft mt-0.5">
            Payment records linked to invoices. Toggle status to simulate payment outcomes.
          </p>
        </div>
      </div>

      {/* Demo Notice */}
      <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs">
        <svg className="w-4 h-4 text-amber-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="font-semibold text-amber-700">Demo Mode</span>
        <span className="text-charcoal-soft">
          — No real payment gateway is connected. Click the status badge on any row to cycle between Paid / Pending / Failed states and observe linked invoice updates.
        </span>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-[10px] font-bold uppercase tracking-wider text-charcoal-muted mb-1">Total Collected</div>
            <div className="text-xl font-bold font-mono text-integrity-passed tabular-nums">{formatINR(totalCollected)}</div>
            <div className="text-xs text-charcoal-soft mt-0.5">
              {payments.filter((p) => p.status === "Paid").length} successful transactions
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-[10px] font-bold uppercase tracking-wider text-charcoal-muted mb-1">Pending</div>
            <div className="text-xl font-bold font-mono text-amber-600 tabular-nums">{formatINR(pendingTotal)}</div>
            <div className="text-xs text-charcoal-soft mt-0.5">
              {payments.filter((p) => p.status === "Pending").length} awaiting clearance
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-[10px] font-bold uppercase tracking-wider text-charcoal-muted mb-1">Failed</div>
            <div className="text-xl font-bold font-mono text-integrity-critical tabular-nums">{formatINR(failedTotal)}</div>
            <div className="text-xs text-charcoal-soft mt-0.5">
              {payments.filter((p) => p.status === "Failed").length} failed transactions
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payments Table */}
      <Card>
        <CardContent className="p-0">
          {/* Filter bar */}
          <div className="flex items-center gap-2 p-4 border-b border-border flex-wrap">
            <span className="text-[10px] font-bold uppercase tracking-wider text-charcoal-muted mr-1">Status:</span>
            {(["All", "Paid", "Pending", "Failed"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${
                  statusFilter === s
                    ? "bg-charcoal text-ivory-50 border-charcoal"
                    : "bg-transparent text-charcoal-soft border-border hover:border-charcoal-light hover:text-charcoal"
                }`}
              >
                {s}
                {s !== "All" && (
                  <span className="ml-1 opacity-60">({payments.filter((p) => p.status === s).length})</span>
                )}
              </button>
            ))}
            <span className="ml-auto text-xs text-charcoal-muted">
              {filtered.length} of {payments.length} records
            </span>
          </div>

          {filtered.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-sm text-charcoal-soft">No payment records match this filter.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    {["Transaction Ref", "Invoice", "Customer", "Method", "Amount", "Date", "Status", "Action"].map((col) => (
                      <th key={col} className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-charcoal-muted whitespace-nowrap">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((payment) => {
                    const linkedInv = getLinkedInvoice(payment.invoiceId);
                    const isToggling = togglingId === payment.id;
                    return (
                      <tr key={payment.id} className="border-b border-border last:border-0 hover:bg-surface-muted transition-colors">
                        {/* Transaction Ref */}
                        <td className="px-4 py-3">
                          <span className="font-mono text-xs text-charcoal-soft">{payment.transactionReference}</span>
                        </td>

                        {/* Invoice */}
                        <td className="px-4 py-3">
                          {linkedInv ? (
                            <Link href={`/invoice-passport?invoiceId=${linkedInv.id}`}>
                              <span className="text-xs font-semibold text-charcoal hover:text-gold transition-colors cursor-pointer underline-offset-2 hover:underline">
                                {payment.invoiceNumber}
                              </span>
                            </Link>
                          ) : (
                            <span className="text-xs text-charcoal">{payment.invoiceNumber}</span>
                          )}
                        </td>

                        {/* Customer */}
                        <td className="px-4 py-3">
                          <span className="text-sm text-charcoal font-medium">{payment.customerName}</span>
                        </td>

                        {/* Method */}
                        <td className="px-4 py-3">
                          <span className="text-xs text-charcoal-soft">
                            {METHOD_ICONS[payment.paymentMethod] || "💰"} {payment.paymentMethod}
                          </span>
                        </td>

                        {/* Amount */}
                        <td className="px-4 py-3">
                          <span className="font-mono font-bold text-sm text-charcoal tabular-nums">
                            {formatINR(payment.amount)}
                          </span>
                        </td>

                        {/* Date */}
                        <td className="px-4 py-3">
                          <span className="text-xs text-charcoal-soft whitespace-nowrap">
                            {new Date(payment.timestamp).toLocaleDateString("en-IN", {
                              day: "2-digit", month: "short", year: "numeric",
                            })}
                          </span>
                        </td>

                        {/* Status */}
                        <td className="px-4 py-3">
                          <StatusBadge status={payment.status} />
                        </td>

                        {/* Action */}
                        <td className="px-4 py-3">
                          <button
                            onClick={() => handleStatusToggle(payment)}
                            disabled={isToggling}
                            className={`px-2.5 py-1 rounded text-[11px] font-semibold border transition-all ${
                              isToggling
                                ? "opacity-50 cursor-not-allowed bg-border text-charcoal-muted border-border"
                                : "bg-ivory-200 text-charcoal border-border hover:bg-ivory-300 hover:border-charcoal-light cursor-pointer"
                            }`}
                          >
                            {isToggling ? "…" : "Toggle Status"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Go to Invoices CTA */}
      <div className="flex items-center justify-between p-4 rounded-xl bg-ivory-200 border border-border">
        <div>
          <div className="text-sm font-semibold text-charcoal">Need to generate a new payment record?</div>
          <div className="text-xs text-charcoal-soft mt-0.5">
            Generate an invoice first, then it will appear here for payment tracking.
          </div>
        </div>
        <Link href="/invoices">
          <Button variant="gold" size="sm">Go to Invoices →</Button>
        </Link>
      </div>
    </div>
  );
}
