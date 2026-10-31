import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface IntegrityAlertBannerProps {
  criticalCount: number;
  warningCount: number;
  passedCount: number;
}

export function IntegrityAlertBanner({
  criticalCount,
  warningCount,
  passedCount,
}: IntegrityAlertBannerProps) {
  const hasIssues = criticalCount > 0 || warningCount > 0;

  if (!hasIssues) {
    return (
      <div className="rounded-xl bg-integrity-passed-bg border border-integrity-passed-border p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-subtle">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center text-integrity-passed shrink-0">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-semibold text-charcoal">
                Billing Integrity Guard: All Systems Verified
              </h4>
              <Badge variant="passed" size="sm" dot>
                {passedCount} Healthy
              </Badge>
            </div>
            <p className="text-xs text-charcoal-muted mt-0.5">
              Zero duplicate periods, price mismatches, or expired promotional vouchers detected across all active accounts.
            </p>
          </div>
        </div>
        <Link href="/billing-guard">
          <Button variant="secondary" size="sm" className="shrink-0 bg-white hover:bg-emerald-50">
            Open Guard
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-integrity-critical-bg/50 border border-integrity-critical-border p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-subtle">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-lg bg-red-100 flex items-center justify-center text-integrity-critical shrink-0 mt-0.5 sm:mt-0">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="text-sm font-semibold text-charcoal">
              Integrity Alert: {criticalCount + warningCount} Discrepancies Detected
            </h4>
            {criticalCount > 0 && (
              <Badge variant="critical" size="sm" dot>
                {criticalCount} Critical (Invoice Blocked)
              </Badge>
            )}
            {warningCount > 0 && (
              <Badge variant="warning" size="sm" dot>
                {warningCount} Warning
              </Badge>
            )}
          </div>
          <p className="text-xs text-charcoal-muted mt-1">
            Pre-invoice audit found duplicate billing cycles and expired promo vouchers. Invoicing is automatically suspended for affected accounts.
          </p>
        </div>
      </div>

      <Link href="/billing-guard">
        <Button variant="danger" size="sm" className="shrink-0 shadow-sm">
          Resolve in Billing Guard →
        </Button>
      </Link>
    </div>
  );
}

