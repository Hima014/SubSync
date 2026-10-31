"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/app-context";
import { Customer } from "@/types";
import { formatINR } from "@/lib/utils";
import { CustomerTable } from "@/components/customers/customer-table";
import { CustomerModal } from "@/components/customers/customer-modal";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

export default function CustomersPage() {
  const router = useRouter();
  const { customers, addCustomer, updateCustomer, deleteCustomer } = useApp();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  // Filter customers
  const filteredCustomers = customers.filter((c) => {
    const matchesSearch =
      c.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.gstin && c.gstin.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus =
      statusFilter === "ALL" ? true : c.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Aggregate stats
  const totalBilled = customers.reduce((acc, c) => acc + c.totalInvoiced, 0);
  const activeCount = customers.filter((c) => c.status === "Active").length;
  const suspendedCount = customers.filter((c) => c.status === "Suspended").length;

  const handleOpenAdd = () => {
    setEditingCustomer(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setIsModalOpen(true);
  };

  const handleFormSubmit = (data: {
    name: string;
    email: string;
    phone: string;
    company: string;
    status: Customer["status"];
    gstin?: string;
    address?: string;
  }) => {
    if (editingCustomer) {
      updateCustomer(editingCustomer.id, data);
    } else {
      addCustomer(data);
    }
  };

  const handleAssignSubscription = (customer: Customer) => {
    // Navigate to Subscriptions with pre-selected customer
    router.push(`/subscriptions?customerId=${customer.id}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-ivory-200 border border-border text-[10px] font-bold uppercase tracking-wider text-charcoal mb-1">
            <span>Client Registry</span>
            <span>•</span>
            <span className="font-mono">{customers.length} Entities</span>
          </div>
          <h2 className="text-xl lg:text-2xl font-bold tracking-tight text-charcoal">
            Customer Directory
          </h2>
          <p className="text-xs text-charcoal-soft mt-0.5">
            Manage client profiles, statutory GSTIN identifiers, and subscription allocations
          </p>
        </div>

        <Button variant="gold" size="md" onClick={handleOpenAdd} className="shadow-xs self-start sm:self-auto">
          <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add New Customer
        </Button>
      </div>

      {/* Metrics Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-white border border-border shadow-xs">
          <span className="text-[10px] font-semibold uppercase text-charcoal-soft block">
            Total Clients
          </span>
          <span className="text-xl font-bold font-mono text-charcoal block mt-0.5">
            {customers.length}
          </span>
          <span className="text-[11px] text-charcoal-soft">Active directory</span>
        </div>

        <div className="p-3.5 rounded-xl bg-white border border-border shadow-xs">
          <span className="text-[10px] font-semibold uppercase text-charcoal-soft block">
            Good Standing
          </span>
          <span className="text-xl font-bold font-mono text-integrity-passed block mt-0.5">
            {activeCount}
          </span>
          <span className="text-[11px] text-integrity-passed font-medium">Eligible for billing</span>
        </div>

        <div className="p-3.5 rounded-xl bg-white border border-border shadow-xs">
          <span className="text-[10px] font-semibold uppercase text-charcoal-soft block">
            Suspended Accounts
          </span>
          <span className="text-xl font-bold font-mono text-integrity-critical block mt-0.5">
            {suspendedCount}
          </span>
          <span className="text-[11px] text-integrity-critical font-medium">Invoicing blocked by Guard</span>
        </div>

        <div className="p-3.5 rounded-xl bg-white border border-border shadow-xs">
          <span className="text-[10px] font-semibold uppercase text-charcoal-soft block">
            Total Billed Lifetime
          </span>
          <span className="text-xl font-bold font-mono text-charcoal block mt-0.5">
            {formatINR(totalBilled, { minimumFractionDigits: 0 })}
          </span>
          <span className="text-[11px] text-charcoal-soft">Across verified invoices</span>
        </div>
      </div>

      {/* Main Ledger Card */}
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle>Customer Ledger</CardTitle>
            <CardDescription>
              Filter and search through client billing profiles
            </CardDescription>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
            <div className="w-full sm:w-64">
              <Input
                placeholder="Search company, name, email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="text-xs py-1.5"
                leftAddon={
                  <svg className="w-3.5 h-3.5 text-charcoal-soft" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                }
              />
            </div>

            <div className="w-full sm:w-44">
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                options={[
                  { value: "ALL", label: "All Statuses" },
                  { value: "Active", label: "Active Only" },
                  { value: "Inactive", label: "Inactive Only" },
                  { value: "Suspended", label: "Suspended Only" },
                ]}
                className="text-xs py-1.5"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <CustomerTable
            customers={filteredCustomers}
            onEdit={handleOpenEdit}
            onDelete={deleteCustomer}
            onAssignSubscription={handleAssignSubscription}
          />
        </CardContent>
      </Card>

      {/* Customer Modal Dialog */}
      <CustomerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleFormSubmit}
        initialData={editingCustomer}
      />
    </div>
  );
}
