"use client";

import React from "react";
import { IntegrityCheckResult } from "@/types";
import { cn } from "@/lib/utils";

interface IntegrityCheckCardProps {
  check: IntegrityCheckResult;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
}

export function IntegrityCheckCard({
  check,
  index,
  isExpanded,
  onToggle,
}: IntegrityCheckCardProps) {
  const configs = {
    Passed: {
      border: "border-integrity-passed-border",
      bg: "bg-integrity-passed-bg/40",
      headerBg: "hover:bg-integrity-passed-bg/60",
      badge: "bg-integrity-passed-bg text-integrity-passed border-integrity-passed-border",
      icon: (
        <svg className="w-5 h-5 text-integrity-passed" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
        </svg>
      ),
    },
    Warning: {
      border: "border-integrity-warning-border",
      bg: "bg-integrity-warning-bg/30",
      headerBg: "hover:bg-integrity-warning-bg/60",
      badge: "bg-integrity-warning-bg text-integrity-warning border-integrity-warning-border",
      icon: (
        <svg className="w-5 h-5 text-integrity-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
    },
    Critical: {
      border: "border-integrity-critical-border",
      bg: "bg-integrity-critical-bg/30",
      headerBg: "hover:bg-integrity-critical-bg/50",
      badge: "bg-integrity-critical-bg text-integrity-critical border-integrity-critical-border",
      icon: (
        <svg className="w-5 h-5 text-integrity-critical" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
  };

  const config = configs[check.severity];

  return (
    <div
      className={cn(
        "rounded-xl border transition-all duration-150 overflow-hidden",
        config.border,
        config.bg
      )}
    >
      {/* Clickable Header Row */}
      <button
        onClick={onToggle}
        className={cn(
          "w-full flex items-center gap-3 px-4 py-3 text-left transition-colors",
          config.headerBg
        )}
      >
        {/* Step Number */}
        <span className="shrink-0 w-6 h-6 rounded-full bg-white border border-border flex items-center justify-center text-[11px] font-bold text-charcoal-soft">
          {index + 1}
        </span>

        {/* Icon */}
        <span className="shrink-0">{config.icon}</span>

        {/* Rule name & message */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-charcoal">{check.ruleName}</span>
            <span
              className={cn(
                "text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded border",
                config.badge
              )}
            >
              {check.severity}
            </span>
          </div>
          <p className="text-[11px] text-charcoal-soft mt-0.5 truncate pr-4">{check.message}</p>
        </div>

        {/* Expand chevron */}
        <svg
          className={cn(
            "w-4 h-4 text-charcoal-soft shrink-0 transition-transform duration-200",
            isExpanded && "rotate-180"
          )}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Expanded Detail Panel */}
      {isExpanded && (
        <div className="px-4 pb-4 border-t border-current/10 space-y-3 pt-3">
          {/* Explanation */}
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-charcoal-muted block mb-1">
              Audit Explanation
            </span>
            <p className="text-xs text-charcoal leading-relaxed">{check.explanation}</p>
          </div>

          {/* Suggested Remediation */}
          {check.suggestedRemediation && (
            <div className="p-2.5 rounded-lg bg-white border border-border">
              <span className="text-[10px] font-bold uppercase tracking-wider text-charcoal-muted block mb-1">
                Suggested Remediation
              </span>
              <p className="text-xs text-charcoal-muted leading-relaxed">
                {check.suggestedRemediation}
              </p>
            </div>
          )}

          {/* Rule Code */}
          <div className="flex items-center gap-2 text-[10px] text-charcoal-soft font-mono">
            <span>Rule:</span>
            <span className="px-1.5 py-0.5 rounded bg-ivory-200 border border-border font-bold">
              {check.ruleId}
            </span>
            {check.canAutoFix && (
              <span className="ml-2 px-1.5 py-0.5 rounded bg-gold-50 border border-gold-300 text-gold-900 font-bold uppercase text-[9px]">
                Auto-Fix Available
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

