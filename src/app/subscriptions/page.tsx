"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useApp } from "@/context/app-context";
import { Subscription, SubscriptionStatus, IntegritySeverity } from "@/types";
import { formatINR } from "@/lib/utils";
import { SubscriptionTable } from "@/components/subscriptions/subscription-table";
import { SubscriptionModal } from "@/components/subscriptions/subscription-modal";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

function SubscriptionsContent() {
  const searchParams = useSearchParams();
  const queryCustomerId = searchParams.get("customerId");
  const queryPlanId = searchParams.get("planId");

  const {
    subscriptions,
    customers,
    plans,
    addSubscription,
    updateSubscription,
    updateSubscriptionStatus,
    integrityAlertsCount,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [integrityFilter, setIntegrityFilter] = useState<string>("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSub, setEditingSub] = useState<Subscription | null>(null);

  // If query params are provided, auto-open create modal
  useEffect(() => {
    if (queryCustomerId || queryPlanId) {
      setEditingSub(null);
      setIsModalOpen(true);
    }
  }, [queryCustomerId, queryPlanId]);

  // Filter subscriptions
  const filteredSubscriptions = subscriptions.filter((sub) => {
    const matchesSearch =
      sub.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (sub.customerName && sub.customerName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (sub.planName && sub.planName.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === "ALL" ? true : sub.status === statusFilter;
    const matchesIntegrity = integrityFilter === "ALL" ? true : sub.integrityStatus === integrityFilter;

    return matchesSearch && matchesStatus && matchesIntegrity;
  });

  const activeSubs = subscriptions.filter((s) => s.status === "Active");
  const currentMRR = activeSubs.reduce((acc, s) => acc + s.unitPrice * s.seats, 0);

  const handleOpenAdd = () => {
    setEditingSub(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (sub: Subscription) => {
    setEditingSub(sub);
    setIsModalOpen(true);
  };

  const handleFormSubmit = (data: {
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
  }) => {
    if (editingSub) {
      updateSubscription(editingSub.id, data);
    } else {
      addSubscription(data);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-ivory-200 border border-border text-[10px] font-bold uppercase tracking-wider text-charcoal mb-1">
            <span>Recurring Engine</span>
            <span>•</span>
            <span className="font-mono">{subscriptions.length} Subscriptions</span>
          </div>
          <h2 className="text-xl lg:text-2xl font-bold tracking-tight text-charcoal">
            Active Subscriptions
          </h2>
          <p className="text-xs text-charcoal-soft mt-0.5">
            Manage billing terms, seats, and automated pre-invoice integrity states
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link href="/billing-guard">
            <Button variant="outline" size="md">
              <svg className="w-4 h-4 mr-1.5 text-integrity-critical" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              Audit Integrity ({integrityAlertsCount.critical} Blocked)
            </Button>
          </Link>

          <Button variant="gold" size="md" onClick={handleOpenAdd} className="shadow-xs">
            <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Subscription
          </Button>
        </div>
      </div>

      {/* Metrics Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-white border border-border shadow-xs">
          <span className="text-[10px] font-semibold uppercase text-charcoal-soft block">
            Active Contracts
          </span>
          <span className="text-xl font-bold font-mono text-charcoal block mt-0.5">
            {activeSubs.length} / {subscriptions.length}
          </span>
          <span className="text-[11px] text-charcoal-soft">Generating revenue</span>
        </div>

        <div className="p-3.5 rounded-xl bg-white border border-border shadow-xs">
          <span className="text-[10px] font-semibold uppercase text-charcoal-soft block">
            Contracted MRR
          </span>
          <span className="text-xl font-bold font-mono text-charcoal block mt-0.5">
            {formatINR(currentMRR, { minimumFractionDigits: 0 })}
          </span>
          <span className="text-[11px] text-charcoal-soft">Active recurring volume</span>
        </div>

        <div className="p-3.5 rounded-xl bg-white border border-integrity-critical-border bg-integrity-critical-bg/20 shadow-xs">
          <span className="text-[10px] font-semibold uppercase text-integrity-critical block">
            Integrity Blocked
          </span>
          <span className="text-xl font-bold font-mono text-integrity-critical block mt-0.5">
            {integrityAlertsCount.critical}
          </span>
          <span className="text-[11px] text-integrity-critical font-medium">Critical validation errors</span>
        </div>

        <div className="p-3.5 rounded-xl bg-white border border-integrity-passed-border bg-integrity-passed-bg/20 shadow-xs">
          <span className="text-[10px] font-semibold uppercase text-integrity-passed block">
            Audit Clean
          </span>
          <span className="text-xl font-bold font-mono text-integrity-passed block mt-0.5">
            {integrityAlertsCount.passed}
          </span>
          <span className="text-[11px] text-integrity-passed font-medium">Ready for invoice generation</span>
        </div>
      </div>

      {/* Subscriptions Ledger */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle>Subscriptions Ledger</CardTitle>
            <CardDescription>
              Real-time monitoring of customer subscriptions and pre-invoice gates
            </CardDescription>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="w-full sm:w-56">
              <Input
                placeholder="Search by ID, client, plan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="text-xs py-1.5"
              />
            </div>

            <div className="w-full sm:w-36">
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                options={[
                  { value: "ALL", label: "All Statuses" },
                  { value: "Active", label: "Active" },
                  { value: "Paused", label: "Paused" },
                  { value: "Canceled", label: "Canceled" },
                ]}
                className="text-xs py-1.5"
              />
            </div>

            <div className="w-full sm:w-40">
              <Select
                value={integrityFilter}
                onChange={(e) => setIntegrityFilter(e.target.value)}
                options={[
                  { value: "ALL", label: "All Integrity Gates" },
                  { value: "Critical", label: "Critical Only" },
                  { value: "Warning", label: "Warning Only" },
                  { value: "Passed", label: "Passed Only" },
                ]}
                className="text-xs py-1.5"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <SubscriptionTable
            subscriptions={filteredSubscriptions}
            onEdit={handleOpenEdit}
            onStatusChange={updateSubscriptionStatus}
          />
        </CardContent>
      </Card>

      {/* Modal Dialog */}
      <SubscriptionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleFormSubmit}
        customers={customers}
        plans={plans}
        initialData={editingSub}
        defaultCustomerId={queryCustomerId || undefined}
        defaultPlanId={queryPlanId || undefined}
      />
    </div>
  );
}

export default function SubscriptionsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-charcoal-soft">Loading subscriptions...</div>}>
      <SubscriptionsContent />
    </Suspense>
  );
}
