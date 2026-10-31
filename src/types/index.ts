export type Currency = 'USD' | 'EUR' | 'INR' | 'GBP';

export type BillingInterval = 'monthly' | 'quarterly' | 'yearly';

export type SubscriptionStatus =
  | 'trialing'
  | 'active'
  | 'paused'
  | 'past_due'
  | 'cancelled'
  | 'expired';

export type InvoiceStatus =
  | 'draft'
  | 'issued'
  | 'partially_paid'
  | 'paid'
  | 'overdue'
  | 'cancelled';

export type PaymentMethod =
  | 'card'
  | 'upi'
  | 'bank_transfer'
  | 'cash'
  | 'other';

export type IntegritySeverity = 'CRITICAL' | 'WARNING' | 'INFORMATION';

export type IntegrityOverallStatus = 'VALIDATED' | 'REVIEW_REQUIRED' | 'BLOCKED';

export interface IntegrityIssue {
  id: string;
  code: string;
  severity: IntegritySeverity;
  title: string;
  message: string;
  affectedEntity: {
    type: 'subscription' | 'invoice' | 'customer' | 'plan';
    id: string;
    label?: string;
  };
  recommendation: string;
}

export interface IntegrityCheckResult {
  status: IntegrityOverallStatus;
  canProceed: boolean;
  issues: IntegrityIssue[];
  checkedAt: string;
}

export interface Customer {
  id: string;
  orgId: string;
  name: string;
  email: string;
  company: string;
  phone?: string;
  billingAddress?: {
    line1: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  taxId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Plan {
  id: string;
  orgId: string;
  name: string;
  description: string;
  // Monetary values stored in minor units (e.g. 4900 for $49.00)
  priceMinorUnits: number;
  currency: Currency;
  billingInterval: BillingInterval;
  taxRatePercent: number; // e.g. 18 for 18%
  isActive: boolean;
  createdAt: string;
}

export interface Subscription {
  id: string;
  orgId: string;
  customerId: string;
  planId: string;
  status: SubscriptionStatus;
  quantity: number;
  startDate: string; // ISO string YYYY-MM-DD
  currentPeriodStart: string;
  currentPeriodEnd: string;
  nextBillingDate: string;
  discountPercent?: number; // e.g. 10 for 10% off
  discountExpiresAt?: string;
  cancelReason?: string;
  pausedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  unitPriceMinorUnits: number;
  subtotalMinorUnits: number;
}

export interface InvoicePassport {
  invoiceId: string;
  subscriptionId?: string;
  customerId: string;
  issuedAt: string;
  periodStart: string;
  periodEnd: string;
  planName: string;
  unitPriceMinorUnits: number;
  quantity: number;
  baseAmountMinorUnits: number;
  discountPercent: number;
  discountMinorUnits: number;
  taxableAmountMinorUnits: number;
  taxRatePercent: number;
  taxMinorUnits: number;
  totalMinorUnits: number;
  integritySnapshot: {
    status: IntegrityOverallStatus;
    checkedIssuesCount: number;
    validatedAt: string;
    hash: string;
  };
}

export interface Invoice {
  id: string;
  orgId: string;
  invoiceNumber: string;
  customerId: string;
  subscriptionId?: string;
  status: InvoiceStatus;
  billingPeriodStart: string;
  billingPeriodEnd: string;
  currency: Currency;
  lineItems: InvoiceLineItem[];
  subtotalMinorUnits: number;
  discountMinorUnits: number;
  taxMinorUnits: number;
  totalMinorUnits: number;
  amountPaidMinorUnits: number;
  balanceDueMinorUnits: number;
  dueDate: string;
  issuedDate: string;
  passport?: InvoicePassport;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  id: string;
  orgId: string;
  invoiceId: string;
  customerId: string;
  amountMinorUnits: number;
  currency: Currency;
  paymentMethod: PaymentMethod;
  referenceNumber: string;
  isSimulated: boolean;
  status: 'succeeded' | 'pending' | 'failed';
  recordedAt: string;
  notes?: string;
}

export interface ActivityLog {
  id: string;
  orgId: string;
  action: string;
  entityType: 'subscription' | 'invoice' | 'customer' | 'plan' | 'payment' | 'integrity_guard';
  entityId: string;
  description: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface Organization {
  id: string;
  name: string;
  currency: Currency;
  taxRatePercent: number;
  taxIdentifier?: string;
}

