import React from "react";
import { cn } from "@/lib/utils";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  helperText?: string;
  error?: string;
  options: SelectOption[];
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, helperText, error, options, id, ...props }, ref) => {
    const generatedId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={generatedId} className="block text-xs font-semibold uppercase tracking-wider text-charcoal-muted">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={generatedId}
            className={cn(
              "w-full appearance-none rounded-lg border border-border bg-white px-3 py-2 pr-8 text-sm text-charcoal transition-all",
              "focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/20",
              "disabled:bg-surface-muted disabled:text-charcoal-light disabled:cursor-not-allowed",
              error && "border-integrity-critical focus:border-integrity-critical focus:ring-red-100",
              className
            )}
            {...props}
          >
            {options.map((option) => (
              <option key={option.value} value={option.value} disabled={option.disabled}>
                {option.label}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-charcoal-soft">
            <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </div>
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

Select.displayName = "Select";

