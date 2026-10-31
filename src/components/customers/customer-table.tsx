"use client";

import React from "react";
import { Customer } from "@/types";
import { formatINR, formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface CustomerTableProps {
  customers: Customer[];
  onEdit: (customer: Customer) => void;
  onDelete: (id: string) => void;
  onAssignSubscription?: (customer: Customer) => void;
}

export function CustomerTable({
  customers,
  onEdit,
  onDelete,
  onAssignSubscription,
}: CustomerTableProps) {
  const getStatusBadge = (status: Customer["status"]) => {
    switch (status) {
      case "Active":
        return <Badge variant="active" dot>Active</Badge>;
      case "Inactive":
        return <Badge variant="neutral" dot>Inactive</Badge>;
      case "Suspended":
        return <Badge variant="critical" dot>Suspended</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  if (customers.length === 0) {
    return (
      <div className="py-16 text-center text-charcoal-soft">
        <p className="text-sm font-medium">No customers found</p>
        <p className="text-xs mt-1">Try adjusting your search criteria or add a new customer.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse text-xs">
        <thead>
          <tr className="border-b border-border bg-surface-muted/50 text-[11px] font-semibold uppercase tracking-wider text-charcoal-soft">
            <th className="py-3 px-4">Company & Contact</th>
            <th className="py-3 px-4">Contact Info</th>
            <th className="py-3 px-4">Tax / GSTIN</th>
            <th className="py-3 px-4">Status</th>
            <th className="py-3 px-4 text-center">Subscriptions</th>
            <th className="py-3 px-4 text-right">Lifetime Invoiced</th>
            <th className="py-3 px-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/60">
          {customers.map((customer) => (
            <tr key={customer.id} className="hover:bg-ivory-100/50 transition-colors">
              <td className="py-3.5 px-4">
                <span className="font-semibold text-charcoal block">{customer.company}</span>
                <span className="text-[11px] text-charcoal-soft">{customer.name}</span>
              </td>
              <td className="py-3.5 px-4">
                <span className="text-charcoal block font-mono text-[11px]">{customer.email}</span>
                <span className="text-charcoal-soft text-[11px]">{customer.phone}</span>
              </td>
              <td className="py-3.5 px-4 font-mono text-[11px]">
                {customer.gstin ? (
                  <span className="px-1.5 py-0.5 rounded bg-surface-muted border border-border text-charcoal">
                    {customer.gstin}
                  </span>
                ) : (
                  <span className="text-charcoal-light italic">Unregistered</span>
                )}
              </td>
              <td className="py-3.5 px-4">
                {getStatusBadge(customer.status)}
              </td>
              <td className="py-3.5 px-4 text-center">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-ivory-200 text-charcoal font-bold font-mono text-[11px]">
                  {customer.activeSubscriptionsCount}
                </span>
              </td>
              <td className="py-3.5 px-4 text-right font-mono font-semibold text-charcoal">
                {formatINR(customer.totalInvoiced)}
              </td>
              <td className="py-3.5 px-4 text-right">
                <div className="flex items-center justify-end gap-1.5">
                  {onAssignSubscription && (
                    <Button
                      variant="gold"
                      size="sm"
                      onClick={() => onAssignSubscription(customer)}
                      className="text-[11px] py-1 px-2"
                      title="Assign Subscription Plan"
                    >
                      + Plan
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(customer)}
                    className="text-[11px] py-1 px-2"
                  >
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (confirm(`Are you sure you want to delete ${customer.company}?`)) {
                        onDelete(customer.id);
                      }
                    }}
                    className="text-[11px] py-1 px-2 text-integrity-critical hover:bg-integrity-critical-bg"
                  >
                    Delete
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

