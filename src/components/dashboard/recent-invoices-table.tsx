"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Invoice } from "@/types";
import { formatINR, formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";

interface RecentInvoicesTableProps {
  invoices: Invoice[];
}

export function RecentInvoicesTable({ invoices }: RecentInvoicesTableProps) {
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  const getStatusBadge = (status: Invoice["status"]) => {
    switch (status) {
      case "Paid":
        return <Badge variant="passed" dot>Paid</Badge>;
      case "Issued":
        return <Badge variant="warning" dot>Issued</Badge>;
      case "Draft":
        return <Badge variant="neutral" dot>Draft</Badge>;
      case "Overdue":
        return <Badge variant="critical" dot>Overdue</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse text-xs">
        <thead>
          <tr className="border-b border-border bg-surface-muted/50 text-[11px] font-semibold uppercase tracking-wider text-charcoal-soft">
            <th className="py-3 px-4">Invoice #</th>
            <th className="py-3 px-4">Client</th>
            <th className="py-3 px-4">Cycle</th>
            <th className="py-3 px-4 text-right">Amount</th>
            <th className="py-3 px-4">Status</th>
            <th className="py-3 px-4 text-right">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/60">
          {invoices.slice(0, 5).map((inv) => (
            <tr key={inv.id} className="hover:bg-ivory-100/60 transition-colors">
              <td className="py-3 px-4 font-mono font-bold text-charcoal">
                {inv.invoiceNumber}
              </td>
              <td className="py-3 px-4">
                <span className="font-medium text-charcoal">{inv.customerName}</span>
                <span className="block text-[10px] text-charcoal-soft">{inv.planName}</span>
              </td>
              <td className="py-3 px-4 text-charcoal-muted">
                {formatDate(inv.billingPeriodStart)} - {formatDate(inv.billingPeriodEnd)}
              </td>
              <td className="py-3 px-4 text-right font-mono font-semibold text-charcoal">
                {formatINR(inv.totalAmount)}
              </td>
              <td className="py-3 px-4">
                {getStatusBadge(inv.status)}
              </td>
              <td className="py-3 px-4 text-right">
                <button
                  onClick={() => setSelectedInvoice(inv)}
                  className="font-medium text-charcoal hover:text-gold-700 underline text-[11px]"
                >
                  Inspect
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Invoice Quick-Inspect Modal */}
      {selectedInvoice && (
        <Modal
          isOpen={!!selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
          title={`Invoice ${selectedInvoice.invoiceNumber}`}
          description={`Issued to ${selectedInvoice.customerName} for ${selectedInvoice.planName}`}
          maxWidth="lg"
          footer={
            <div className="flex items-center justify-between w-full">
              <Link href="/invoice-passport">
                <Button variant="secondary" size="sm">
                  View in Invoice Passport →
                </Button>
              </Link>
              <Button variant="primary" size="sm" onClick={() => setSelectedInvoice(null)}>
                Done
              </Button>
            </div>
          }
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-surface-muted border border-border text-xs">
              <div>
                <span className="text-charcoal-soft block text-[10px] uppercase">Billing Period</span>
                <span className="font-medium text-charcoal">
                  {formatDate(selectedInvoice.billingPeriodStart)} - {formatDate(selectedInvoice.billingPeriodEnd)}
                </span>
              </div>
              <div>
                <span className="text-charcoal-soft block text-[10px] uppercase">Payment Due</span>
                <span className="font-medium text-charcoal">{formatDate(selectedInvoice.dueDate)}</span>
              </div>
            </div>

            {/* Line items */}
            <div>
              <h5 className="text-xs font-semibold uppercase text-charcoal-soft mb-2">Itemized Breakdown</h5>
              <div className="space-y-1.5 border border-border rounded-lg p-3 bg-white text-xs">
                {selectedInvoice.lineItems.map((item) => (
                  <div key={item.id} className="flex justify-between items-center py-1 border-b border-border/40 last:border-0">
                    <div>
                      <span className="font-medium text-charcoal">{item.description}</span>
                      {item.quantity > 1 && (
                        <span className="text-[10px] text-charcoal-soft ml-1.5 font-mono">
                          (Qty: {item.quantity})
                        </span>
                      )}
                    </div>
                    <span className="font-mono font-semibold text-charcoal">
                      {formatINR(item.amount)}
                    </span>
                  </div>
                ))}

                <div className="pt-2 flex justify-between items-center font-bold text-sm border-t border-border">
                  <span>Total Amount</span>
                  <span className="font-mono text-charcoal">
                    {formatINR(selectedInvoice.totalAmount)}
                  </span>
                </div>
              </div>
            </div>

            {/* Formula Snapshot */}
            <div className="p-3 rounded-lg bg-gold-50/50 border border-gold-200 text-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gold-900 block mb-1">
                Frozen Calculation Snapshot
              </span>
              <p className="font-mono text-xs text-charcoal-muted leading-relaxed">
                {selectedInvoice.calculationSnapshot.formula}
              </p>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

