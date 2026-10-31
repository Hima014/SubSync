"use client";

import React from "react";
import Link from "next/link";
import { Subscription, SubscriptionStatus } from "@/types";
import { formatINR, formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface SubscriptionTableProps {
  subscriptions: Subscription[];
  onEdit: (subscription: Subscription) => void;
  onStatusChange: (id: string, status: SubscriptionStatus) => void;
}

export function SubscriptionTable({
  subscriptions,
  onEdit,
  onStatusChange,
}: SubscriptionTableProps) {
  const getStatusBadge = (status: SubscriptionStatus) => {
    switch (status) {
      case "Active":
        return <Badge variant="active" dot>Active</Badge>;
      case "Paused":
        return <Badge variant="paused" dot>Paused</Badge>;
      case "Canceled":
        return <Badge variant="canceled" dot>Canceled</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  const getIntegrityBadge = (sub: Subscription) => {
    switch (sub.integrityStatus) {
      case "Passed":
        return (
          <Badge variant="passed" dot title={sub.integrityNotes || "All audit checks passed"}>
            Passed
          </Badge>
        );
      case "Warning":
        return (
          <Badge variant="warning" dot title={sub.integrityNotes || "Review recommended"}>
            Warning
          </Badge>
        );
      case "Critical":
        return (
          <Badge variant="critical" dot title={sub.integrityNotes || "Invoicing Blocked"}>
            Critical
          </Badge>
        );
      default:
        return <Badge variant="neutral">Pending</Badge>;
    }
  };

  if (subscriptions.length === 0) {
    return (
      <div className="py-16 text-center text-charcoal-soft">
        <p className="text-sm font-medium">No subscriptions match your query</p>
        <p className="text-xs mt-1">Adjust filters or assign a new subscription.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse text-xs">
        <thead>
          <tr className="border-b border-border bg-surface-muted/50 text-[11px] font-semibold uppercase tracking-wider text-charcoal-soft">
            <th className="py-3 px-4">Sub ID & Client</th>
            <th className="py-3 px-4">Plan & Seats</th>
            <th className="py-3 px-4 text-right">Unit Rate</th>
            <th className="py-3 px-4">Discount Applied</th>
            <th className="py-3 px-4">Billing Cycle</th>
            <th className="py-3 px-4">Status</th>
            <th className="py-3 px-4">Integrity Gate</th>
            <th className="py-3 px-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/60">
          {subscriptions.map((sub) => {
            const grossSubtotal = sub.unitPrice * sub.seats;

            return (
              <tr key={sub.id} className="hover:bg-ivory-100/50 transition-colors">
                <td className="py-3.5 px-4">
                  <span className="font-mono font-bold text-charcoal block">{sub.id}</span>
                  <span className="text-[11px] text-charcoal-soft font-medium">
                    {sub.customerName || sub.customerId}
                  </span>
                </td>
                <td className="py-3.5 px-4">
                  <span className="font-semibold text-charcoal block">{sub.planName}</span>
                  <span className="text-[11px] text-charcoal-soft font-mono">
                    {sub.seats} provisioned seat{sub.seats > 1 ? "s" : ""}
                  </span>
                </td>
                <td className="py-3.5 px-4 text-right font-mono text-charcoal">
                  <span className="font-semibold block">{formatINR(sub.unitPrice)}</span>
                  <span className="text-[10px] text-charcoal-soft">
                    Gross: {formatINR(grossSubtotal, { minimumFractionDigits: 0 })}
                  </span>
                </td>
                <td className="py-3.5 px-4">
                  {sub.discountPercentage > 0 ? (
                    <div>
                      <span className="font-semibold text-charcoal block font-mono text-[11px]">
                        {sub.discountCode || "VOUCHER"} ({sub.discountPercentage}%)
                      </span>
                      {sub.discountExpiresAt && (
                        <span className="text-[10px] text-charcoal-soft block">
                          Exp: {formatDate(sub.discountExpiresAt)}
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-charcoal-soft italic text-[11px]">No discount</span>
                  )}
                </td>
                <td className="py-3.5 px-4 text-charcoal-muted">
                  <span className="block text-[11px]">
                    {formatDate(sub.billingPeriodStart)} - {formatDate(sub.billingPeriodEnd)}
                  </span>
                  <span className="text-[10px] text-charcoal-soft block">
                    Renews: {formatDate(sub.renewalDate)}
                  </span>
                </td>
                <td className="py-3.5 px-4">
                  {getStatusBadge(sub.status)}
                </td>
                <td className="py-3.5 px-4">
                  <div className="flex flex-col items-start gap-1">
                    {getIntegrityBadge(sub)}
                    {sub.integrityNotes && (
                      <span className="text-[9px] text-charcoal-soft max-w-[140px] truncate" title={sub.integrityNotes}>
                        {sub.integrityNotes}
                      </span>
                    )}
                  </div>
                </td>
                <td className="py-3.5 px-4 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    {/* Guard Link */}
                    <Link href={`/billing-guard?subId=${sub.id}`}>
                      <Button
                        variant={sub.integrityStatus === "Critical" ? "danger" : "gold"}
                        size="sm"
                        className="text-[11px] py-1 px-2.5 shadow-xs"
                      >
                        Audit
                      </Button>
                    </Link>

                    {/* Pause / Resume status */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        onStatusChange(sub.id, sub.status === "Active" ? "Paused" : "Active")
                      }
                      className="text-[11px] py-1 px-2"
                    >
                      {sub.status === "Active" ? "Pause" : "Resume"}
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(sub)}
                      className="text-[11px] py-1 px-2"
                    >
                      Edit
                    </Button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

