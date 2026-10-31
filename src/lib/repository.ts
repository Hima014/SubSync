import {
  ActivityLog,
  Customer,
  Invoice,
  Organization,
  Payment,
  Plan,
  Subscription,
} from '@/types';
import {
  DEMO_ORGANIZATION,
  INITIAL_ACTIVITY_LOGS,
  INITIAL_CUSTOMERS,
  INITIAL_INVOICES,
  INITIAL_PAYMENTS,
  INITIAL_PLANS,
  INITIAL_SUBSCRIPTIONS,
} from './demo-data';

const STORAGE_KEYS = {
  ORG: 'subsync_org',
  CUSTOMERS: 'subsync_customers',
  PLANS: 'subsync_plans',
  SUBSCRIPTIONS: 'subsync_subscriptions',
  INVOICES: 'subsync_invoices',
  PAYMENTS: 'subsync_payments',
  ACTIVITY: 'subsync_activity',
  INITIALIZED: 'subsync_initialized_v1',
};

// In-memory fallback for SSR or node test runs
let memOrg: Organization = { ...DEMO_ORGANIZATION };
let memCustomers: Customer[] = [...INITIAL_CUSTOMERS];
let memPlans: Plan[] = [...INITIAL_PLANS];
let memSubscriptions: Subscription[] = [...INITIAL_SUBSCRIPTIONS];
let memInvoices: Invoice[] = [...INITIAL_INVOICES];
let memPayments: Payment[] = [...INITIAL_PAYMENTS];
let memActivity: ActivityLog[] = [...INITIAL_ACTIVITY_LOGS];

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function getItem<T>(key: string, defaultVal: T): T {
  if (!isBrowser()) return defaultVal;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return defaultVal;
    return JSON.parse(raw) as T;
  } catch (e) {
    console.error(`Failed to load ${key} from storage`, e);
    return defaultVal;
  }
}

function setItem<T>(key: string, val: T): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(val));
  } catch (e) {
    console.error(`Failed to save ${key} to storage`, e);
  }
}

export function ensureStorageInitialized(): void {
  if (!isBrowser()) return;
  const isInit = window.localStorage.getItem(STORAGE_KEYS.INITIALIZED);
  if (!isInit) {
    resetDemoData();
  }
}

export function resetDemoData(): void {
  if (isBrowser()) {
    window.localStorage.setItem(STORAGE_KEYS.ORG, JSON.stringify(DEMO_ORGANIZATION));
    window.localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(INITIAL_CUSTOMERS));
    window.localStorage.setItem(STORAGE_KEYS.PLANS, JSON.stringify(INITIAL_PLANS));
    window.localStorage.setItem(STORAGE_KEYS.SUBSCRIPTIONS, JSON.stringify(INITIAL_SUBSCRIPTIONS));
    window.localStorage.setItem(STORAGE_KEYS.INVOICES, JSON.stringify(INITIAL_INVOICES));
    window.localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(INITIAL_PAYMENTS));
    window.localStorage.setItem(STORAGE_KEYS.ACTIVITY, JSON.stringify(INITIAL_ACTIVITY_LOGS));
    window.localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');
  }
  memOrg = { ...DEMO_ORGANIZATION };
  memCustomers = [...INITIAL_CUSTOMERS];
  memPlans = [...INITIAL_PLANS];
  memSubscriptions = [...INITIAL_SUBSCRIPTIONS];
  memInvoices = [...INITIAL_INVOICES];
  memPayments = [...INITIAL_PAYMENTS];
  memActivity = [...INITIAL_ACTIVITY_LOGS];
}

// Activity Logger
export async function logActivity(log: Omit<ActivityLog, 'id' | 'orgId' | 'timestamp'>): Promise<ActivityLog> {
  const newLog: ActivityLog = {
    id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    orgId: DEMO_ORGANIZATION.id,
    timestamp: new Date().toISOString(),
    ...log,
  };

  if (isBrowser()) {
    const logs = getItem<ActivityLog[]>(STORAGE_KEYS.ACTIVITY, INITIAL_ACTIVITY_LOGS);
    const updated = [newLog, ...logs];
    setItem(STORAGE_KEYS.ACTIVITY, updated);
  } else {
    memActivity = [newLog, ...memActivity];
  }

  return newLog;
}

export async function getActivityLogs(): Promise<ActivityLog[]> {
  if (isBrowser()) {
    ensureStorageInitialized();
    return getItem<ActivityLog[]>(STORAGE_KEYS.ACTIVITY, INITIAL_ACTIVITY_LOGS);
  }
  return memActivity;
}

// Organization
export async function getOrganization(): Promise<Organization> {
  if (isBrowser()) {
    ensureStorageInitialized();
    return getItem<Organization>(STORAGE_KEYS.ORG, DEMO_ORGANIZATION);
  }
  return memOrg;
}

export async function updateOrganization(data: Partial<Organization>): Promise<Organization> {
  const current = await getOrganization();
  const updated = { ...current, ...data };
  if (isBrowser()) {
    setItem(STORAGE_KEYS.ORG, updated);
  } else {
    memOrg = updated;
  }
  await logActivity({
    action: 'ORGANIZATION_UPDATED',
    entityType: 'customer',
    entityId: updated.id,
    description: `Organization profile updated: ${updated.name}`,
  });
  return updated;
}

// Customers
export async function getCustomers(): Promise<Customer[]> {
  if (isBrowser()) {
    ensureStorageInitialized();
    return getItem<Customer[]>(STORAGE_KEYS.CUSTOMERS, INITIAL_CUSTOMERS);
  }
  return memCustomers;
}

export async function getCustomerById(id: string): Promise<Customer | null> {
  const customers = await getCustomers();
  return customers.find((c) => c.id === id) || null;
}

export async function createCustomer(data: Omit<Customer, 'id' | 'orgId' | 'createdAt' | 'updatedAt'>): Promise<Customer> {
  const customers = await getCustomers();
  const now = new Date().toISOString();
  const newCustomer: Customer = {
    id: `cust_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    orgId: DEMO_ORGANIZATION.id,
    ...data,
    createdAt: now,
    updatedAt: now,
  };
  const updated = [newCustomer, ...customers];
  if (isBrowser()) {
    setItem(STORAGE_KEYS.CUSTOMERS, updated);
  } else {
    memCustomers = updated;
  }
  await logActivity({
    action: 'CUSTOMER_CREATED',
    entityType: 'customer',
    entityId: newCustomer.id,
    description: `Added customer ${newCustomer.name} (${newCustomer.company})`,
  });
  return newCustomer;
}

export async function updateCustomer(id: string, data: Partial<Customer>): Promise<Customer> {
  const customers = await getCustomers();
  const idx = customers.findIndex((c) => c.id === id);
  if (idx === -1) throw new Error(`Customer ${id} not found`);

  const updatedCustomer = {
    ...customers[idx],
    ...data,
    updatedAt: new Date().toISOString(),
  };
  customers[idx] = updatedCustomer;

  if (isBrowser()) {
    setItem(STORAGE_KEYS.CUSTOMERS, customers);
  } else {
    memCustomers = customers;
  }
  await logActivity({
    action: 'CUSTOMER_UPDATED',
    entityType: 'customer',
    entityId: id,
    description: `Updated customer details for ${updatedCustomer.name}`,
  });
  return updatedCustomer;
}

export async function deleteCustomer(id: string): Promise<boolean> {
  const subscriptions = await getSubscriptions();
  const activeSubs = subscriptions.filter((s) => s.customerId === id && s.status !== 'cancelled');
  if (activeSubs.length > 0) {
    throw new Error('Cannot delete customer with active or paused subscriptions. Cancel them first.');
  }

  const customers = await getCustomers();
  const target = customers.find((c) => c.id === id);
  const filtered = customers.filter((c) => c.id !== id);

  if (isBrowser()) {
    setItem(STORAGE_KEYS.CUSTOMERS, filtered);
  } else {
    memCustomers = filtered;
  }
  await logActivity({
    action: 'CUSTOMER_DELETED',
    entityType: 'customer',
    entityId: id,
    description: `Deleted customer record ${target?.name || id}`,
  });
  return true;
}

// Plans
export async function getPlans(): Promise<Plan[]> {
  if (isBrowser()) {
    ensureStorageInitialized();
    return getItem<Plan[]>(STORAGE_KEYS.PLANS, INITIAL_PLANS);
  }
  return memPlans;
}

export async function getPlanById(id: string): Promise<Plan | null> {
  const plans = await getPlans();
  return plans.find((p) => p.id === id) || null;
}

export async function createPlan(data: Omit<Plan, 'id' | 'orgId' | 'createdAt'>): Promise<Plan> {
  const plans = await getPlans();
  const newPlan: Plan = {
    id: `plan_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    orgId: DEMO_ORGANIZATION.id,
    ...data,
    createdAt: new Date().toISOString(),
  };
  const updated = [newPlan, ...plans];
  if (isBrowser()) {
    setItem(STORAGE_KEYS.PLANS, updated);
  } else {
    memPlans = updated;
  }
  await logActivity({
    action: 'PLAN_CREATED',
    entityType: 'plan',
    entityId: newPlan.id,
    description: `Created plan ${newPlan.name} at $${(newPlan.priceMinorUnits / 100).toFixed(2)}/${newPlan.billingInterval}`,
  });
  return newPlan;
}

export async function updatePlan(id: string, data: Partial<Plan>): Promise<Plan> {
  const plans = await getPlans();
  const idx = plans.findIndex((p) => p.id === id);
  if (idx === -1) throw new Error(`Plan ${id} not found`);

  const updatedPlan = { ...plans[idx], ...data };
  plans[idx] = updatedPlan;

  if (isBrowser()) {
    setItem(STORAGE_KEYS.PLANS, plans);
  } else {
    memPlans = plans;
  }
  await logActivity({
    action: 'PLAN_UPDATED',
    entityType: 'plan',
    entityId: id,
    description: `Updated plan ${updatedPlan.name}`,
  });
  return updatedPlan;
}

// Subscriptions
export async function getSubscriptions(): Promise<Subscription[]> {
  if (isBrowser()) {
    ensureStorageInitialized();
    return getItem<Subscription[]>(STORAGE_KEYS.SUBSCRIPTIONS, INITIAL_SUBSCRIPTIONS);
  }
  return memSubscriptions;
}

export async function getSubscriptionById(id: string): Promise<Subscription | null> {
  const subs = await getSubscriptions();
  return subs.find((s) => s.id === id) || null;
}

export async function createSubscription(data: Omit<Subscription, 'id' | 'orgId' | 'createdAt' | 'updatedAt'>): Promise<Subscription> {
  const subs = await getSubscriptions();
  const now = new Date().toISOString();
  const newSub: Subscription = {
    id: `sub_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    orgId: DEMO_ORGANIZATION.id,
    ...data,
    createdAt: now,
    updatedAt: now,
  };
  const updated = [newSub, ...subs];
  if (isBrowser()) {
    setItem(STORAGE_KEYS.SUBSCRIPTIONS, updated);
  } else {
    memSubscriptions = updated;
  }
  await logActivity({
    action: 'SUBSCRIPTION_CREATED',
    entityType: 'subscription',
    entityId: newSub.id,
    description: `New subscription created for customer ${newSub.customerId}`,
  });
  return newSub;
}

export async function updateSubscription(id: string, data: Partial<Subscription>): Promise<Subscription> {
  const subs = await getSubscriptions();
  const idx = subs.findIndex((s) => s.id === id);
  if (idx === -1) throw new Error(`Subscription ${id} not found`);

  const updatedSub = {
    ...subs[idx],
    ...data,
    updatedAt: new Date().toISOString(),
  };
  subs[idx] = updatedSub;

  if (isBrowser()) {
    setItem(STORAGE_KEYS.SUBSCRIPTIONS, subs);
  } else {
    memSubscriptions = subs;
  }
  return updatedSub;
}

export async function pauseSubscription(id: string): Promise<Subscription> {
  const sub = await updateSubscription(id, {
    status: 'paused',
    pausedAt: new Date().toISOString(),
  });
  await logActivity({
    action: 'SUBSCRIPTION_PAUSED',
    entityType: 'subscription',
    entityId: id,
    description: `Subscription ${id} was paused. Billing is suspended.`,
  });
  return sub;
}

export async function resumeSubscription(id: string): Promise<Subscription> {
  const sub = await updateSubscription(id, {
    status: 'active',
    pausedAt: undefined,
  });
  await logActivity({
    action: 'SUBSCRIPTION_RESUMED',
    entityType: 'subscription',
    entityId: id,
    description: `Subscription ${id} resumed to Active state.`,
  });
  return sub;
}

export async function cancelSubscription(id: string, reason?: string): Promise<Subscription> {
  const sub = await updateSubscription(id, {
    status: 'cancelled',
    cancelReason: reason || 'Customer requested termination',
  });
  await logActivity({
    action: 'SUBSCRIPTION_CANCELLED',
    entityType: 'subscription',
    entityId: id,
    description: `Subscription ${id} cancelled. ${reason ? `Reason: ${reason}` : ''}`,
  });
  return sub;
}

// Invoices
export async function getInvoices(): Promise<Invoice[]> {
  if (isBrowser()) {
    ensureStorageInitialized();
    return getItem<Invoice[]>(STORAGE_KEYS.INVOICES, INITIAL_INVOICES);
  }
  return memInvoices;
}

export async function getInvoiceById(id: string): Promise<Invoice | null> {
  const invoices = await getInvoices();
  return invoices.find((inv) => inv.id === id) || null;
}

export async function createInvoice(invoiceData: Omit<Invoice, 'id' | 'orgId' | 'invoiceNumber' | 'createdAt' | 'updatedAt'>): Promise<Invoice> {
  const invoices = await getInvoices();
  const year = new Date().getFullYear();
  const nextNum = 1000 + invoices.length + 1;
  const invoiceNumber = `INV-${year}-${nextNum}`;
  const now = new Date().toISOString();

  const newInvoice: Invoice = {
    id: `inv_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    orgId: DEMO_ORGANIZATION.id,
    invoiceNumber,
    ...invoiceData,
    createdAt: now,
    updatedAt: now,
  };

  const updated = [newInvoice, ...invoices];
  if (isBrowser()) {
    setItem(STORAGE_KEYS.INVOICES, updated);
  } else {
    memInvoices = updated;
  }

  await logActivity({
    action: 'INVOICE_GENERATED',
    entityType: 'invoice',
    entityId: newInvoice.id,
    description: `Generated ${invoiceNumber} for amount $${(newInvoice.totalMinorUnits / 100).toFixed(2)}`,
  });

  return newInvoice;
}

// Payments with strict overpayment prevention
export async function getPayments(): Promise<Payment[]> {
  if (isBrowser()) {
    ensureStorageInitialized();
    return getItem<Payment[]>(STORAGE_KEYS.PAYMENTS, INITIAL_PAYMENTS);
  }
  return memPayments;
}

export async function recordPayment(params: {
  invoiceId: string;
  amountMinorUnits: number;
  paymentMethod: Payment['paymentMethod'];
  referenceNumber: string;
  notes?: string;
}): Promise<{ payment: Payment; invoice: Invoice }> {
  const invoices = await getInvoices();
  const invIndex = invoices.findIndex((i) => i.id === params.invoiceId);
  if (invIndex === -1) {
    throw new Error(`Invoice ${params.invoiceId} not found`);
  }

  const invoice = invoices[invIndex];

  if (params.amountMinorUnits <= 0) {
    throw new Error('Payment amount must be greater than zero.');
  }

  if (params.amountMinorUnits > invoice.balanceDueMinorUnits) {
    throw new Error(
      `Overpayment rejected! Attempted payment of $${(params.amountMinorUnits / 100).toFixed(2)} exceeds remaining balance of $${(invoice.balanceDueMinorUnits / 100).toFixed(2)}.`
    );
  }

  // Create payment record
  const payment: Payment = {
    id: `pay_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    orgId: DEMO_ORGANIZATION.id,
    invoiceId: invoice.id,
    customerId: invoice.customerId,
    amountMinorUnits: params.amountMinorUnits,
    currency: invoice.currency,
    paymentMethod: params.paymentMethod,
    referenceNumber: params.referenceNumber,
    isSimulated: true,
    status: 'succeeded',
    recordedAt: new Date().toISOString(),
    notes: params.notes,
  };

  // Update invoice balances and status
  const updatedAmountPaid = invoice.amountPaidMinorUnits + params.amountMinorUnits;
  const updatedBalanceDue = invoice.totalMinorUnits - updatedAmountPaid;
  const newStatus = updatedBalanceDue === 0 ? 'paid' : 'partially_paid';

  const updatedInvoice: Invoice = {
    ...invoice,
    amountPaidMinorUnits: updatedAmountPaid,
    balanceDueMinorUnits: updatedBalanceDue,
    status: newStatus,
    updatedAt: new Date().toISOString(),
  };

  invoices[invIndex] = updatedInvoice;

  // Persist
  if (isBrowser()) {
    const payments = getItem<Payment[]>(STORAGE_KEYS.PAYMENTS, INITIAL_PAYMENTS);
    setItem(STORAGE_KEYS.PAYMENTS, [payment, ...payments]);
    setItem(STORAGE_KEYS.INVOICES, invoices);
  } else {
    memPayments = [payment, ...memPayments];
    memInvoices = invoices;
  }

  await logActivity({
    action: 'PAYMENT_RECORDED',
    entityType: 'payment',
    entityId: payment.id,
    description: `Recorded payment of $${(params.amountMinorUnits / 100).toFixed(2)} for invoice ${invoice.invoiceNumber}. Remaining balance: $${(updatedBalanceDue / 100).toFixed(2)}.`,
  });

  return { payment, invoice: updatedInvoice };
}

