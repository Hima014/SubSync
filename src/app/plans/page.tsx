"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/app-context";
import { Plan, BillingInterval } from "@/types";
import { formatINR } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

export default function PlansPage() {
  const router = useRouter();
  const { plans, addPlan } = useApp();

  const [intervalFilter, setIntervalFilter] = useState<"all" | "monthly" | "yearly">("all");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New Plan Form State
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [billingInterval, setBillingInterval] = useState<BillingInterval>("monthly");
  const [basePrice, setBasePrice] = useState("");
  const [includedSeats, setIncludedSeats] = useState("5");
  const [perAdditionalSeatPrice, setPerAdditionalSeatPrice] = useState("199");
  const [maxSeats, setMaxSeats] = useState("25");
  const [feature1, setFeature1] = useState("");
  const [feature2, setFeature2] = useState("");
  const [feature3, setFeature3] = useState("");

  const filteredPlans = plans.filter((p) => {
    if (intervalFilter === "all") return true;
    return p.billingInterval === intervalFilter;
  });

  const handleCreatePlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !basePrice) return;

    const features = [feature1, feature2, feature3].filter((f) => f.trim().length > 0);

    addPlan({
      name: name.trim(),
      description: description.trim() || "Custom subscription tier",
      billingInterval,
      basePrice: parseFloat(basePrice) || 999,
      includedSeats: parseInt(includedSeats) || 1,
      perAdditionalSeatPrice: parseFloat(perAdditionalSeatPrice) || 0,
      maxSeats: parseInt(maxSeats) || 50,
      features: features.length > 0 ? features : ["Standard billing engine features", "Priority support"],
      annualDiscountPercentage: billingInterval === "yearly" ? 20 : 0,
    });

    setIsModalOpen(false);
    setName("");
    setDescription("");
    setBasePrice("");
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-ivory-200 border border-border text-[10px] font-bold uppercase tracking-wider text-charcoal mb-1">
            <span>Pricing Architecture</span>
            <span>•</span>
            <span className="font-mono">{plans.length} Tiers Configured</span>
          </div>
          <h2 className="text-xl lg:text-2xl font-bold tracking-tight text-charcoal">
            Subscription Plan Catalog
          </h2>
          <p className="text-xs text-charcoal-soft mt-0.5">
            Configure monthly & annual billing intervals, seat quotas, and statutory tax parameters
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="gold" size="md" onClick={() => setIsModalOpen(true)} className="shadow-xs">
            <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create New Plan
          </Button>
        </div>
      </div>

      {/* Interval Selector Toggle */}
      <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-border shadow-xs">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-charcoal">Billing Cycle:</span>
          <div className="flex items-center gap-1 bg-ivory-200 p-1 rounded-lg border border-border">
            <button
              onClick={() => setIntervalFilter("all")}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                intervalFilter === "all"
                  ? "bg-white text-charcoal shadow-xs font-semibold"
                  : "text-charcoal-soft hover:text-charcoal"
              }`}
            >
              All Tiers ({plans.length})
            </button>
            <button
              onClick={() => setIntervalFilter("monthly")}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                intervalFilter === "monthly"
                  ? "bg-white text-charcoal shadow-xs font-semibold"
                  : "text-charcoal-soft hover:text-charcoal"
              }`}
            >
              Monthly Plans
            </button>
            <button
              onClick={() => setIntervalFilter("yearly")}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                intervalFilter === "yearly"
                  ? "bg-white text-charcoal shadow-xs font-semibold"
                  : "text-charcoal-soft hover:text-charcoal"
              }`}
            >
              Annual Plans (Save 20%)
            </button>
          </div>
        </div>

        <span className="text-[11px] text-charcoal-soft hidden md:inline">
          Tax Jurisdiction: <span className="font-semibold text-charcoal">GST 18% Compliant</span>
        </span>
      </div>

      {/* Plan Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {filteredPlans.map((plan) => {
          const isPro = plan.id === "plan-pro";

          return (
            <Card
              key={plan.id}
              hover
              className={`flex flex-col justify-between relative ${
                isPro ? "border-gold/60 ring-2 ring-gold/20 shadow-md bg-gradient-to-b from-white to-gold-50/20" : ""
              }`}
            >
              {isPro && (
                <div className="absolute top-0 right-0 transform translate-x-0 -translate-y-0">
                  <span className="bg-gold text-charcoal text-[9px] font-bold uppercase tracking-wider px-3 py-1 rounded-bl-lg shadow-xs">
                    Most Popular
                  </span>
                </div>
              )}

              <div>
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{plan.name}</CardTitle>
                    <Badge variant={plan.billingInterval === "yearly" ? "gold" : "neutral"} size="sm">
                      {plan.billingInterval === "yearly" ? "Yearly" : "Monthly"}
                    </Badge>
                  </div>
                  <CardDescription className="line-clamp-2 min-h-[32px]">
                    {plan.description}
                  </CardDescription>

                  {/* Price */}
                  <div className="pt-4 pb-2 border-b border-border/60">
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-bold font-mono text-charcoal">
                        {formatINR(plan.basePrice, { minimumFractionDigits: 0 })}
                      </span>
                      <span className="text-xs text-charcoal-soft">
                        /{plan.billingInterval === "yearly" ? "yr" : "mo"}
                      </span>
                    </div>
                    <span className="text-[11px] text-charcoal-soft block mt-0.5">
                      Includes {plan.includedSeats} team seats
                    </span>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4 pt-2">
                  {/* Capacity Specs */}
                  <div className="p-2.5 rounded-lg bg-surface-muted border border-border/80 text-[11px] space-y-1">
                    <div className="flex justify-between">
                      <span className="text-charcoal-soft">Seat Capacity:</span>
                      <span className="font-semibold text-charcoal font-mono">Up to {plan.maxSeats}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-charcoal-soft">Add-on Seat Rate:</span>
                      <span className="font-semibold text-charcoal font-mono">{formatINR(plan.perAdditionalSeatPrice, { minimumFractionDigits: 0 })}/seat</span>
                    </div>
                  </div>

                  {/* Feature List */}
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-charcoal-soft block mb-2">
                      Features Included:
                    </span>
                    <ul className="space-y-1.5 text-xs text-charcoal">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <svg className="w-4 h-4 text-integrity-passed shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                          </svg>
                          <span className="text-[11px] text-charcoal-muted leading-tight">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </div>

              <CardFooter className="pt-4">
                <Button
                  variant={isPro ? "gold" : "outline"}
                  size="sm"
                  className="w-full"
                  onClick={() => router.push(`/subscriptions?planId=${plan.id}`)}
                >
                  Assign to Customer →
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      {/* Create Plan Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Create New Subscription Plan"
        description="Add a new subscription tier with seat allotments and pricing schedules"
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="gold" size="sm" onClick={handleCreatePlan}>
              Publish Plan
            </Button>
          </div>
        }
      >
        <form onSubmit={handleCreatePlan} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Plan Name"
              placeholder="e.g. Developer Pro"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <Select
              label="Billing Interval"
              value={billingInterval}
              onChange={(e) => setBillingInterval(e.target.value as BillingInterval)}
              options={[
                { value: "monthly", label: "Monthly Recurring" },
                { value: "yearly", label: "Yearly Recurring (Annual)" },
              ]}
            />
          </div>

          <Input
            label="Description"
            placeholder="Brief tier summary"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              label="Base Price (₹)"
              type="number"
              placeholder="2499"
              value={basePrice}
              onChange={(e) => setBasePrice(e.target.value)}
              required
            />
            <Input
              label="Included Seats"
              type="number"
              placeholder="5"
              value={includedSeats}
              onChange={(e) => setIncludedSeats(e.target.value)}
            />
            <Input
              label="Max Seats Allowed"
              type="number"
              placeholder="25"
              value={maxSeats}
              onChange={(e) => setMaxSeats(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal-muted">
              Key Features (Up to 3)
            </label>
            <Input
              placeholder="Feature 1: e.g. Real-time billing audit"
              value={feature1}
              onChange={(e) => setFeature1(e.target.value)}
            />
            <Input
              placeholder="Feature 2: e.g. Dedicated invoice portal"
              value={feature2}
              onChange={(e) => setFeature2(e.target.value)}
            />
            <Input
              placeholder="Feature 3: e.g. 24/7 SLA"
              value={feature3}
              onChange={(e) => setFeature3(e.target.value)}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}
