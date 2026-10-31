/**
 * SUBSYNC — Deterministic Billing Calculation Engine
 * Pure mathematical functions for subscription billing, discount allocation,
 * statutory GST itemization, and mid-cycle proration factors.
 */

export interface BillingCalculationInput {
  basePrice: number;
  seats: number;
  discountPercentage?: number;
  discountFixedAmount?: number;
  taxRatePercentage?: number;
  periodStart?: string;
  periodEnd?: string;
  prorateActiveDays?: number;
  prorateTotalDays?: number;
}

export interface BillingCalculationResult {
  grossAmount: number;
  discountAmount: number;
  taxableAmount: number;
  gstRate: number;
  cgst: number;
  sgst: number;
  taxTotal: number;
  prorationFactor: number;
  isProrated: boolean;
  finalAmount: number;
  formula: string;
  explanation: string;
}

/**
 * Precision round to 2 decimal places (paise/cents)
 */
export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/**
 * Calculate full billing breakdown
 */
export function calculateBilling(input: BillingCalculationInput): BillingCalculationResult {
  const basePrice = Math.max(0, input.basePrice || 0);
  const seats = Math.max(1, input.seats || 1);
  const taxRate = input.taxRatePercentage !== undefined ? input.taxRatePercentage : 18;

  // 1. Gross Base Amount
  let grossAmount = round2(basePrice * seats);

  // 2. Optional Proration
  let prorationFactor = 1;
  let isProrated = false;
  if (
    input.prorateActiveDays !== undefined &&
    input.prorateTotalDays !== undefined &&
    input.prorateTotalDays > 0 &&
    input.prorateActiveDays < input.prorateTotalDays
  ) {
    prorationFactor = round2(input.prorateActiveDays / input.prorateTotalDays);
    grossAmount = round2(grossAmount * prorationFactor);
    isProrated = true;
  }

  // 3. Discount Allocation
  let discountAmount = 0;
  if (input.discountFixedAmount && input.discountFixedAmount > 0) {
    discountAmount = round2(Math.min(grossAmount, input.discountFixedAmount));
  } else if (input.discountPercentage && input.discountPercentage > 0) {
    const pct = Math.min(100, Math.max(0, input.discountPercentage));
    discountAmount = round2(grossAmount * (pct / 100));
  }

  // 4. Taxable Base
  const taxableAmount = round2(Math.max(0, grossAmount - discountAmount));

  // 5. Statutory GST (CGST + SGST split)
  const halfRate = taxRate / 2;
  const cgst = round2(taxableAmount * (halfRate / 100));
  const sgst = round2(taxableAmount * (halfRate / 100));
  const taxTotal = round2(cgst + sgst);

  // 6. Net Payable Final Amount
  const finalAmount = round2(taxableAmount + taxTotal);

  // 7. Formula Representation
  const prorationText = isProrated
    ? ` × (${input.prorateActiveDays}/${input.prorateTotalDays} days)`
    : "";
  const formula = `[₹${basePrice.toLocaleString("en-IN")} × ${seats}${prorationText}] - ₹${discountAmount.toLocaleString("en-IN")} disc = ₹${taxableAmount.toLocaleString("en-IN")} + ${taxRate}% GST (₹${taxTotal.toLocaleString("en-IN")}) = ₹${finalAmount.toLocaleString("en-IN")}`;

  // 8. Natural Language Explanation
  const explanation = isProrated
    ? `Pro-rated for ${input.prorateActiveDays} of ${input.prorateTotalDays} days active. Base charge ₹${grossAmount.toLocaleString("en-IN")} for ${seats} seats minus ₹${discountAmount.toLocaleString("en-IN")} discount, plus ₹${taxTotal.toLocaleString("en-IN")} ${taxRate}% GST.`
    : `Standard recurring charge for ${seats} seat${seats > 1 ? "s" : ""} at ₹${basePrice.toLocaleString("en-IN")}/unit. Discount deducted: ₹${discountAmount.toLocaleString("en-IN")}. Statutory GST (${halfRate}% CGST + ${halfRate}% SGST) assessed on taxable amount of ₹${taxableAmount.toLocaleString("en-IN")}.`;

  return {
    grossAmount,
    discountAmount,
    taxableAmount,
    gstRate: taxRate,
    cgst,
    sgst,
    taxTotal,
    prorationFactor,
    isProrated,
    finalAmount,
    formula,
    explanation,
  };
}

/**
 * Calculate difference between two billing outcomes (Variance Analysis)
 */
export function calculateBillingDelta(
  baseline: BillingCalculationResult,
  simulated: BillingCalculationResult
) {
  const diffAmount = round2(simulated.finalAmount - baseline.finalAmount);
  const percentChange =
    baseline.finalAmount > 0
      ? round2(((simulated.finalAmount - baseline.finalAmount) / baseline.finalAmount) * 100)
      : 0;

  return {
    diffAmount,
    percentChange,
    isIncrease: diffAmount > 0,
    isNeutral: diffAmount === 0,
  };
}

