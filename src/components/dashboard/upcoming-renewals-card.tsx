import React from "react";
import Link from "next/link";
import { Subscription } from "@/types";
import { formatINR, formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

interface UpcomingRenewalsCardProps {
  subscriptions: Subscription[];
}

export function UpcomingRenewalsCard({ subscriptions }: UpcomingRenewalsCardProps) {
  return (
    <Card className="flex flex-col justify-between">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Upcoming Renewals</CardTitle>
          <Badge variant="neutral" size="sm">
            Next 30 Days
          </Badge>
        </div>
        <CardDescription>
          Subscription renewals queued for upcoming billing cycles
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-3">
        {subscriptions.slice(0, 4).map((sub) => {
          const estimatedTotal = sub.unitPrice * sub.seats * 1.18; // approx with 18% tax

          return (
            <div
              key={sub.id}
              className="p-3 rounded-lg border border-border/80 bg-surface-muted/30 hover:bg-surface-muted/70 transition-colors flex items-center justify-between gap-3 text-xs"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-charcoal truncate">
                    {sub.customerName || sub.customerId}
                  </span>
                  {sub.integrityStatus === "Passed" ? (
                    <Badge variant="passed" size="sm" dot>
                      Ready
                    </Badge>
                  ) : sub.integrityStatus === "Warning" ? (
                    <Badge variant="warning" size="sm" dot>
                      Review
                    </Badge>
                  ) : (
                    <Badge variant="critical" size="sm" dot>
                      Blocked
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 text-charcoal-soft mt-1 text-[11px]">
                  <span>{sub.planName} ({sub.seats} seats)</span>
                  <span>•</span>
                  <span>Due {formatDate(sub.renewalDate)}</span>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="font-mono font-bold text-charcoal block">
                  ~{formatINR(estimatedTotal, { minimumFractionDigits: 0 })}
                </span>
                <Link
                  href="/billing-guard"
                  className="text-[10px] text-charcoal-soft hover:text-charcoal underline"
                >
                  Verify Cycle
                </Link>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

