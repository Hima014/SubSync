"use client";

import React, { useState, useEffect } from "react";
import { Customer, Plan, Subscription, SubscriptionStatus } from "@/types";
import { formatINR } from "@/lib/utils";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    customerId: string;
    customerName: string;
    planId: string;
    planName: string;
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
  }) => void;
  customers: Customer[];
  plans: Plan[];
  initialData?: Subscription | null;
  defaultCustomerId?: string;
  defaultPlanId?: string;
}

export function SubscriptionModal({
  isOpen,
  onClose,
  onSubmit,
  customers,
  plans,
  initialData,
  defaultCustomerId,
  defaultPlanId,
}: SubscriptionModalProps) {
  const [customerId, setCustomerId] = useState("");
  const [planId, setPlanId] = useState("");
  const [seats, setSeats] = useState(1);
  const [unitPrice, setUnitPrice] = useState(0);
  const [status, setStatus] = useState<SubscriptionStatus>("Active");
  const [discountCode, setDiscountCode] = useState("");
  const [discountPercentage, setDiscountPercentage] = useState(0);
  const [discountExpiresAt, setDiscountExpiresAt] = useState("");
  const [billingPeriodStart, setBillingPeriodStart] = useState("");
  const [billingPeriodEnd, setBillingPeriodEnd] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialData) {
      setCustomerId(initialData.customerId);
      setPlanId(initialData.planId);
      setSeats(initialData.seats);
      setUnitPrice(initialData.unitPrice);
      setStatus(initialData.status);
      setDiscountCode(initialData.discountCode || "");
      setDiscountPercentage(initialData.discountPercentage || 0);
      setDiscountExpiresAt(initialData.discountExpiresAt || "");
      setBillingPeriodStart(initialData.billingPeriodStart);
      setBillingPeriodEnd(initialData.billingPeriodEnd);
    } else {
      setCustomerId(defaultCustomerId || (customers[0]?.id || ""));
      const initialPlan = plans.find((p) => p.id === defaultPlanId) || plans[0];
      setPlanId(initialPlan?.id || "");
      setSeats(initialPlan?.includedSeats || 5);
      setUnitPrice(initialPlan?.basePrice || 2499);
      setStatus("Active");
      setDiscountCode("");
      setDiscountPercentage(0);
      setDiscountExpiresAt("");
      
      const now = new Date();
      const start = now.toISOString().split("T")[0];
      const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
      const end = nextMonth.toISOString().split("T")[0];
      setBillingPeriodStart(start);
      setBillingPeriodEnd(end);
    }
    setErrors({});
  }, [initialData, defaultCustomerId, defaultPlanId, customers, plans, isOpen]);

  // When plan changes, sync default price & seats
  const handlePlanChange = (selectedPlanId: string) => {
    setPlanId(selectedPlanId);
    const selected = plans.find((p) => p.id === selectedPlanId);
    if (selected) {
      setUnitPrice(selected.basePrice);
      setSeats(selected.includedSeats);
    }
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!customerId) errs.customerId = "Customer is required";
    if (!planId) errs.planId = "Plan is required";
    if (seats <= 0) errs.seats = "Seats must be at least 1";
    if (!billingPeriodStart) errs.billingPeriodStart = "Start date is required";
    if (!billingPeriodEnd) errs.billingPeriodEnd = "End date is required";
    if (billingPeriodStart && billingPeriodEnd && billingPeriodEnd <= billingPeriodStart) {
      errs.billingPeriodEnd = "End date must be after start date";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const selectedCust = customers.find((c) => c.id === customerId);
    const selectedPlan = plans.find((p) => p.id === planId);

    onSubmit({
      customerId,
      customerName: selectedCust ? selectedCust.company : "Customer",
      planId,
      planName: selectedPlan ? selectedPlan.name : "Plan",
      status,
      seats: Number(seats),
      unitPrice: Number(unitPrice),
      discountCode: discountCode.trim() || undefined,
      discountPercentage: Number(discountPercentage) || 0,
      discountExpiresAt: discountExpiresAt || undefined,
      billingPeriodStart,
      billingPeriodEnd,
      renewalDate: billingPeriodEnd,
      taxRatePercentage: 18,
    });
    onClose();
  };

  // Live mathematical estimation in modal
  const grossSubtotal = unitPrice * seats;
  const discountVal = (grossSubtotal * (discountPercentage / 100));
  const taxableVal = Math.max(0, grossSubtotal - discountVal);
  const gstVal = taxableVal * 0.18;
  const estimatedTotal = taxableVal + gstVal;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? "Edit Subscription Terms" : "Assign Plan to Customer"}
      description="Configure seat capacity, promotional discount vouchers, and cycle terms."
      maxWidth="xl"
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="text-xs">
            <span className="text-charcoal-soft">Est. Total (incl. GST): </span>
            <span className="font-mono font-bold text-charcoal">{formatINR(estimatedTotal)}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onClose} type="button">
              Cancel
            </Button>
            <Button variant="gold" size="sm" onClick={handleSubmit} type="submit">
              {initialData ? "Update Subscription" : "Activate Subscription"}
            </Button>
          </div>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Target Customer"
            value={customerId}
            onChange={(e) => setCustomerId(e.target.value)}
            options={customers.map((c) => ({
              value: c.id,
              label: `${c.company} (${c.name})`,
            }))}
            error={errors.customerId}
            required
          />
          <Select
            label="Subscription Plan"
            value={planId}
            onChange={(e) => handlePlanChange(e.target.value)}
            options={plans.map((p) => ({
              value: p.id,
              label: `${p.name} — ${formatINR(p.basePrice, { minimumFractionDigits: 0 })}/${p.billingInterval === "yearly" ? "yr" : "mo"}`,
            }))}
            error={errors.planId}
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input
            label="Provisioned Seats"
            type="number"
            min="1"
            value={seats}
            onChange={(e) => setSeats(parseInt(e.target.value) || 1)}
            error={errors.seats}
            required
          />
          <Input
            label="Unit Rate (₹)"
            type="number"
            value={unitPrice}
            onChange={(e) => setUnitPrice(parseFloat(e.target.value) || 0)}
            helperText="Default synced from catalog"
            required
          />
          <Select
            label="Lifecycle Status"
            value={status}
            onChange={(e) => setStatus(e.target.value as SubscriptionStatus)}
            options={[
              { value: "Active", label: "Active" },
              { value: "Paused", label: "Paused" },
              { value: "Canceled", label: "Canceled" },
              { value: "Pending Review", label: "Pending Review" },
            ]}
          />
        </div>

        {/* Promotional Voucher Fields */}
        <div className="p-3.5 rounded-xl bg-ivory-200/50 border border-border space-y-3">
          <span className="text-[10px] font-bold uppercase tracking-wider text-charcoal block">
            Promotional Voucher / Discount Schedule
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              label="Coupon Code (Optional)"
              placeholder="e.g. WELCOME10"
              value={discountCode}
              onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
            />
            <Input
              label="Discount %"
              type="number"
              min="0"
              max="100"
              value={discountPercentage}
              onChange={(e) => setDiscountPercentage(parseFloat(e.target.value) || 0)}
            />
            <Input
              label="Voucher Expiration Date"
              type="date"
              value={discountExpiresAt}
              onChange={(e) => setDiscountExpiresAt(e.target.value)}
              helperText="Tested by Guard for expired coupon rule"
            />
          </div>
        </div>

        {/* Dates */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Billing Period Start"
            type="date"
            value={billingPeriodStart}
            onChange={(e) => setBillingPeriodStart(e.target.value)}
            error={errors.billingPeriodStart}
            required
          />
          <Input
            label="Billing Period End / Renewal"
            type="date"
            value={billingPeriodEnd}
            onChange={(e) => setBillingPeriodEnd(e.target.value)}
            error={errors.billingPeriodEnd}
            required
          />
        </div>
      </form>
    </Modal>
  );
}

