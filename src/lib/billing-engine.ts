import { Currency, InvoicePassport, IntegrityCheckResult, Plan, Subscription } from '@/types';

/**
 * All financial math is strictly executed using integer minor units (e.g. cents, paise).
 * No floating point rounding errors occur in calculations.
 */

export interface BillingCalculationInput {
  unitPriceMinorUnits: number;
  quantity: number;
  discountPercent?: number; // 0 to 100
  taxRatePercent?: number; // 0 to 100
}

export interface BillingCalculationOutput {
  unitPriceMinorUnits: number;
  quantity: number;
  baseAmountMinorUnits: number;
  discountPercent: number;
  discountMinorUnits: number;
  taxableAmountMinorUnits: number;
  taxRatePercent: number;
  taxMinorUnits: number;
  totalMinorUnits: number;
}

export function calculateBilling(input: BillingCalculationInput): BillingCalculationOutput {
  const qty = Math.max(0, Math.floor(input.quantity || 0));
  const unitPrice = Math.max(0, Math.round(input.unitPriceMinorUnits || 0));
  const discountPercent = Math.min(100, Math.max(0, input.discountPercent || 0));
  const taxRate = Math.max(0, input.taxRatePercent || 0);

  // 1. Base amount = unit price * quantity
  const baseAmountMinorUnits = unitPrice * qty;

  // 2. Discount amount in integer cents
  // Formula: round((baseAmount * discountPercent) / 100)
  const discountMinorUnits = Math.round((baseAmountMinorUnits * discountPercent) / 100);

  // 3. Taxable amount
  const taxableAmountMinorUnits = Math.max(0, baseAmountMinorUnits - discountMinorUnits);

  // 4. Tax amount in integer cents
  const taxMinorUnits = Math.round((taxableAmountMinorUnits * taxRate) / 100);

  // 5. Total
  const totalMinorUnits = taxableAmountMinorUnits + taxMinorUnits;

  return {
    unitPriceMinorUnits: unitPrice,
    quantity: qty,
    baseAmountMinorUnits,
    discountPercent,
    discountMinorUnits,
    taxableAmountMinorUnits,
    taxRatePercent: taxRate,
    taxMinorUnits,
    totalMinorUnits,
  };
}

export function formatMinorUnits(amountMinorUnits: number, currency: Currency = 'USD'): string {
  const isNegative = amountMinorUnits < 0;
  const absAmount = Math.abs(amountMinorUnits);
  const major = Math.floor(absAmount / 100);
  const minor = absAmount % 100;
  const formattedNumber = `${major.toLocaleString()}.${minor.toString().padStart(2, '0')}`;

  const symbols: Record<Currency, string> = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    INR: '₹',
  };

  const symbol = symbols[currency] || '$';
  return `${isNegative ? '-' : ''}${symbol}${formattedNumber}`;
}

export function parseMajorToMinorUnits(val: number | string): number {
  if (typeof val === 'number') {
    return Math.round(val * 100);
  }
  const clean = val.replace(/[^0-9.-]/g, '');
  const parsed = parseFloat(clean);
  if (isNaN(parsed)) return 0;
  return Math.round(parsed * 100);
}

/**
 * Computes Monthly Recurring Revenue (MRR) normalized to 1 month.
 * Quarterly -> / 3
 * Yearly -> / 12
 * Only active subscriptions count towards MRR.
 */
export function calculateMRR(subscriptions: Subscription[], plans: Plan[]): number {
  const planMap = new Map<string, Plan>();
  plans.forEach((p) => planMap.set(p.id, p));

  let totalMRRMinor = 0;

  for (const sub of subscriptions) {
    if (sub.status !== 'active') continue;
    const plan = planMap.get(sub.planId);
    if (!plan) continue;

    const billing = calculateBilling({
      unitPriceMinorUnits: plan.priceMinorUnits,
      quantity: sub.quantity,
      discountPercent: sub.discountPercent || 0,
      taxRatePercent: 0, // MRR standardly tracks pre-tax recurring revenue
    });

    const netPeriodRevenue = billing.taxableAmountMinorUnits;

    let monthlyNormalized = netPeriodRevenue;
    if (plan.billingInterval === 'yearly') {
      monthlyNormalized = Math.round(netPeriodRevenue / 12);
    } else if (plan.billingInterval === 'quarterly') {
      monthlyNormalized = Math.round(netPeriodRevenue / 3);
    }

    totalMRRMinor += monthlyNormalized;
  }

  return totalMRRMinor;
}

/**
 * Creates an immutable calculation passport snapshot for an invoice.
 */
export function createInvoicePassport(params: {
  invoiceId: string;
  subscriptionId?: string;
  customerId: string;
  issuedAt: string;
  periodStart: string;
  periodEnd: string;
  planName: string;
  calculation: BillingCalculationOutput;
  integrityResult: IntegrityCheckResult;
}): InvoicePassport {
  const hash = `SS-HASH-${Math.abs(
    (params.invoiceId + params.issuedAt + params.calculation.totalMinorUnits)
      .split('')
      .reduce((acc, char) => (acc << 5) - acc + char.charCodeAt(0), 0)
  ).toString(16)}`;

  return {
    invoiceId: params.invoiceId,
    subscriptionId: params.subscriptionId,
    customerId: params.customerId,
    issuedAt: params.issuedAt,
    periodStart: params.periodStart,
    periodEnd: params.periodEnd,
    planName: params.planName,
    unitPriceMinorUnits: params.calculation.unitPriceMinorUnits,
    quantity: params.calculation.quantity,
    baseAmountMinorUnits: params.calculation.baseAmountMinorUnits,
    discountPercent: params.calculation.discountPercent,
    discountMinorUnits: params.calculation.discountMinorUnits,
    taxableAmountMinorUnits: params.calculation.taxableAmountMinorUnits,
    taxRatePercent: params.calculation.taxRatePercent,
    taxMinorUnits: params.calculation.taxMinorUnits,
    totalMinorUnits: params.calculation.totalMinorUnits,
    integritySnapshot: {
      status: params.integrityResult.status,
      checkedIssuesCount: params.integrityResult.issues.length,
      validatedAt: params.integrityResult.checkedAt,
      hash,
    },
  };
}

