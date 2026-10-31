"use client";

import React, { useState, Suspense } from "react";
import { useApp } from "@/context/app-context";
import { InvoiceTable } from "@/components/invoices/invoice-table";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Modal } from "@/components/ui/modal";
import { formatINR } from "@/lib/utils";
import { Invoice } from "@/types";
import Link from "next/link";

function InvoicesContent() {
  const {
    invoices,
    subscriptions,
    updateInvoiceStatus,
    generateInvoiceFromSubscription,
    integrityAlertsCount,
  } = useApp();

  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [generateSubId, setGenerateSubId] = useState(subscriptions[0]?.id || "");
  const [generateResult, setGenerateResult] = useState<{
    success: boolean;
    invoice?: Invoice;
    error?: string;
  } | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // KPI calculations
  const totalInvoiced = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
  const paidTotal = invoices
    .filter((inv) => inv.status === "Paid")
    .reduce((sum, inv) => sum + inv.totalAmount, 0);
  const pendingTotal = invoices
    .filter((inv) => inv.status === "Issued")
    .reduce((sum, inv) => sum + inv.totalAmount, 0);
  const overdueCount = invoices.filter((inv) => inv.status === "Overdue").length;

  const filtered =
    statusFilter === "All"
      ? invoices
      : invoices.filter((inv) => inv.status === statusFilter);

  const handleGenerate = () => {
    if (!generateSubId) return;
    setIsGenerating(true);
    setTimeout(() => {
      const result = generateInvoiceFromSubscription(generateSubId);
      setGenerateResult(result);
      setIsGenerating(false);
    }, 800);
  };

  const handleCloseGenerateModal = () => {
    setShowGenerateModal(false);
    setGenerateResult(null);
    setIsGenerating(false);
  };

  const selectedSub = subscriptions.find((s) => s.id === generateSubId);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-ivory-200 border border-border text-[10px] font-bold uppercase tracking-wider text-charcoal mb-1">
            <span>Invoice Ledger</span>
            <span className="w-1.5 h-1.5 rounded-full bg-gold" />
            <span>Guard-Gated Generation</span>
          </div>
          <h2 className="text-xl lg:text-2xl font-bold tracking-tight text-charcoal">Invoices</h2>
          <p className="text-xs text-charcoal-soft mt-0.5">
            All invoices generated after Billing Integrity Guard validation
          </p>
        </div>
        <Button variant="gold" size="sm" onClick={() => setShowGenerateModal(true)}>
          + Generate Invoice
        </Button>
      </div>

      {/* Integrity Guard alert banner */}
      {integrityAlertsCount.critical > 0 && (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-integrity-critical-bg border border-integrity-critical-border text-xs flex-wrap">
          <svg className="w-4 h-4 text-integrity-critical shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
          <span className="font-semibold text-integrity-critical">
            {integrityAlertsCount.critical} subscription{integrityAlertsCount.critical > 1 ? "s" : ""} blocked from invoice generation
          </span>
          <span className="text-charcoal-muted">—</span>
          <span className="text-charcoal-soft">Resolve billing errors in the Guard before generating invoices.</span>
          <Link href="/billing-guard" className="ml-auto">
            <Button variant="outline" size="sm" className="text-integrity-critical border-integrity-critical-border">
              Open Guard →
            </Button>
          </Link>
        </div>
      )}

      {/* KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Invoiced", value: formatINR(totalInvoiced), sub: `${invoices.length} invoices`, color: "text-charcoal" },
          { label: "Collected", value: formatINR(paidTotal), sub: `${invoices.filter((i) => i.status === "Paid").length} paid`, color: "text-integrity-passed" },
          { label: "Outstanding", value: formatINR(pendingTotal), sub: `${invoices.filter((i) => i.status === "Issued").length} issued`, color: "text-amber-600" },
          { label: "Overdue", value: String(overdueCount), sub: overdueCount > 0 ? "Require follow-up" : "All current", color: overdueCount > 0 ? "text-integrity-critical" : "text-integrity-passed" },
        ].map((kpi) => (
          <Card key={kpi.label}>
            <CardContent className="p-4">
              <div className="text-[10px] font-bold uppercase tracking-wider text-charcoal-muted mb-1">{kpi.label}</div>
              <div className={`text-xl font-bold font-mono tabular-nums ${kpi.color}`}>{kpi.value}</div>
              <div className="text-xs text-charcoal-soft mt-0.5">{kpi.sub}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Table card with filters */}
      <Card>
        <CardContent className="p-0">
          <div className="flex items-center gap-2 p-4 border-b border-border flex-wrap">
            <span className="text-[10px] font-bold uppercase tracking-wider text-charcoal-muted mr-1">Status:</span>
            {(["All", "Issued", "Paid", "Overdue", "Draft"] as const).map((s) => (
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
                  <span className="ml-1 opacity-60">
                    ({invoices.filter((i) => i.status === s).length})
                  </span>
                )}
              </button>
            ))}
            <span className="ml-auto text-xs text-charcoal-muted">
              Showing {filtered.length} of {invoices.length}
            </span>
          </div>
          <div className="p-4">
            <InvoiceTable invoices={filtered} onStatusChange={(id, status) => updateInvoiceStatus(id, status)} />
          </div>
        </CardContent>
      </Card>

      {/* Generate Invoice Modal */}
      <Modal isOpen={showGenerateModal} onClose={handleCloseGenerateModal} title="Generate Invoice" maxWidth="md">
        <div className="space-y-5">
          {!generateResult ? (
            <>
              <p className="text-sm text-charcoal-soft">
                The Billing Integrity Guard runs automatically before creation. Critical errors block generation.
              </p>

              <Select
                label="Select Subscription"
                value={generateSubId}
                onChange={(e) => setGenerateSubId(e.target.value)}
                options={subscriptions.map((s) => ({
                  value: s.id,
                  label: `${s.customerName} — ${s.planName} [${s.integrityStatus}]`,
                }))}
              />

              {selectedSub && (
                <div className={`p-3 rounded-lg border text-xs space-y-1 ${
                  selectedSub.integrityStatus === "Critical"
                    ? "bg-integrity-critical-bg border-integrity-critical-border"
                    : selectedSub.integrityStatus === "Warning"
                    ? "bg-integrity-warning-bg border-integrity-warning-border"
                    : "bg-integrity-passed-bg border-integrity-passed-border"
                }`}>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        selectedSub.integrityStatus === "Critical"
                          ? "critical"
                          : selectedSub.integrityStatus === "Warning"
                          ? "warning"
                          : "passed"
                      }
                      dot
                    >
                      {selectedSub.integrityStatus}
                    </Badge>
                    <span className="font-semibold text-charcoal">Guard Status</span>
                  </div>
                  {selectedSub.integrityNotes && (
                    <p className="text-charcoal-soft leading-relaxed">{selectedSub.integrityNotes}</p>
                  )}
                  {selectedSub.integrityStatus === "Critical" && (
                    <Link href={`/billing-guard?subId=${selectedSub.id}`} onClick={handleCloseGenerateModal}>
                      <span className="inline-block mt-1 text-integrity-critical font-semibold underline underline-offset-2 cursor-pointer">
                        Resolve in Billing Guard →
                      </span>
                    </Link>
                  )}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Button variant="secondary" onClick={handleCloseGenerateModal} className="flex-1">Cancel</Button>
                <Button
                  variant="gold"
                  onClick={handleGenerate}
                  className="flex-1"
                  disabled={isGenerating || !generateSubId}
                >
                  {isGenerating ? (
                    <span className="flex items-center gap-2 justify-center">
                      <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Running Guard…
                    </span>
                  ) : "Generate Invoice"}
                </Button>
              </div>
            </>
          ) : generateResult.success && generateResult.invoice ? (
            <div className="space-y-4">
              <div className="flex flex-col items-center text-center p-6 bg-integrity-passed-bg border border-integrity-passed-border rounded-xl">
                <div className="w-12 h-12 rounded-full bg-integrity-passed/10 border border-integrity-passed-border flex items-center justify-center mb-3">
                  <svg className="w-6 h-6 text-integrity-passed" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="font-bold text-charcoal">Invoice Generated Successfully</h3>
                <p className="text-xs text-charcoal-soft mt-1">{generateResult.invoice.invoiceNumber} — {generateResult.invoice.customerName}</p>
                <div className="text-2xl font-bold font-mono text-charcoal tabular-nums mt-2">
                  {formatINR(generateResult.invoice.totalAmount)}
                </div>
              </div>
              <div className="flex gap-3">
                <Button variant="secondary" onClick={handleCloseGenerateModal} className="flex-1">Close</Button>
                <Link href={`/invoice-passport?invoiceId=${generateResult.invoice.id}`} className="flex-1" onClick={handleCloseGenerateModal}>
                  <Button variant="gold" className="w-full">View Invoice Passport →</Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-integrity-critical-bg border border-integrity-critical-border rounded-xl">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-integrity-critical shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                  </svg>
                  <div>
                    <p className="text-sm font-bold text-integrity-critical">Invoice Generation Blocked</p>
                    <p className="text-xs text-charcoal-soft mt-1 leading-relaxed">{generateResult.error}</p>
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <Button variant="secondary" onClick={handleCloseGenerateModal} className="flex-1">Close</Button>
                <Link href="/billing-guard" className="flex-1" onClick={handleCloseGenerateModal}>
                  <Button variant="outline" className="w-full border-integrity-critical-border text-integrity-critical">
                    Resolve in Guard →
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}

export default function InvoicesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-charcoal-soft text-sm">Loading invoices…</div>}>
      <InvoicesContent />
    </Suspense>
  );
}
