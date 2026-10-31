import React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  leftAddon?: React.ReactNode;
  rightAddon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, helperText, error, leftAddon, rightAddon, id, ...props }, ref) => {
    const generatedId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={generatedId} className="block text-xs font-semibold uppercase tracking-wider text-charcoal-muted">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftAddon && (
            <div className="absolute left-3 flex items-center pointer-events-none text-charcoal-soft text-sm">
              {leftAddon}
            </div>
          )}
          <input
            ref={ref}
            id={generatedId}
            className={cn(
              "w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-charcoal placeholder-charcoal-light transition-all",
              "focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/20",
              "disabled:bg-surface-muted disabled:text-charcoal-light disabled:cursor-not-allowed",
              leftAddon && "pl-8",
              rightAddon && "pr-8",
              error && "border-integrity-critical focus:border-integrity-critical focus:ring-red-100",
              className
            )}
            {...props}
          />
          {rightAddon && (
            <div className="absolute right-3 flex items-center pointer-events-none text-charcoal-soft text-sm">
              {rightAddon}
            </div>
          )}
        </div>
        {error ? (
          <p className="text-xs text-integrity-critical">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-charcoal-soft">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = "Input";

