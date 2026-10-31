import React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?:
    | "passed"
    | "warning"
    | "critical"
    | "gold"
    | "neutral"
    | "active"
    | "paused"
    | "canceled"
    | "outline";
  size?: "sm" | "md";
  dot?: boolean;
}

export function Badge({
  className,
  variant = "neutral",
  size = "md",
  dot = false,
  children,
  ...props
}: BadgeProps) {
  const baseStyles = "inline-flex items-center font-medium rounded-full select-none";

  const sizeStyles = {
    sm: "text-[11px] px-2 py-0.5 gap-1",
    md: "text-xs px-2.5 py-0.5 gap-1.5",
  };

  const variants = {
    passed: "bg-integrity-passed-bg text-integrity-passed border border-integrity-passed-border",
    warning: "bg-integrity-warning-bg text-integrity-warning border border-integrity-warning-border",
    critical: "bg-integrity-critical-bg text-integrity-critical border border-integrity-critical-border",
    gold: "bg-gold-50 text-gold-800 border border-gold-300",
    neutral: "bg-ivory-200 text-charcoal-muted border border-border",
    active: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    paused: "bg-amber-50 text-amber-700 border border-amber-200",
    canceled: "bg-gray-100 text-gray-600 border border-gray-200",
    outline: "bg-transparent text-charcoal border border-border",
  };

  const dotColors = {
    passed: "bg-integrity-passed",
    warning: "bg-integrity-warning",
    critical: "bg-integrity-critical",
    gold: "bg-gold",
    neutral: "bg-charcoal-light",
    active: "bg-emerald-500",
    paused: "bg-amber-500",
    canceled: "bg-gray-400",
    outline: "bg-charcoal",
  };

  return (
    <span className={cn(baseStyles, sizeStyles[size], variants[variant], className)} {...props}>
      {dot && (
        <span
          className={cn("w-1.5 h-1.5 rounded-full", dotColors[variant])}
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  );
}

