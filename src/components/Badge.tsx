import React from 'react';
import { SubscriptionStatus, InvoiceStatus, IntegrityOverallStatus, IntegritySeverity } from '@/types';

interface BadgeProps {
  children?: React.ReactNode;
  variant?:
    | 'default'
    | 'success'
    | 'warning'
    | 'danger'
    | 'info'
    | 'neutral'
    | 'purple';
  status?: SubscriptionStatus | InvoiceStatus | IntegrityOverallStatus | IntegritySeverity | string;
  size?: 'sm' | 'md';
}

export function Badge({ children, variant, status, size = 'md' }: BadgeProps) {
  let resolvedVariant = variant || 'default';

  if (status) {
    switch (status) {
      case 'active':
      case 'paid':
      case 'VALIDATED':
      case 'succeeded':
        resolvedVariant = 'success';
        break;
      case 'trialing':
      case 'partially_paid':
      case 'REVIEW_REQUIRED':
      case 'WARNING':
        resolvedVariant = 'warning';
        break;
      case 'cancelled':
      case 'expired':
      case 'overdue':
      case 'BLOCKED':
      case 'CRITICAL':
      case 'failed':
        resolvedVariant = 'danger';
        break;
      case 'paused':
      case 'draft':
      case 'INFORMATION':
      case 'pending':
        resolvedVariant = 'info';
        break;
      case 'past_due':
        resolvedVariant = 'warning';
        break;
      default:
        resolvedVariant = 'neutral';
    }
  }

  const styles = {
    success: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    warning: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    danger: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
    info: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
    purple: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
    neutral: 'bg-slate-800 text-slate-300 border-slate-700',
    default: 'bg-slate-800 text-slate-300 border-slate-700',
  };

  const sizes = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs px-2.5 py-1 font-medium',
  };

  const label =
    children ||
    (typeof status === 'string'
      ? status.replace('_', ' ').toUpperCase()
      : '');

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border tracking-wide uppercase font-semibold ${styles[resolvedVariant]} ${sizes[size]}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          resolvedVariant === 'success'
            ? 'bg-emerald-400'
            : resolvedVariant === 'warning'
            ? 'bg-amber-400'
            : resolvedVariant === 'danger'
            ? 'bg-rose-400'
            : resolvedVariant === 'info'
            ? 'bg-sky-400'
            : 'bg-slate-400'
        }`}
      />
      {label}
    </span>
  );
}

