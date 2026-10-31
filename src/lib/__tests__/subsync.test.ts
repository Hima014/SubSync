import { describe, expect, it, beforeEach } from 'vitest';
import { calculateBilling, calculateMRR, formatMinorUnits, createInvoicePassport } from '../billing-engine';
import { evaluateBillingIntegrity, ProposedBillingPayload } from '../integrity-guard';
import { recordPayment, getInvoices, resetDemoData, getSubscriptions, getPlans } from '../repository';
import { Customer, Invoice, Plan, Subscription } from '@/types';

describe('SUBSYNC Billing Engine & Financial Integrity', () => {
  it('correctly calculates base amount, 10% discount, and 10% tax in integer minor units', () => {
    // 3 units at $199.00 = $597.00 (59700 cents)
    // 10% discount = $59.70 (5970 cents)
    // Taxable = $537.30 (53730 cents)
    // 10% tax = $53.73 (5373 cents)
    // Total = $591.03 (59103 cents)
    const result = calculateBilling({
      unitPriceMinorUnits: 19900,
      quantity: 3,
      discountPercent: 10,
      taxRatePercent: 10,
    });

    expect(result.baseAmountMinorUnits).toBe(59700);
    expect(result.discountMinorUnits).toBe(5970);
    expect(result.taxableAmountMinorUnits).toBe(53730);
    expect(result.taxMinorUnits).toBe(5373);
    expect(result.totalMinorUnits).toBe(59103);
  });

  it('formats minor units accurately without floating point rounding errors', () => {
    expect(formatMinorUnits(59103, 'USD')).toBe('$591.03');
    expect(formatMinorUnits(240000, 'USD')).toBe('$2,400.00');
    expect(formatMinorUnits(0, 'USD')).toBe('$0.00');
  });

  it('correctly calculates normalized MRR across monthly, quarterly, and annual subscriptions', () => {
    const plans: Plan[] = [
      {
        id: 'p_monthly',
        orgId: 'org1',
        name: 'Pro Monthly',
        description: '',
        priceMinorUnits: 10000, // $100/mo
        currency: 'USD',
        billingInterval: 'monthly',
        taxRatePercent: 0,
        isActive: true,
        createdAt: '',
      },
      {
        id: 'p_annual',
        orgId: 'org1',
        name: 'Enterprise Annual',
        description: '',
        priceMinorUnits: 120000, // $1,200/yr -> $100/mo
        currency: 'USD',
        billingInterval: 'yearly',
        taxRatePercent: 0,
        isActive: true,
        createdAt: '',
      },
    ];

    const subs: Subscription[] = [
      {
        id: 's1',
        orgId: 'org1',
        customerId: 'c1',
        planId: 'p_monthly',
        status: 'active',
        quantity: 2, // 2 * $100 = $200/mo
        startDate: '',
        currentPeriodStart: '',
        currentPeriodEnd: '',
        nextBillingDate: '',
        createdAt: '',
        updatedAt: '',
      },
      {
        id: 's2',
        orgId: 'org1',
        customerId: 'c2',
        planId: 'p_annual',
        status: 'active',
        quantity: 1, // $1,200/yr / 12 = $100/mo
        startDate: '',
        currentPeriodStart: '',
        currentPeriodEnd: '',
        nextBillingDate: '',
        createdAt: '',
        updatedAt: '',
      },
      {
        id: 's3',
        orgId: 'org1',
        customerId: 'c3',
        planId: 'p_monthly',
        status: 'cancelled', // Should NOT be included in MRR
        quantity: 10,
        startDate: '',
        currentPeriodStart: '',
        currentPeriodEnd: '',
        nextBillingDate: '',
        createdAt: '',
        updatedAt: '',
      },
    ];

    // Total MRR: $200 + $100 = $300 (30000 cents)
    const mrr = calculateMRR(subs, plans);
    expect(mrr).toBe(30000);
  });
});

describe('Billing Integrity Guard Deterministic Rules', () => {
  const dummyPlan: Plan = {
    id: 'plan_std',
    orgId: 'org1',
    name: 'Standard Cloud',
    description: '',
    priceMinorUnits: 5000,
    currency: 'USD',
    billingInterval: 'monthly',
    taxRatePercent: 10,
    isActive: true,
    createdAt: '',
  };

  const dummyCustomer: Customer = {
    id: 'cust_1',
    orgId: 'org1',
    name: 'Jane Doe',
    company: 'Alpha Corp',
    email: 'jane@alpha.com',
    billingAddress: {
      line1: '123 Market St',
      city: 'San Francisco',
      state: 'CA',
      postalCode: '94105',
      country: 'USA',
    },
    createdAt: '',
    updatedAt: '',
  };

  const dummySub: Subscription = {
    id: 'sub_alpha',
    orgId: 'org1',
    customerId: 'cust_1',
    planId: 'plan_std',
    status: 'active',
    quantity: 1,
    startDate: '2026-01-01',
    currentPeriodStart: '2026-10-01',
    currentPeriodEnd: '2026-10-31',
    nextBillingDate: '2026-11-01',
    createdAt: '',
    updatedAt: '',
  };

  it('RULE 1: BLOCKS duplicate billing period when invoice already exists', () => {
    const existingInvoices: Invoice[] = [
      {
        id: 'inv_existing',
        orgId: 'org1',
        invoiceNumber: 'INV-2026-999',
        customerId: 'cust_1',
        subscriptionId: 'sub_alpha',
        status: 'paid',
        billingPeriodStart: '2026-10-01',
        billingPeriodEnd: '2026-10-31',
        currency: 'USD',
        lineItems: [],
        subtotalMinorUnits: 5000,
        discountMinorUnits: 0,
        taxMinorUnits: 500,
        totalMinorUnits: 5500,
        amountPaidMinorUnits: 5500,
        balanceDueMinorUnits: 0,
        dueDate: '2026-10-15',
        issuedDate: '2026-10-01',
        createdAt: '',
        updatedAt: '',
      },
    ];

    const evaluation = evaluateBillingIntegrity({
      subscription: dummySub,
      plan: dummyPlan,
      customer: dummyCustomer,
      billingPeriodStart: '2026-10-01',
      billingPeriodEnd: '2026-10-31',
      proposedUnitPriceMinorUnits: 5000,
      proposedQuantity: 1,
      existingInvoices,
    });

    expect(evaluation.status).toBe('BLOCKED');
    expect(evaluation.canProceed).toBe(false);
    expect(evaluation.issues.some((i) => i.code === 'DUPLICATE_BILLING_PERIOD')).toBe(true);
  });

  it('RULE 2: BLOCKS invalid date range when end date precedes start date', () => {
    const evaluation = evaluateBillingIntegrity({
      subscription: dummySub,
      plan: dummyPlan,
      customer: dummyCustomer,
      billingPeriodStart: '2026-11-30',
      billingPeriodEnd: '2026-11-01', // Invalid: end before start
      proposedUnitPriceMinorUnits: 5000,
      proposedQuantity: 1,
      existingInvoices: [],
    });

    expect(evaluation.status).toBe('BLOCKED');
    expect(evaluation.canProceed).toBe(false);
    expect(evaluation.issues.some((i) => i.code === 'INVALID_DATE_RANGE')).toBe(true);
  });

  it('RULE 3: BLOCKS billing attempt on cancelled or paused subscription', () => {
    const cancelledSub: Subscription = { ...dummySub, status: 'cancelled' };
    const evalCancelled = evaluateBillingIntegrity({
      subscription: cancelledSub,
      plan: dummyPlan,
      customer: dummyCustomer,
      billingPeriodStart: '2026-11-01',
      billingPeriodEnd: '2026-11-30',
      proposedUnitPriceMinorUnits: 5000,
      proposedQuantity: 1,
      existingInvoices: [],
    });

    expect(evalCancelled.status).toBe('BLOCKED');
    expect(evalCancelled.issues.some((i) => i.code === 'SUBSCRIPTION_CANCELLED')).toBe(true);

    const pausedSub: Subscription = { ...dummySub, status: 'paused' };
    const evalPaused = evaluateBillingIntegrity({
      subscription: pausedSub,
      plan: dummyPlan,
      customer: dummyCustomer,
      billingPeriodStart: '2026-11-01',
      billingPeriodEnd: '2026-11-30',
      proposedUnitPriceMinorUnits: 5000,
      proposedQuantity: 1,
      existingInvoices: [],
    });

    expect(evalPaused.status).toBe('BLOCKED');
    expect(evalPaused.issues.some((i) => i.code === 'SUBSCRIPTION_PAUSED')).toBe(true);
  });

  it('RULE 4: WARNS on unexpected price deviation from master plan', () => {
    const evaluation = evaluateBillingIntegrity({
      subscription: dummySub,
      plan: dummyPlan, // Base price is 5000 ($50.00)
      customer: dummyCustomer,
      billingPeriodStart: '2026-11-01',
      billingPeriodEnd: '2026-11-30',
      proposedUnitPriceMinorUnits: 7500, // Override $75.00
      proposedQuantity: 1,
      existingInvoices: [],
    });

    expect(evaluation.status).toBe('REVIEW_REQUIRED');
    expect(evaluation.issues.some((i) => i.code === 'UNEXPECTED_PRICE_OVERRIDE')).toBe(true);
  });

  it('RULE 6: BLOCKS invalid zero or negative quantity', () => {
    const evaluation = evaluateBillingIntegrity({
      subscription: dummySub,
      plan: dummyPlan,
      customer: dummyCustomer,
      billingPeriodStart: '2026-11-01',
      billingPeriodEnd: '2026-11-30',
      proposedUnitPriceMinorUnits: 5000,
      proposedQuantity: 0, // Invalid quantity
      existingInvoices: [],
    });

    expect(evaluation.status).toBe('BLOCKED');
    expect(evaluation.issues.some((i) => i.code === 'INVALID_SEATS_QUANTITY')).toBe(true);
  });

  it('RULE 7: BLOCKS client calculation mismatch', () => {
    const evaluation = evaluateBillingIntegrity({
      subscription: dummySub,
      plan: dummyPlan,
      customer: dummyCustomer,
      billingPeriodStart: '2026-11-01',
      billingPeriodEnd: '2026-11-30',
      proposedUnitPriceMinorUnits: 5000,
      proposedQuantity: 1,
      proposedDiscountPercent: 0,
      proposedTaxRatePercent: 10,
      proposedTotalMinorUnits: 99999, // Intentional mismatch from client
      existingInvoices: [],
    });

    expect(evaluation.status).toBe('BLOCKED');
    expect(evaluation.issues.some((i) => i.code === 'FINANCIAL_CALCULATION_MISMATCH')).toBe(true);
  });

  it('VALIDATED: Passes cleanly with VALIDATED status on correct parameters', () => {
    const evaluation = evaluateBillingIntegrity({
      subscription: dummySub,
      plan: dummyPlan,
      customer: dummyCustomer,
      billingPeriodStart: '2026-11-01',
      billingPeriodEnd: '2026-11-30',
      proposedUnitPriceMinorUnits: 5000,
      proposedQuantity: 1,
      proposedDiscountPercent: 0,
      proposedTaxRatePercent: 10,
      proposedTotalMinorUnits: 5500,
      existingInvoices: [],
    });

    expect(evaluation.status).toBe('VALIDATED');
    expect(evaluation.canProceed).toBe(true);
  });
});

describe('Payment Integrity & Overpayment Prevention', () => {
  beforeEach(() => {
    resetDemoData();
  });

  it('strictly rejects payments exceeding the outstanding balance due', async () => {
    // Invoice 1004 has balanceDueMinorUnits of 16950 ($169.50)
    await expect(
      recordPayment({
        invoiceId: 'inv_1004',
        amountMinorUnits: 20000, // $200.00 > $169.50
        paymentMethod: 'card',
        referenceNumber: 'TEST_OVERPAY_FAIL',
      })
    ).rejects.toThrow(/Overpayment rejected/);
  });

  it('accepts legitimate payment and updates balance due and invoice status', async () => {
    const { invoice, payment } = await recordPayment({
      invoiceId: 'inv_1004',
      amountMinorUnits: 16950, // Pay remaining in full
      paymentMethod: 'upi',
      referenceNumber: 'TEST_FULL_PAY',
    });

    expect(invoice.balanceDueMinorUnits).toBe(0);
    expect(invoice.status).toBe('paid');
    expect(payment.status).toBe('succeeded');
  });
});

describe('Explainable Invoice Passport', () => {
  it('creates an immutable snapshot with calculation breakdown and integrity hash', () => {
    const calc = calculateBilling({
      unitPriceMinorUnits: 19900,
      quantity: 2,
      discountPercent: 10,
      taxRatePercent: 10,
    });

    const passport = createInvoicePassport({
      invoiceId: 'inv_passport_test',
      subscriptionId: 'sub_test',
      customerId: 'cust_test',
      issuedAt: '2026-10-31T12:00:00Z',
      periodStart: '2026-11-01',
      periodEnd: '2026-11-30',
      planName: 'Pro Tier',
      calculation: calc,
      integrityResult: {
        status: 'VALIDATED',
        canProceed: true,
        issues: [],
        checkedAt: '2026-10-31T12:00:00Z',
      },
    });

    expect(passport.invoiceId).toBe('inv_passport_test');
    expect(passport.planName).toBe('Pro Tier');
    expect(passport.baseAmountMinorUnits).toBe(39800);
    expect(passport.discountMinorUnits).toBe(3980);
    expect(passport.totalMinorUnits).toBe(39402);
    expect(passport.integritySnapshot.hash).toContain('SS-HASH-');
    expect(passport.integritySnapshot.status).toBe('VALIDATED');
  });
});

