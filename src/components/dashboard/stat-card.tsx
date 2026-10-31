import React from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string;
  subtext?: string;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  icon?: React.ReactNode;
  variant?: "default" | "gold" | "warning" | "critical" | "passed";
}

export function StatCard({
  title,
  value,
  subtext,
  trend,
  icon,
  variant = "default",
}: StatCardProps) {
  const borderVariants = {
    default: "border-border",
    gold: "border-gold/40 bg-gradient-to-b from-white to-gold-50/40",
    warning: "border-integrity-warning-border bg-integrity-warning-bg/30",
    critical: "border-integrity-critical-border bg-integrity-critical-bg/30",
    passed: "border-integrity-passed-border bg-integrity-passed-bg/30",
  };

  return (
    <Card hover className={cn("p-5 flex flex-col justify-between", borderVariants[variant])}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-charcoal-soft">
            {title}
          </p>
          <h4 className="text-2xl font-bold tracking-tight text-charcoal mt-1 tabular-nums">
            {value}
          </h4>
        </div>
        {icon && (
          <div className="p-2.5 rounded-lg bg-ivory-200 text-charcoal-muted border border-border/80">
            {icon}
          </div>
        )}
      </div>

      {(subtext || trend) && (
        <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between text-xs">
          {subtext && <span className="text-charcoal-soft truncate">{subtext}</span>}
          {trend && (
            <span
              className={cn(
                "inline-flex items-center gap-1 font-semibold px-1.5 py-0.5 rounded text-[11px]",
                trend.isPositive
                  ? "text-integrity-passed bg-integrity-passed-bg border border-integrity-passed-border"
                  : "text-integrity-critical bg-integrity-critical-bg border border-integrity-critical-border"
              )}
            >
              {trend.isPositive ? "↑" : "↓"} {trend.value}
            </span>
          )}
        </div>
      )}
    </Card>
  );
}

