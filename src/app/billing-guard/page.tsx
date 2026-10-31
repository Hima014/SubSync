"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useApp } from "@/context/app-context";
import { runBillingGuardAudit, GuardAuditReport } from "@/lib/billing-validator";
import { IntegrityCheckCard } from "@/components/billing/integrity-check-card";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

function BillingGuardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const querySubId = searchParams.get("subId");

  const {
    subscriptions,
    invoices,
    customers,
    plans,
    remediateSubscription,
    generateInvoiceFromSubscription,
    updateSubscription,
  } = useApp();

  const [selectedSubId, setSelectedSubId] = useState<string>(
    querySubId || subscriptions[0]?.id || ""
  );
  const [report, setReport] = useState<GuardAuditReport | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [expandedRules, setExpandedRules] = useState<Set<string>>(new Set());
  const [invoiceResult, setInvoiceResult] = useState<{ success: boolean; message: string } | null>(null);

  const selectedSub = subscriptions.find((s) => s.id === selectedSubId) || subscriptions[0];

  const runAudit = () => {
    if (!selectedSub) return;
    setIsRunning(true);
    setInvoiceResult(null);

    // Simulate brief analysis delay for visual impact
    setTimeout(() => {
      const auditReport = runBillingGuardAudit({
        subscription: selectedSub,
        existingInvoices: invoices,
        customers,
        plans,
      });

      setReport(auditReport);

      // Sync integrity status back to subscription
      updateSubscription(selectedSub.id, {
        integrityStatus: auditReport.overallStatus,
        integrityNotes: auditReport.checks
          .filter((c) => c.severity !== "Passed")
          .map((c) => c.message)
          .join(" | ") || "All audit checks passed.",
        lastAuditedAt: auditReport.auditedAt,
      });

      // Auto-expand failed checks
      const failed = new Set(
        auditReport.checks
          .filter((c) => c.severity !== "Passed")
          .map((c) => c.ruleId)
      );
      setExpandedRules(failed);
      setIsRunning(false);
    }, 900);
  };

  const handleAutoFix = (remedy: "clear-duplicate" | "remove-expired-discount" | "sync-catalog-price" | "activate-account") => {
    if (!selectedSub) return;
    remediateSubscription(selectedSub.id, remedy);
    setReport(null);
    setInvoiceResult(null);
  };

  const handleGenerateInvoice = () => {
    if (!selectedSub) return;
    const result = generateInvoiceFromSubscription(selectedSub.id);
    if (result.success && result.invoice) {
      setInvoiceResult({
        success: true,
        message: `Invoice ${result.invoice.invoiceNumber} generated successfully for ${result.invoice.customerName} — ₹${result.invoice.totalAmount.toLocaleString("en-IN")}`,
      });
    } else {
      setInvoiceResult({
        success: false,
        message: result.error || "Invoice generation blocked by Billing Integrity Guard.",
      });
    }
  };

  const toggleRule = (ruleId: string) => {
    setExpandedRules((prev) => {
      const next = new Set(prev);
      next.has(ruleId) ? next.delete(ruleId) : next.add(ruleId);
      return next;
    });
  };

  const criticalChecks = report?.checks.filter((c) => c.severity === "Critical") || [];
  const warningChecks = report?.checks.filter((c) => c.severity === "Warning") || [];
  const passedChecks = report?.checks.filter((c) => c.severity === "Passed") || [];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-charcoal text-gold text-[10px] font-bold uppercase tracking-wider mb-1.5">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span>Core Differentiating Feature</span>
          </div>
          <h2 className="text-xl lg:text-2xl font-bold tracking-tight text-charcoal">
            Billing Integrity Guard
          </h2>
          <p className="text-xs text-charcoal-soft mt-0.5">
            8-rule automated pre-invoice sanity audit engine. Critical errors block invoice generation.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/billing-engine">
            <Button variant="outline" size="sm">View Billing Engine</Button>
          </Link>
        </div>
      </div>

      {/* Summary counters when report is available */}
      {report && (
        <div className="grid grid-cols-3 gap-3">
          <div className={cn(
            "p-3.5 rounded-xl border text-center shadow-xs",
            criticalChecks.length > 0
              ? "border-integrity-critical-border bg-integrity-critical-bg/30"
              : "border-border bg-white"
          )}>
            <span className={cn(
              "text-2xl font-bold font-mono block",
              criticalChecks.length > 0 ? "text-integrity-critical" : "text-charcoal"
            )}>
              {criticalChecks.length}
            </span>
            <span className="text-[10px] font-bold uppercase text-integrity-critical block">Critical</span>
            <span className="text-[10px] text-charcoal-soft">Invoice blocked</span>
          </div>

          <div className={cn(
            "p-3.5 rounded-xl border text-center shadow-xs",
            warningChecks.length > 0
              ? "border-integrity-warning-border bg-integrity-warning-bg/30"
              : "border-border bg-white"
          )}>
            <span className={cn(
              "text-2xl font-bold font-mono block",
              warningChecks.length > 0 ? "text-integrity-warning" : "text-charcoal"
            )}>
              {warningChecks.length}
            </span>
            <span className="text-[10px] font-bold uppercase text-integrity-warning block">Warnings</span>
            <span className="text-[10px] text-charcoal-soft">Review advised</span>
          </div>

          <div className="p-3.5 rounded-xl border border-integrity-passed-border bg-integrity-passed-bg/30 text-center shadow-xs">
            <span className="text-2xl font-bold font-mono text-integrity-passed block">
              {passedChecks.length}
            </span>
            <span className="text-[10px] font-bold uppercase text-integrity-passed block">Passed</span>
            <span className="text-[10px] text-charcoal-soft">Verified clean</span>
          </div>
        </div>
      )}

      {/* Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Left: Subscription Selector & Controls */}
        <div className="lg:col-span-4 space-y-4">

          <Card>
            <CardHeader>
              <CardTitle>Audit Target</CardTitle>
              <CardDescription>Select a subscription to run pre-invoice integrity validation</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select
                label="Select Subscription"
                value={selectedSubId}
                onChange={(e) => {
                  setSelectedSubId(e.target.value);
                  setReport(null);
                  setInvoiceResult(null);
                }}
                options={subscriptions.map((s) => ({
                  value: s.id,
                  label: `${s.customerName || s.id} — ${s.planName}`,
                }))}
              />

              {selectedSub && (
                <div className="space-y-2 p-3 rounded-lg bg-surface-muted border border-border text-xs">
                  <div className="flex justify-between">
                    <span className="text-charcoal-soft">Customer:</span>
                    <span className="font-semibold text-charcoal">{selectedSub.customerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-charcoal-soft">Plan:</span>
                    <span className="font-semibold text-charcoal">{selectedSub.planName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-charcoal-soft">Seats:</span>
                    <span className="font-mono text-charcoal">{selectedSub.seats}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-charcoal-soft">Unit Rate:</span>
                    <span className="font-mono text-charcoal">₹{selectedSub.unitPrice.toLocaleString("en-IN")}</span>
                  </div>
                  {selectedSub.discountCode && (
                    <div className="flex justify-between">
                      <span className="text-charcoal-soft">Voucher:</span>
                      <span className="font-mono font-bold text-charcoal">
                        {selectedSub.discountCode} ({selectedSub.discountPercentage}%)
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-charcoal-soft">Billing Period:</span>
                    <span className="font-mono text-charcoal text-[10px]">
                      {selectedSub.billingPeriodStart} → {selectedSub.billingPeriodEnd}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-1 border-t border-border/50">
                    <span className="text-charcoal-soft">Status:</span>
                    <Badge
                      variant={
                        selectedSub.integrityStatus === "Passed"
                          ? "passed"
                          : selectedSub.integrityStatus === "Warning"
                          ? "warning"
                          : "critical"
                      }
                      size="sm"
                      dot
                    >
                      {selectedSub.integrityStatus}
                    </Badge>
                  </div>
                </div>
              )}

              <Button
                variant="gold"
                size="md"
                onClick={runAudit}
                isLoading={isRunning}
                className="w-full shadow-xs font-semibold"
              >
                <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                {isRunning ? "Running 8 Audit Checks..." : "Run Integrity Audit"}
              </Button>
            </CardContent>
          </Card>

          {/* Auto-Fix Panel */}
          {report && !report.canGenerateInvoice && (
            <Card className="border-integrity-critical-border bg-integrity-critical-bg/20">
              <CardHeader>
                <CardTitle className="text-integrity-critical">Remediation Console</CardTitle>
                <CardDescription>Available auto-fix actions for detected issues</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {criticalChecks.some((c) => c.ruleId === "RULE_DUPLICATE_PERIOD") && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleAutoFix("clear-duplicate")}
                    className="w-full justify-start text-xs"
                  >
                    🔧 Auto-Fix: Shift Billing Cycle Forward
                  </Button>
                )}
                {criticalChecks.some((c) => c.ruleId === "RULE_EXPIRED_DISCOUNT") && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleAutoFix("remove-expired-discount")}
                    className="w-full justify-start text-xs"
                  >
                    🔧 Auto-Fix: Remove Expired Voucher
                  </Button>
                )}
                {(criticalChecks.some((c) => c.ruleId === "RULE_INELIGIBLE_STATUS")) && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleAutoFix("activate-account")}
                    className="w-full justify-start text-xs"
                  >
                    🔧 Auto-Fix: Reactivate Account
                  </Button>
                )}
                {warningChecks.some((c) => c.ruleId === "RULE_PRICE_MISMATCH") && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleAutoFix("sync-catalog-price")}
                    className="w-full justify-start text-xs"
                  >
                    🔧 Sync Catalog Price
                  </Button>
                )}
                <p className="text-[10px] text-charcoal-soft">
                  After applying a fix, re-run the audit to confirm the error is cleared before generating an invoice.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Generate Invoice CTA */}
          {report && (
            <Card className={cn(
              "border",
              report.canGenerateInvoice
                ? "border-integrity-passed-border bg-integrity-passed-bg/30"
                : "border-integrity-critical-border bg-integrity-critical-bg/20"
            )}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                  {report.canGenerateInvoice ? (
                    <>
                      <svg className="w-5 h-5 text-integrity-passed" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div>
                        <p className="text-xs font-bold text-charcoal">Invoice Gate: OPEN</p>
                        <p className="text-[10px] text-charcoal-soft">All critical checks cleared</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 text-integrity-critical" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                      </svg>
                      <div>
                        <p className="text-xs font-bold text-integrity-critical">Invoice Gate: LOCKED</p>
                        <p className="text-[10px] text-charcoal-soft">{criticalChecks.length} critical issue{criticalChecks.length > 1 ? "s" : ""} must be resolved</p>
                      </div>
                    </>
                  )}
                </div>

                <Button
                  variant={report.canGenerateInvoice ? "primary" : "danger"}
                  size="sm"
                  onClick={handleGenerateInvoice}
                  disabled={!report.canGenerateInvoice}
                  className="w-full"
                >
                  {report.canGenerateInvoice ? "Generate Invoice →" : "Invoice Generation Blocked"}
                </Button>

                {invoiceResult && (
                  <div className={cn(
                    "p-2.5 rounded-lg text-xs",
                    invoiceResult.success
                      ? "bg-integrity-passed-bg border border-integrity-passed-border text-integrity-passed"
                      : "bg-integrity-critical-bg border border-integrity-critical-border text-integrity-critical"
                  )}>
                    {invoiceResult.success ? "✅" : "🚫"} {invoiceResult.message}
                    {invoiceResult.success && (
                      <div className="mt-1.5">
                        <Link href="/invoices" className="underline font-medium">View Invoice →</Link>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right: Audit Results Panel */}
        <div className="lg:col-span-8">
          {!report && !isRunning && (
            <Card className="flex items-center justify-center min-h-[400px]">
              <div className="text-center p-8 max-w-sm">
                <div className="w-16 h-16 mx-auto rounded-full bg-ivory-200 border border-border flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-charcoal-light" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h3 className="text-sm font-semibold text-charcoal mb-1">8-Rule Integrity Check Ready</h3>
                <p className="text-xs text-charcoal-soft leading-relaxed">
                  Select a subscription and click "Run Integrity Audit" to execute all pre-invoice sanity checks and receive a pass/block decision.
                </p>
              </div>
            </Card>
          )}

          {isRunning && (
            <Card className="min-h-[400px] flex items-center justify-center">
              <div className="text-center space-y-3">
                <div className="w-12 h-12 mx-auto rounded-full border-4 border-gold/30 border-t-gold animate-spin" />
                <p className="text-sm font-semibold text-charcoal">Running 8 Audit Checks...</p>
                <p className="text-xs text-charcoal-soft">Verifying duplicate periods, price drift, discount validity, account status...</p>
              </div>
            </Card>
          )}

          {report && !isRunning && (
            <Card>
              <CardHeader className="border-b border-border/80">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <CardTitle>Audit Report: {report.customerName}</CardTitle>
                      <Badge
                        variant={
                          report.overallStatus === "Passed"
                            ? "passed"
                            : report.overallStatus === "Warning"
                            ? "warning"
                            : "critical"
                        }
                        dot
                      >
                        {report.overallStatus}
                      </Badge>
                    </div>
                    <CardDescription>
                      Subscription {report.subscriptionId} •{" "}
                      {report.checks.length} rules evaluated •{" "}
                      Completed {new Date(report.auditedAt).toLocaleTimeString("en-IN")}
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setExpandedRules(new Set(report.checks.map(c => c.ruleId)))}
                    className="text-xs self-start sm:self-auto"
                  >
                    Expand All
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="pt-4 space-y-2">
                {/* Critical first, then warning, then passed */}
                {[...criticalChecks, ...warningChecks, ...passedChecks].map((check, i) => (
                  <IntegrityCheckCard
                    key={check.ruleId}
                    check={check}
                    index={report.checks.findIndex(c => c.ruleId === check.ruleId)}
                    isExpanded={expandedRules.has(check.ruleId)}
                    onToggle={() => toggleRule(check.ruleId)}
                  />
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

export default function BillingGuardPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-charcoal-soft">Loading integrity guard...</div>}>
      <BillingGuardContent />
    </Suspense>
  );
}
