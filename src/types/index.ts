/**
 * SUBSYNC — Core Domain Types
 */

export type SubscriptionStatus = "Active" | "Paused" | "Canceled" | "Pending Review";
export type CustomerStatus = "Active" | "Inactive" | "Suspended";
export type BillingInterval = "monthly" | "yearly";
export type InvoiceStatus = "Draft" | "Issued" | "Paid" | "Overdue";
export type PaymentStatus = "Paid" | "Pending" | "Failed";
export type PaymentMethod = "UPI" | "Net Banking" | "Credit Card" | "Bank Transfer";
export type IntegritySeverity = "Passed" | "Warning" | "Critical";

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  status: CustomerStatus;
  gstin?: string;
  address?: string;
  createdAt: string;
  totalInvoiced: number;
  activeSubscriptionsCount: number;
}

export interface Plan {
  id: string;
  name: string;
  description: string;
  billingInterval: BillingInterval;
  basePrice: number;
  includedSeats: number;
  perAdditionalSeatPrice: number;
  maxSeats: number;
  features: string[];
  annualDiscountPercentage: number;
}

export interface Subscription {
  id: string;
  customerId: string;
  customerName?: string;
  planId: string;
  planName?: string;
  status: SubscriptionStatus;
  seats: number;
  unitPrice: number;
  discountCode?: string;
  discountPercentage: number;
  discountExpiresAt?: string;
  billingPeriodStart: string;
  billingPeriodEnd: string;
  renewalDate: string;
  taxRatePercentage: number;
  lastAuditedAt?: string;
  integrityStatus: IntegritySeverity;
  integrityNotes?: string;
}

export interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  type: "base" | "seats" | "discount" | "tax" | "proration";
}

export interface CalculationSnapshot {
  formula: string;
  basePrice: number;
  seats: number;
  subtotal: number;
  discountCode?: string;
  discountAmount: number;
  taxableAmount: number;
  gstRate: number;
  cgst: number;
  sgst: number;
  prorationDays?: number;
  finalAmount: number;
  timestamp: string;
  explanation: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  subscriptionId: string;
  planName: string;
  issueDate: string;
  dueDate: string;
  billingPeriodStart: string;
  billingPeriodEnd: string;
  subtotal: number;
  discountTotal: number;
  taxTotal: number;
  totalAmount: number;
  status: InvoiceStatus;
  lineItems: InvoiceLineItem[];
  calculationSnapshot: CalculationSnapshot;
}

export interface Payment {
  id: string;
  invoiceId: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  amount: number;
  paymentMethod: PaymentMethod;
  status: PaymentStatus;
  timestamp: string;
  transactionReference: string;
}

export interface IntegrityCheckResult {
  ruleId: string;
  ruleName: string;
  severity: IntegritySeverity;
  message: string;
  explanation: string;
  suggestedRemediation: string;
  subscriptionId: string;
  customerId: string;
  canAutoFix: boolean;
}

export interface SystemSettings {
  businessName: string;
  businessAddress: string;
  gstin: string;
  supportEmail: string;
  currency: string;
  currencySymbol: string;
  defaultGstRate: number;
  integrityStrictness: "Standard" | "Strict" | "Lenient";
}

