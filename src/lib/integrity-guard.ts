import {
  Customer,
  IntegrityCheckResult,
  IntegrityIssue,
  Invoice,
  Plan,
  Subscription,
} from '@/types';
import { calculateBilling } from './billing-engine';

export interface ProposedBillingPayload {
  subscription: Subscription;
  plan: Plan;
  customer: Customer;
  billingPeriodStart: string; // YYYY-MM-DD
  billingPeriodEnd: string; // YYYY-MM-DD
  proposedUnitPriceMinorUnits: number;
  proposedQuantity: number;
  proposedDiscountPercent?: number;
  proposedTaxRatePercent?: number;
  proposedTotalMinorUnits?: number;
  existingInvoices: Invoice[];
}

/**
 * BILLING INTEGRITY GUARD
 *
 * Deterministic rules engine executing 8 rigorous verification gates before any
 * billing mutation or invoice issuance occurs.
 */
export function evaluateBillingIntegrity(payload: ProposedBillingPayload): IntegrityCheckResult {
  const issues: IntegrityIssue[] = [];
  const {
    subscription,
    plan,
    customer,
    billingPeriodStart,
    billingPeriodEnd,
    proposedUnitPriceMinorUnits,
    proposedQuantity,
    proposedDiscountPercent = 0,
    proposedTaxRatePercent = plan.taxRatePercent ?? 0,
    proposedTotalMinorUnits,
    existingInvoices,
  } = payload;

  const subId = subscription.id;

  // RULE 1: Duplicate billing period detection (CRITICAL)
  const overlappingInvoice = existingInvoices.find((inv) => {
    if (inv.subscriptionId !== subId) return false;
    if (inv.status === 'cancelled') return false;

    // Check if the periods match or overlap
    const isSamePeriod =
      inv.billingPeriodStart === billingPeriodStart &&
      inv.billingPeriodEnd === billingPeriodEnd;

    // Also check date overlap: max(start1, start2) <= min(end1, end2)
    const startA = new Date(inv.billingPeriodStart).getTime();
    const endA = new Date(inv.billingPeriodEnd).getTime();
    const startB = new Date(billingPeriodStart).getTime();
    const endB = new Date(billingPeriodEnd).getTime();

    const isDateOverlap = Math.max(startA, startB) < Math.min(endA, endB);

    return isSamePeriod || isDateOverlap;
  });

  if (overlappingInvoice) {
    issues.push({
      id: `issue-duplicate-${Date.now()}-1`,
      code: 'DUPLICATE_BILLING_PERIOD',
      severity: 'CRITICAL',
      title: 'Duplicate Billing Period Detected',
      message: `An active or issued invoice (${overlappingInvoice.invoiceNumber}) already exists for subscription period ${overlappingInvoice.billingPeriodStart} to ${overlappingInvoice.billingPeriodEnd}.`,
      affectedEntity: {
        type: 'invoice',
        id: overlappingInvoice.id,
        label: overlappingInvoice.invoiceNumber,
      },
      recommendation:
        'Abort invoice generation to prevent double charging the customer, or choose an unbilled subsequent period.',
    });
  }

  // RULE 2: Invalid billing dates (CRITICAL / WARNING)
  const startDate = new Date(billingPeriodStart);
  const endDate = new Date(billingPeriodEnd);

  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    issues.push({
      id: `issue-dates-invalid-${Date.now()}`,
      code: 'MALFORMED_DATES',
      severity: 'CRITICAL',
      title: 'Malformed Billing Dates',
      message: `Provided dates (${billingPeriodStart} - ${billingPeriodEnd}) are not valid ISO date formats.`,
      affectedEntity: { type: 'subscription', id: subId },
      recommendation: 'Provide valid YYYY-MM-DD calendar dates for both start and end periods.',
    });
  } else if (endDate <= startDate) {
    issues.push({
      id: `issue-dates-reverse-${Date.now()}`,
      code: 'INVALID_DATE_RANGE',
      severity: 'CRITICAL',
      title: 'Billing End Date Precedes or Equals Start Date',
      message: `Billing period end date (${billingPeriodEnd}) cannot be equal to or before the start date (${billingPeriodStart}).`,
      affectedEntity: { type: 'subscription', id: subId },
      recommendation: 'Adjust the billing period end date to be strictly after the start date.',
    });
  } else {
    // Check if period length is unusual (e.g. less than 5 days or more than 400 days)
    const diffDays = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24));
    if (diffDays < 7) {
      issues.push({
        id: `issue-period-short-${Date.now()}`,
        code: 'ABNORMAL_PERIOD_SHORT',
        severity: 'WARNING',
        title: 'Abnormally Short Billing Period',
        message: `Billing period span is only ${diffDays} days. Typical billing intervals are 30 to 365 days.`,
        affectedEntity: { type: 'subscription', id: subId },
        recommendation: 'Verify if a prorated or partial billing period was deliberately intended.',
      });
    }
  }

  // RULE 3: Invalid subscription state (CRITICAL / WARNING)
  if (subscription.status === 'cancelled') {
    issues.push({
      id: `issue-state-cancelled-${Date.now()}`,
      code: 'SUBSCRIPTION_CANCELLED',
      severity: 'CRITICAL',
      title: 'Billing Attempt on Cancelled Subscription',
      message: `Subscription ${subId} was cancelled${subscription.cancelReason ? ` (Reason: ${subscription.cancelReason})` : ''} and cannot generate new charges.`,
      affectedEntity: { type: 'subscription', id: subId },
      recommendation: 'Reactivate the subscription or draft a standalone one-off invoice instead.',
    });
  } else if (subscription.status === 'paused') {
    issues.push({
      id: `issue-state-paused-${Date.now()}`,
      code: 'SUBSCRIPTION_PAUSED',
      severity: 'CRITICAL',
      title: 'Billing Attempt on Paused Subscription',
      message: `Subscription ${subId} is currently paused. Billing actions are frozen until the subscription is resumed.`,
      affectedEntity: { type: 'subscription', id: subId },
      recommendation: 'Resume the subscription first if the customer has agreed to unpause service.',
    });
  } else if (subscription.status === 'expired') {
    issues.push({
      id: `issue-state-expired-${Date.now()}`,
      code: 'SUBSCRIPTION_EXPIRED',
      severity: 'CRITICAL',
      title: 'Billing Attempt on Expired Subscription',
      message: `Subscription ${subId} has expired past its valid lifecycle.`,
      affectedEntity: { type: 'subscription', id: subId },
      recommendation: 'Renew or re-subscribe the customer with a fresh agreement.',
    });
  } else if (subscription.status === 'past_due') {
    issues.push({
      id: `issue-state-pastdue-${Date.now()}`,
      code: 'SUBSCRIPTION_PAST_DUE',
      severity: 'WARNING',
      title: 'Subscription is Past Due',
      message: `Customer already has unpaid overdue invoices for this subscription. Generating another charge increases default risk.`,
      affectedEntity: { type: 'subscription', id: subId },
      recommendation: 'Collect existing overdue balances before generating additional billing cycles.',
    });
  } else if (subscription.status === 'trialing') {
    issues.push({
      id: `issue-state-trialing-${Date.now()}`,
      code: 'SUBSCRIPTION_TRIALING',
      severity: 'WARNING',
      title: 'Subscription is in Free Trial',
      message: `Customer is still in their trial period. Invoicing now may terminate their trial prematurely.`,
      affectedEntity: { type: 'subscription', id: subId },
      recommendation: 'Confirm customer authorization to end the trial early and initiate billing.',
    });
  }

  // RULE 4: Unexpected price changes vs Plan (WARNING)
  if (proposedUnitPriceMinorUnits !== plan.priceMinorUnits) {
    const diff = proposedUnitPriceMinorUnits - plan.priceMinorUnits;
    const direction = diff > 0 ? 'higher' : 'lower';
    issues.push({
      id: `issue-price-mismatch-${Date.now()}`,
      code: 'UNEXPECTED_PRICE_OVERRIDE',
      severity: 'WARNING',
      title: 'Proposed Price Deviates from Master Plan Price',
      message: `Proposed unit price ($${(proposedUnitPriceMinorUnits / 100).toFixed(2)}) is ${direction} than the plan baseline ($${(plan.priceMinorUnits / 100).toFixed(2)}).`,
      affectedEntity: { type: 'plan', id: plan.id, label: plan.name },
      recommendation:
        'Verify if a custom negotiated rate was approved for this customer or revert to the standard catalog price.',
    });
  }

  // RULE 5: Expired or invalid discounts (CRITICAL / WARNING)
  if (proposedDiscountPercent < 0 || proposedDiscountPercent > 100) {
    issues.push({
      id: `issue-discount-bounds-${Date.now()}`,
      code: 'INVALID_DISCOUNT_PERCENTAGE',
      severity: 'CRITICAL',
      title: 'Invalid Discount Rate',
      message: `Discount percentage (${proposedDiscountPercent}%) must be between 0% and 100%.`,
      affectedEntity: { type: 'subscription', id: subId },
      recommendation: 'Specify a discount percentage within the 0% to 100% boundary.',
    });
  } else if (subscription.discountExpiresAt) {
    const expiry = new Date(subscription.discountExpiresAt);
    if (!isNaN(expiry.getTime()) && expiry.getTime() < Date.now() && proposedDiscountPercent > 0) {
      issues.push({
        id: `issue-discount-expired-${Date.now()}`,
        code: 'EXPIRED_DISCOUNT_APPLIED',
        severity: 'WARNING',
        title: 'Expired Promotional Discount Applied',
        message: `Subscription promotional discount expired on ${subscription.discountExpiresAt}, but a ${proposedDiscountPercent}% discount is still populated.`,
        affectedEntity: { type: 'subscription', id: subId },
        recommendation: 'Remove the expired promotional discount or extend the promotional agreement date.',
      });
    }
  }

  // RULE 6: Invalid quantity (CRITICAL)
  if (proposedQuantity <= 0) {
    issues.push({
      id: `issue-qty-nonpositive-${Date.now()}`,
      code: 'INVALID_SEATS_QUANTITY',
      severity: 'CRITICAL',
      title: 'Zero or Negative Seat Quantity',
      message: `Proposed billing quantity is ${proposedQuantity}. Subscriptions require at least 1 unit.`,
      affectedEntity: { type: 'subscription', id: subId },
      recommendation: 'Increase seat/unit count to 1 or higher.',
    });
  }

  // RULE 7: Calculation mismatch check (CRITICAL)
  const canonicalCalc = calculateBilling({
    unitPriceMinorUnits: proposedUnitPriceMinorUnits,
    quantity: proposedQuantity,
    discountPercent: proposedDiscountPercent,
    taxRatePercent: proposedTaxRatePercent,
  });

  if (
    proposedTotalMinorUnits !== undefined &&
    proposedTotalMinorUnits !== canonicalCalc.totalMinorUnits
  ) {
    issues.push({
      id: `issue-calc-discrepancy-${Date.now()}`,
      code: 'FINANCIAL_CALCULATION_MISMATCH',
      severity: 'CRITICAL',
      title: 'Discrepancy in Invoice Total Computation',
      message: `Client submitted total of $${(proposedTotalMinorUnits / 100).toFixed(2)} does not match server-verified calculation of $${(canonicalCalc.totalMinorUnits / 100).toFixed(2)}.`,
      affectedEntity: { type: 'subscription', id: subId },
      recommendation: 'Use the deterministic billing engine recomputed total to ensure compliance.',
    });
  }

  // RULE 8: Missing billing configuration (WARNING / INFO)
  if (!customer.billingAddress?.country || !customer.billingAddress?.line1) {
    issues.push({
      id: `issue-missing-address-${Date.now()}`,
      code: 'INCOMPLETE_BILLING_ADDRESS',
      severity: 'INFORMATION',
      title: 'Customer Missing Physical Billing Address',
      message: `Customer ${customer.name} does not have a registered billing street address on file.`,
      affectedEntity: { type: 'customer', id: customer.id, label: customer.name },
      recommendation: 'Request physical address from customer for tax and audit compliance.',
    });
  }

  if (proposedTaxRatePercent === 0 && !customer.taxId) {
    issues.push({
      id: `issue-zero-tax-${Date.now()}`,
      code: 'ZERO_TAX_WITHOUT_TAX_ID',
      severity: 'INFORMATION',
      title: 'Zero Tax Rate Applied Without Exemption Identifier',
      message: `Invoice has 0% tax rate but no tax exemption certificate or VAT/GST ID is recorded for ${customer.company}.`,
      affectedEntity: { type: 'customer', id: customer.id, label: customer.company },
      recommendation: 'Attach customer tax exemption documentation if subject to zero-rating.',
    });
  }

  // Determine Overall Status
  const hasCritical = issues.some((i) => i.severity === 'CRITICAL');
  const hasWarning = issues.some((i) => i.severity === 'WARNING');

  let status: IntegrityCheckResult['status'] = 'VALIDATED';
  let canProceed = true;

  if (hasCritical) {
    status = 'BLOCKED';
    canProceed = false;
  } else if (hasWarning) {
    status = 'REVIEW_REQUIRED';
    canProceed = true; // May proceed after deliberate review confirmation
  }

  return {
    status,
    canProceed,
    issues,
    checkedAt: new Date().toISOString(),
  };
}

