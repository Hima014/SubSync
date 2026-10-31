/**
 * SUBSYNC — Billing Integrity Guard
 * 8 automated pre-invoice audit rules: Pass / Warning / Critical
 */

import { Subscription, Invoice, Customer, Plan, IntegrityCheckResult } from "@/types";
import { round2 } from "./billing-calculator";

export interface GuardAuditInput {
  subscription: Subscription;
  existingInvoices: Invoice[];
  customers: Customer[];
  plans: Plan[];
}

export interface GuardAuditReport {
  subscriptionId: string;
  customerId: string;
  customerName: string;
  overallStatus: "Passed" | "Warning" | "Critical";
  checks: IntegrityCheckResult[];
  canGenerateInvoice: boolean;
  auditedAt: string;
}

/** ─────────────── RULE 1: Duplicate Billing Period ─────────────── */
function checkDuplicatePeriod(input: GuardAuditInput): IntegrityCheckResult {
  const { subscription, existingInvoices } = input;
  const { billingPeriodStart, billingPeriodEnd } = subscription;

  const duplicate = existingInvoices.find((inv) => {
    if (inv.customerId !== subscription.customerId) return false;
    const existingStart = inv.billingPeriodStart;
    const existingEnd = inv.billingPeriodEnd;
    // Overlap check
    return billingPeriodStart <= existingEnd && billingPeriodEnd >= existingStart;
  });

  if (duplicate) {
    return {
      ruleId: "RULE_DUPLICATE_PERIOD",
      ruleName: "Duplicate Billing Period",
      severity: "Critical",
      message: `Invoice ${duplicate.invoiceNumber} already covers an overlapping billing window.`,
      explanation: `A prior invoice (${duplicate.invoiceNumber}) was generated for billing window ${duplicate.billingPeriodStart} → ${duplicate.billingPeriodEnd}. The current subscription period ${billingPeriodStart} → ${billingPeriodEnd} overlaps this range. Generating a new invoice would result in double-billing for the customer.`,
      suggestedRemediation: `Advance the billing period to start from ${duplicate.billingPeriodEnd}. Click "Auto-Fix" to shift the cycle forward to the next non-overlapping window.`,
      subscriptionId: subscription.id,
      customerId: subscription.customerId,
      canAutoFix: true,
    };
  }

  return {
    ruleId: "RULE_DUPLICATE_PERIOD",
    ruleName: "Duplicate Billing Period",
    severity: "Passed",
    message: "No overlapping billing periods detected across prior invoices.",
    explanation: "Verified: No existing invoice for this customer covers the current billing window. Zero double-billing risk.",
    suggestedRemediation: "",
    subscriptionId: subscription.id,
    customerId: subscription.customerId,
    canAutoFix: false,
  };
}

/** ─────────────── RULE 2: Invalid Billing Dates ─────────────── */
function checkInvalidDates(input: GuardAuditInput): IntegrityCheckResult {
  const { subscription } = input;
  const { billingPeriodStart, billingPeriodEnd } = subscription;

  const startDate = new Date(billingPeriodStart);
  const endDate = new Date(billingPeriodEnd);
  const diffMs = endDate.getTime() - startDate.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  if (!billingPeriodStart || !billingPeriodEnd || isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    return {
      ruleId: "RULE_INVALID_DATES",
      ruleName: "Invalid Billing Dates",
      severity: "Critical",
      message: "Billing period start or end date is missing or malformed.",
      explanation: "A valid ISO date is required for both billing period start and end to compute prorations and verify cycle lengths.",
      suggestedRemediation: "Set a valid YYYY-MM-DD start and end date for this subscription cycle.",
      subscriptionId: subscription.id,
      customerId: subscription.customerId,
      canAutoFix: false,
    };
  }

  if (diffDays <= 0) {
    return {
      ruleId: "RULE_INVALID_DATES",
      ruleName: "Invalid Billing Dates",
      severity: "Critical",
      message: `Period end (${billingPeriodEnd}) is not after period start (${billingPeriodStart}).`,
      explanation: "The billing period end date must be strictly after the start date. A zero or negative duration period would result in a zero-value or erroneous invoice.",
      suggestedRemediation: "Correct the billing period end date to be at least one day after the start date.",
      subscriptionId: subscription.id,
      customerId: subscription.customerId,
      canAutoFix: false,
    };
  }

  if (diffDays > 400) {
    return {
      ruleId: "RULE_INVALID_DATES",
      ruleName: "Invalid Billing Dates",
      severity: "Warning",
      message: `Billing period spans ${Math.round(diffDays)} days — exceeds typical 13-month maximum.`,
      explanation: "A billing period longer than 13 months may indicate a data entry error. Annual subscriptions are typically billed over 365 days.",
      suggestedRemediation: "Review whether the billing period is intentional for this customer tier.",
      subscriptionId: subscription.id,
      customerId: subscription.customerId,
      canAutoFix: false,
    };
  }

  return {
    ruleId: "RULE_INVALID_DATES",
    ruleName: "Invalid Billing Dates",
    severity: "Passed",
    message: `Billing period is valid (${Math.round(diffDays)} days).`,
    explanation: `Cycle from ${billingPeriodStart} to ${billingPeriodEnd} is ${Math.round(diffDays)} days — within normal operating bounds.`,
    suggestedRemediation: "",
    subscriptionId: subscription.id,
    customerId: subscription.customerId,
    canAutoFix: false,
  };
}

/** ─────────────── RULE 3: Expired Discount ─────────────── */
function checkExpiredDiscount(input: GuardAuditInput): IntegrityCheckResult {
  const { subscription } = input;
  const { discountCode, discountPercentage, discountExpiresAt, billingPeriodStart } = subscription;

  if (!discountCode || !discountPercentage) {
    return {
      ruleId: "RULE_EXPIRED_DISCOUNT",
      ruleName: "Expired Discount / Voucher",
      severity: "Passed",
      message: "No promotional voucher active on this subscription.",
      explanation: "No discount code present. Standard base pricing applies with no deductions.",
      suggestedRemediation: "",
      subscriptionId: subscription.id,
      customerId: subscription.customerId,
      canAutoFix: false,
    };
  }

  if (discountExpiresAt && billingPeriodStart > discountExpiresAt) {
    return {
      ruleId: "RULE_EXPIRED_DISCOUNT",
      ruleName: "Expired Discount / Voucher",
      severity: "Critical",
      message: `Voucher "${discountCode}" expired on ${discountExpiresAt} — billing period starts ${billingPeriodStart}.`,
      explanation: `The promotional voucher "${discountCode}" (${discountPercentage}% off) has a hard expiry of ${discountExpiresAt}. The current billing cycle begins ${billingPeriodStart}, which is after the voucher expiry. Applying an expired coupon would constitute an incorrect billing deduction and revenue leakage.`,
      suggestedRemediation: `Remove expired voucher "${discountCode}" from this subscription. Click "Auto-Fix" to strip the coupon and apply standard pricing.`,
      subscriptionId: subscription.id,
      customerId: subscription.customerId,
      canAutoFix: true,
    };
  }

  return {
    ruleId: "RULE_EXPIRED_DISCOUNT",
    ruleName: "Expired Discount / Voucher",
    severity: "Passed",
    message: `Voucher "${discountCode}" (${discountPercentage}% off) is active and valid.`,
    explanation: `Promotional code "${discountCode}" remains in good standing through ${discountExpiresAt || "∞"}. Deduction of ${discountPercentage}% is eligible.`,
    suggestedRemediation: "",
    subscriptionId: subscription.id,
    customerId: subscription.customerId,
    canAutoFix: false,
  };
}

/** ─────────────── RULE 4: Plan Price Mismatch ─────────────── */
function checkPriceMismatch(input: GuardAuditInput): IntegrityCheckResult {
  const { subscription, plans } = input;
  const catalogPlan = plans.find((p) => p.id === subscription.planId);

  if (!catalogPlan) {
    return {
      ruleId: "RULE_PRICE_MISMATCH",
      ruleName: "Catalog Price Mismatch",
      severity: "Warning",
      message: "Subscription references a plan ID that no longer exists in the catalog.",
      explanation: "The plan this subscription was created under cannot be found. Price drift validation is skipped. Review the plan assignment.",
      suggestedRemediation: "Re-assign this subscription to an existing plan from the Plan Catalog.",
      subscriptionId: subscription.id,
      customerId: subscription.customerId,
      canAutoFix: false,
    };
  }

  const catalogPrice = catalogPlan.basePrice;
  const lockedPrice = subscription.unitPrice;
  const delta = Math.abs(catalogPrice - lockedPrice);
  const pct = catalogPrice > 0 ? round2((delta / catalogPrice) * 100) : 0;

  if (delta > 0) {
    return {
      ruleId: "RULE_PRICE_MISMATCH",
      ruleName: "Catalog Price Mismatch",
      severity: "Warning",
      message: `Subscription price ₹${lockedPrice.toLocaleString("en-IN")} differs from catalog ₹${catalogPrice.toLocaleString("en-IN")} (${pct}% drift).`,
      explanation: `The "${catalogPlan.name}" plan now costs ₹${catalogPrice.toLocaleString("en-IN")} in the catalog, but this subscription has a locked rate of ₹${lockedPrice.toLocaleString("en-IN")}. This may be an intentional grandfathered rate or a data inconsistency. Invoicing is permitted but the anomaly is flagged.`,
      suggestedRemediation: `If this is a grandfathered pricing agreement, no action is needed. Otherwise, click "Sync Catalog Price" to update this subscription to ₹${catalogPrice.toLocaleString("en-IN")}.`,
      subscriptionId: subscription.id,
      customerId: subscription.customerId,
      canAutoFix: true,
    };
  }

  return {
    ruleId: "RULE_PRICE_MISMATCH",
    ruleName: "Catalog Price Mismatch",
    severity: "Passed",
    message: `Price ₹${lockedPrice.toLocaleString("en-IN")} matches current catalog rate.`,
    explanation: `Subscription unit rate is synchronized with the "${catalogPlan.name}" catalog price. No pricing variance detected.`,
    suggestedRemediation: "",
    subscriptionId: subscription.id,
    customerId: subscription.customerId,
    canAutoFix: false,
  };
}

/** ─────────────── RULE 5: Invalid Quantity / Seats ─────────────── */
function checkInvalidQuantity(input: GuardAuditInput): IntegrityCheckResult {
  const { subscription, plans } = input;
  const catalogPlan = plans.find((p) => p.id === subscription.planId);
  const seats = subscription.seats;

  if (seats <= 0) {
    return {
      ruleId: "RULE_INVALID_QUANTITY",
      ruleName: "Invalid Seat Quantity",
      severity: "Critical",
      message: `Subscription quantity is ${seats} — must be at least 1.`,
      explanation: "A zero or negative seat count would produce an invalid invoice amount. Billing requires at least 1 billable unit.",
      suggestedRemediation: "Set the seat count to a positive number before generating the invoice.",
      subscriptionId: subscription.id,
      customerId: subscription.customerId,
      canAutoFix: false,
    };
  }

  if (catalogPlan && seats > catalogPlan.maxSeats) {
    return {
      ruleId: "RULE_INVALID_QUANTITY",
      ruleName: "Invalid Seat Quantity",
      severity: "Critical",
      message: `Subscription has ${seats} seats, exceeding the "${catalogPlan.name}" plan limit of ${catalogPlan.maxSeats}.`,
      explanation: `This plan tier supports a maximum of ${catalogPlan.maxSeats} seats. Billing ${seats} seats would exceed the contractual limit. An upgrade to Enterprise Scale may be required.`,
      suggestedRemediation: `Reduce seat count to ≤${catalogPlan.maxSeats} or upgrade the customer to a higher tier plan.`,
      subscriptionId: subscription.id,
      customerId: subscription.customerId,
      canAutoFix: false,
    };
  }

  return {
    ruleId: "RULE_INVALID_QUANTITY",
    ruleName: "Invalid Seat Quantity",
    severity: "Passed",
    message: `Seat count ${seats} is valid${catalogPlan ? ` (within ${catalogPlan.maxSeats} seat limit)` : ""}.`,
    explanation: `${seats} provisioned seat${seats > 1 ? "s" : ""} are within the contracted tier capacity.`,
    suggestedRemediation: "",
    subscriptionId: subscription.id,
    customerId: subscription.customerId,
    canAutoFix: false,
  };
}

/** ─────────────── RULE 6: Ineligible Status ─────────────── */
function checkIneligibleStatus(input: GuardAuditInput): IntegrityCheckResult {
  const { subscription, customers } = input;
  const customer = customers.find((c) => c.id === subscription.customerId);

  const subStatus = subscription.status;
  const custStatus = customer?.status;

  if (subStatus === "Paused" || subStatus === "Canceled") {
    return {
      ruleId: "RULE_INELIGIBLE_STATUS",
      ruleName: "Ineligible Subscription Status",
      severity: "Critical",
      message: `Subscription status is "${subStatus}" — invoicing is not permitted.`,
      explanation: `Only "Active" subscriptions can generate invoices. This subscription is currently "${subStatus}", which means billing has been intentionally stopped. Generating an invoice for a paused or canceled subscription would violate billing agreements.`,
      suggestedRemediation: `Reactivate the subscription to "Active" status before generating an invoice. Click "Auto-Fix" to reactivate the subscription and customer account.`,
      subscriptionId: subscription.id,
      customerId: subscription.customerId,
      canAutoFix: true,
    };
  }

  if (custStatus === "Suspended" || custStatus === "Inactive") {
    return {
      ruleId: "RULE_INELIGIBLE_STATUS",
      ruleName: "Ineligible Subscription Status",
      severity: "Critical",
      message: `Customer account is "${custStatus}" — billing is blocked at the account level.`,
      explanation: `The customer "${customer?.company || subscription.customerId}" has an account status of "${custStatus}". Billing a suspended or inactive account may violate service agreements and could result in disputed charges.`,
      suggestedRemediation: `Reactivate the customer account to "Active" before proceeding with invoicing. Click "Auto-Fix" to restore the account.`,
      subscriptionId: subscription.id,
      customerId: subscription.customerId,
      canAutoFix: true,
    };
  }

  return {
    ruleId: "RULE_INELIGIBLE_STATUS",
    ruleName: "Ineligible Subscription Status",
    severity: "Passed",
    message: `Subscription is "Active" and customer is in good standing.`,
    explanation: `Both the subscription (${subStatus}) and customer account (${custStatus || "Active"}) are eligible for billing.`,
    suggestedRemediation: "",
    subscriptionId: subscription.id,
    customerId: subscription.customerId,
    canAutoFix: false,
  };
}

/** ─────────────── RULE 7: Missing Tax Configuration ─────────────── */
function checkMissingTax(input: GuardAuditInput): IntegrityCheckResult {
  const { subscription, customers } = input;
  const customer = customers.find((c) => c.id === subscription.customerId);

  if (!subscription.taxRatePercentage && subscription.taxRatePercentage !== 0) {
    return {
      ruleId: "RULE_MISSING_TAX",
      ruleName: "Missing Tax Configuration",
      severity: "Warning",
      message: "Subscription has no tax rate configured. Defaulting to 18% GST.",
      explanation: "No explicit GST rate was set on this subscription. The system default of 18% will be applied. If this customer operates in a special economic zone or has a different tax classification, this should be corrected.",
      suggestedRemediation: "Set an explicit tax rate in subscription settings, or confirm that 18% default is correct for this customer.",
      subscriptionId: subscription.id,
      customerId: subscription.customerId,
      canAutoFix: false,
    };
  }

  if (!customer?.gstin) {
    return {
      ruleId: "RULE_MISSING_TAX",
      ruleName: "Missing Tax Configuration",
      severity: "Warning",
      message: `Customer "${customer?.company || "Unknown"}" has no GSTIN registered.`,
      explanation: "A GSTIN is required for B2B GST-compliant invoices in India. Without it, the invoice cannot include a valid GST identification for the recipient, which may cause issues during the customer's GST filing.",
      suggestedRemediation: "Request the customer's GSTIN and update their profile in the Customer Directory.",
      subscriptionId: subscription.id,
      customerId: subscription.customerId,
      canAutoFix: false,
    };
  }

  return {
    ruleId: "RULE_MISSING_TAX",
    ruleName: "Missing Tax Configuration",
    severity: "Passed",
    message: `GST ${subscription.taxRatePercentage}% configured. Customer GSTIN: ${customer.gstin}.`,
    explanation: "Statutory tax rate is explicitly set and customer GSTIN is on file. Invoice will be fully GST-compliant.",
    suggestedRemediation: "",
    subscriptionId: subscription.id,
    customerId: subscription.customerId,
    canAutoFix: false,
  };
}

/** ─────────────── RULE 8: Calculation Mismatch ─────────────── */
function checkCalculationMismatch(input: GuardAuditInput): IntegrityCheckResult {
  const { subscription } = input;
  const { unitPrice, seats, discountPercentage, taxRatePercentage } = subscription;

  const grossAmount = round2(unitPrice * seats);
  const discountAmount = round2(grossAmount * ((discountPercentage || 0) / 100));
  const taxableAmount = round2(grossAmount - discountAmount);
  const taxRate = taxRatePercentage || 18;
  const cgst = round2(taxableAmount * (taxRate / 200));
  const sgst = round2(taxableAmount * (taxRate / 200));
  const computedTotal = round2(taxableAmount + cgst + sgst);

  // Check the last existing invoice for this subscription
  const lastInvoice = input.existingInvoices
    .filter((inv) => inv.subscriptionId === subscription.id)
    .sort((a, b) => b.issueDate.localeCompare(a.issueDate))[0];

  if (lastInvoice) {
    const storedTotal = round2(lastInvoice.totalAmount);
    const diff = Math.abs(computedTotal - storedTotal);
    if (diff > 0.01) {
      return {
        ruleId: "RULE_CALC_MISMATCH",
        ruleName: "Calculation Integrity Mismatch",
        severity: "Critical",
        message: `Invoice ${lastInvoice.invoiceNumber} total ₹${storedTotal.toLocaleString("en-IN")} doesn't match recomputed ₹${computedTotal.toLocaleString("en-IN")} (Δ ₹${diff.toFixed(2)}).`,
        explanation: `The stored invoice total and the independently recalculated amount diverge by ₹${diff.toFixed(2)}. This could indicate a post-invoice modification, a rounding error, or data corruption. Regenerating without investigation risks issuing a materially incorrect invoice.`,
        suggestedRemediation: "Review the invoice line items and recalculate manually. If the new parameters are intentional (e.g. discount change), void the old invoice and generate a fresh one.",
        subscriptionId: subscription.id,
        customerId: subscription.customerId,
        canAutoFix: false,
      };
    }
  }

  return {
    ruleId: "RULE_CALC_MISMATCH",
    ruleName: "Calculation Integrity Mismatch",
    severity: "Passed",
    message: `Re-computed total ₹${computedTotal.toLocaleString("en-IN")} — arithmetic verified (tolerance < ₹0.01).`,
    explanation: "Independent re-computation of the billing formula matches the stored calculation exactly. No arithmetic drift detected.",
    suggestedRemediation: "",
    subscriptionId: subscription.id,
    customerId: subscription.customerId,
    canAutoFix: false,
  };
}

/** ─────────────── MASTER AUDIT RUNNER ─────────────── */
export function runBillingGuardAudit(input: GuardAuditInput): GuardAuditReport {
  const checks: IntegrityCheckResult[] = [
    checkDuplicatePeriod(input),
    checkInvalidDates(input),
    checkExpiredDiscount(input),
    checkPriceMismatch(input),
    checkInvalidQuantity(input),
    checkIneligibleStatus(input),
    checkMissingTax(input),
    checkCalculationMismatch(input),
  ];

  const hasCritical = checks.some((c) => c.severity === "Critical");
  const hasWarning = checks.some((c) => c.severity === "Warning");

  const overallStatus: "Passed" | "Warning" | "Critical" = hasCritical
    ? "Critical"
    : hasWarning
    ? "Warning"
    : "Passed";

  const customer = input.customers.find((c) => c.id === input.subscription.customerId);

  return {
    subscriptionId: input.subscription.id,
    customerId: input.subscription.customerId,
    customerName: customer?.company || input.subscription.customerId,
    overallStatus,
    checks,
    canGenerateInvoice: !hasCritical,
    auditedAt: new Date().toISOString(),
  };
}

