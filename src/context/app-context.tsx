"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import {
  Customer,
  Plan,
  Subscription,
  Invoice,
  Payment,
  SystemSettings,
  SubscriptionStatus,
  InvoiceStatus,
  PaymentStatus,
} from "@/types";
import {
  initialCustomers,
  initialPlans,
  initialSubscriptions,
  initialInvoices,
  initialPayments,
  initialSettings,
} from "@/data/mock-data";
import { generateId } from "@/lib/utils";

interface AppContextType {
  customers: Customer[];
  plans: Plan[];
  subscriptions: Subscription[];
  invoices: Invoice[];
  payments: Payment[];
  settings: SystemSettings;
  integrityAlertsCount: { critical: number; warning: number; passed: number };
  
  // Customers
  addCustomer: (data: Omit<Customer, "id" | "createdAt" | "totalInvoiced" | "activeSubscriptionsCount">) => Customer;
  updateCustomer: (id: string, updates: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;

  // Plans
  addPlan: (data: Omit<Plan, "id">) => Plan;
  updatePlan: (id: string, updates: Partial<Plan>) => void;

  // Subscriptions
  addSubscription: (data: Omit<Subscription, "id" | "integrityStatus">) => Subscription;
  updateSubscription: (id: string, updates: Partial<Subscription>) => void;
  updateSubscriptionStatus: (id: string, status: SubscriptionStatus) => void;
  remediateSubscription: (subId: string, remedy: "clear-duplicate" | "remove-expired-discount" | "sync-catalog-price" | "activate-account") => void;

  // Invoices
  generateInvoiceFromSubscription: (subId: string) => { success: boolean; invoice?: Invoice; error?: string };
  updateInvoiceStatus: (id: string, status: InvoiceStatus) => void;

  // Payments
  recordPayment: (data: Omit<Payment, "id" | "timestamp">) => Payment;
  updatePaymentStatus: (id: string, status: PaymentStatus) => void;

  // Settings
  updateSettings: (updates: Partial<SystemSettings>) => void;

  // Reset
  resetToMockData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEY = "subsync_app_state_v1";

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const [plans, setPlans] = useState<Plan[]>(initialPlans);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>(initialSubscriptions);
  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices);
  const [payments, setPayments] = useState<Payment[]>(initialPayments);
  const [settings, setSettings] = useState<SystemSettings>(initialSettings);
  const [isHydrated, setIsHydrated] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.customers) setCustomers(parsed.customers);
        if (parsed.plans) setPlans(parsed.plans);
        if (parsed.subscriptions) setSubscriptions(parsed.subscriptions);
        if (parsed.invoices) setInvoices(parsed.invoices);
        if (parsed.payments) setPayments(parsed.payments);
        if (parsed.settings) setSettings(parsed.settings);
      }
    } catch (e) {
      console.warn("Failed to load saved state from localStorage:", e);
    } finally {
      setIsHydrated(true);
    }
  }, []);

  // Save to localStorage when state changes
  useEffect(() => {
    if (!isHydrated) return;
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ customers, plans, subscriptions, invoices, payments, settings })
      );
    } catch (e) {
      console.warn("Failed to persist state to localStorage:", e);
    }
  }, [customers, plans, subscriptions, invoices, payments, settings, isHydrated]);

  // Derived audit counts
  const integrityAlertsCount = {
    critical: subscriptions.filter((s) => s.integrityStatus === "Critical").length,
    warning: subscriptions.filter((s) => s.integrityStatus === "Warning").length,
    passed: subscriptions.filter((s) => s.integrityStatus === "Passed").length,
  };

  // Customers
  const addCustomer = (data: Omit<Customer, "id" | "createdAt" | "totalInvoiced" | "activeSubscriptionsCount">): Customer => {
    const newCustomer: Customer = {
      ...data,
      id: generateId("cust"),
      createdAt: new Date().toISOString().split("T")[0],
      totalInvoiced: 0,
      activeSubscriptionsCount: 0,
    };
    setCustomers((prev) => [newCustomer, ...prev]);
    return newCustomer;
  };

  const updateCustomer = (id: string, updates: Partial<Customer>) => {
    setCustomers((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
  };

  const deleteCustomer = (id: string) => {
    setCustomers((prev) => prev.filter((c) => c.id !== id));
  };

  // Plans
  const addPlan = (data: Omit<Plan, "id">): Plan => {
    const newPlan: Plan = {
      ...data,
      id: generateId("plan"),
    };
    setPlans((prev) => [...prev, newPlan]);
    return newPlan;
  };

  const updatePlan = (id: string, updates: Partial<Plan>) => {
    setPlans((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
  };

  // Subscriptions
  const addSubscription = (data: Omit<Subscription, "id" | "integrityStatus">): Subscription => {
    const newSub: Subscription = {
      ...data,
      id: generateId("sub"),
      integrityStatus: "Passed",
      integrityNotes: "Verified upon creation. Clean arithmetic.",
    };
    setSubscriptions((prev) => [newSub, ...prev]);
    setCustomers((prev) =>
      prev.map((c) =>
        c.id === data.customerId
          ? { ...c, activeSubscriptionsCount: c.activeSubscriptionsCount + 1 }
          : c
      )
    );
    return newSub;
  };

  const updateSubscription = (id: string, updates: Partial<Subscription>) => {
    setSubscriptions((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)));
  };

  const updateSubscriptionStatus = (id: string, status: SubscriptionStatus) => {
    setSubscriptions((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s;
        const newStatus = status;
        let newIntegrity = s.integrityStatus;
        let notes = s.integrityNotes;
        if (newStatus === "Paused" || newStatus === "Canceled") {
          newIntegrity = "Critical";
          notes = `Ineligible Status: Subscription is currently marked as ${newStatus}.`;
        } else if (newIntegrity === "Critical" && notes?.includes("Ineligible Status")) {
          newIntegrity = "Passed";
          notes = "Active subscription ready for billing.";
        }
        return { ...s, status: newStatus, integrityStatus: newIntegrity, integrityNotes: notes };
      })
    );
  };

  // Remediate issues
  const remediateSubscription = (
    subId: string,
    remedy: "clear-duplicate" | "remove-expired-discount" | "sync-catalog-price" | "activate-account"
  ) => {
    setSubscriptions((prev) =>
      prev.map((sub) => {
        if (sub.id !== subId) return sub;
        if (remedy === "clear-duplicate") {
          return {
            ...sub,
            billingPeriodStart: "2026-11-01",
            billingPeriodEnd: "2026-11-30",
            renewalDate: "2026-12-01",
            integrityStatus: "Passed",
            integrityNotes: "Remediated: Advance billing cycle set to Nov 2026. Zero period overlap.",
          };
        }
        if (remedy === "remove-expired-discount") {
          return {
            ...sub,
            discountCode: undefined,
            discountPercentage: 0,
            discountExpiresAt: undefined,
            integrityStatus: "Passed",
            integrityNotes: "Remediated: Expired promo voucher purged. Standard rate enforced.",
          };
        }
        if (remedy === "sync-catalog-price") {
          const catalogPlan = plans.find((p) => p.id === sub.planId);
          const newPrice = catalogPlan ? catalogPlan.basePrice : sub.unitPrice;
          return {
            ...sub,
            unitPrice: newPrice,
            integrityStatus: "Passed",
            integrityNotes: `Remediated: Unit price synchronized with catalog price (₹${newPrice}).`,
          };
        }
        if (remedy === "activate-account") {
          // Also activate customer
          setCustomers((custs) =>
            custs.map((c) => (c.id === sub.customerId ? { ...c, status: "Active" } : c))
          );
          return {
            ...sub,
            status: "Active",
            integrityStatus: "Passed",
            integrityNotes: "Remediated: Customer reactivated and subscription resumed.",
          };
        }
        return sub;
      })
    );
  };

  // Generate Invoice
  const generateInvoiceFromSubscription = (
    subId: string
  ): { success: boolean; invoice?: Invoice; error?: string } => {
    const sub = subscriptions.find((s) => s.id === subId);
    if (!sub) return { success: false, error: "Subscription not found" };

    // Integrity Guard Block
    if (sub.integrityStatus === "Critical") {
      return {
        success: false,
        error: `Billing Integrity Guard BLOCKED invoice generation: ${sub.integrityNotes || "Critical validation error detected."}`,
      };
    }

    const customer = customers.find((c) => c.id === sub.customerId);
    const grossSubtotal = sub.unitPrice * sub.seats;
    const discountAmount = Math.round((grossSubtotal * (sub.discountPercentage / 100)) * 100) / 100;
    const taxableAmount = Math.max(0, grossSubtotal - discountAmount);
    const taxRate = sub.taxRatePercentage || settings.defaultGstRate;
    const cgst = Math.round((taxableAmount * (taxRate / 200)) * 100) / 100;
    const sgst = Math.round((taxableAmount * (taxRate / 200)) * 100) / 100;
    const taxTotal = cgst + sgst;
    const totalAmount = Math.round((taxableAmount + taxTotal) * 100) / 100;

    const invoiceNum = `INV-2026-00${invoices.length + 1}`;
    const today = new Date().toISOString().split("T")[0];
    const dueDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

    const newInvoice: Invoice = {
      id: generateId("inv"),
      invoiceNumber: invoiceNum,
      customerId: sub.customerId,
      customerName: customer ? customer.company : sub.customerName || "Customer",
      subscriptionId: sub.id,
      planName: sub.planName || "Subscription Plan",
      issueDate: today,
      dueDate,
      billingPeriodStart: sub.billingPeriodStart,
      billingPeriodEnd: sub.billingPeriodEnd,
      subtotal: grossSubtotal,
      discountTotal: discountAmount,
      taxTotal,
      totalAmount,
      status: "Issued",
      lineItems: [
        {
          id: generateId("li"),
          description: `${sub.planName || "Plan"} (${sub.seats} seats)`,
          quantity: sub.seats,
          unitPrice: sub.unitPrice,
          amount: grossSubtotal,
          type: "base",
        },
        ...(discountAmount > 0
          ? [
              {
                id: generateId("li"),
                description: `Applied Discount (${sub.discountCode || `${sub.discountPercentage}% off`})`,
                quantity: 1,
                unitPrice: -discountAmount,
                amount: -discountAmount,
                type: "discount" as const,
              },
            ]
          : []),
        {
          id: generateId("li"),
          description: `Statutory GST (${taxRate}% - CGST ${taxRate / 2}% + SGST ${taxRate / 2}%)`,
          quantity: 1,
          unitPrice: taxTotal,
          amount: taxTotal,
          type: "tax",
        },
      ],
      calculationSnapshot: {
        formula: `[₹${sub.unitPrice.toLocaleString("en-IN")} × ${sub.seats}] - ₹${discountAmount.toLocaleString("en-IN")} disc = ₹${taxableAmount.toLocaleString("en-IN")} + ${taxRate}% GST (₹${taxTotal.toLocaleString("en-IN")}) = ₹${totalAmount.toLocaleString("en-IN")}`,
        basePrice: sub.unitPrice,
        seats: sub.seats,
        subtotal: grossSubtotal,
        discountCode: sub.discountCode,
        discountAmount,
        taxableAmount,
        gstRate: taxRate,
        cgst,
        sgst,
        finalAmount: totalAmount,
        timestamp: new Date().toISOString(),
        explanation: `Validated by Billing Integrity Guard. Plan base for ${sub.seats} seats with ${taxRate}% statutory tax. Zero anomalies detected.`,
      },
    };

    setInvoices((prev) => [newInvoice, ...prev]);

    // Also update customer totalInvoiced
    setCustomers((prev) =>
      prev.map((c) =>
        c.id === sub.customerId ? { ...c, totalInvoiced: c.totalInvoiced + totalAmount } : c
      )
    );

    return { success: true, invoice: newInvoice };
  };

  const updateInvoiceStatus = (id: string, status: InvoiceStatus) => {
    setInvoices((prev) => prev.map((inv) => (inv.id === id ? { ...inv, status } : inv)));
  };

  // Payments
  const recordPayment = (data: Omit<Payment, "id" | "timestamp">): Payment => {
    const newPayment: Payment = {
      ...data,
      id: generateId("pay"),
      timestamp: new Date().toISOString(),
    };
    setPayments((prev) => [newPayment, ...prev]);
    if (data.status === "Paid") {
      updateInvoiceStatus(data.invoiceId, "Paid");
    }
    return newPayment;
  };

  const updatePaymentStatus = (id: string, status: PaymentStatus) => {
    setPayments((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        if (status === "Paid") {
          updateInvoiceStatus(p.invoiceId, "Paid");
        }
        return { ...p, status };
      })
    );
  };

  // Settings
  const updateSettings = (updates: Partial<SystemSettings>) => {
    setSettings((prev) => ({ ...prev, ...updates }));
  };

  // Reset to initial mock
  const resetToMockData = () => {
    setCustomers(initialCustomers);
    setPlans(initialPlans);
    setSubscriptions(initialSubscriptions);
    setInvoices(initialInvoices);
    setPayments(initialPayments);
    setSettings(initialSettings);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <AppContext.Provider
      value={{
        customers,
        plans,
        subscriptions,
        invoices,
        payments,
        settings,
        integrityAlertsCount,
        addCustomer,
        updateCustomer,
        deleteCustomer,
        addPlan,
        updatePlan,
        addSubscription,
        updateSubscription,
        updateSubscriptionStatus,
        remediateSubscription,
        generateInvoiceFromSubscription,
        updateInvoiceStatus,
        recordPayment,
        updatePaymentStatus,
        updateSettings,
        resetToMockData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}

