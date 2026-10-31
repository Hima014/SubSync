"use client";

import React, { useState } from "react";
import { Invoice } from "@/types";
import { formatINR, formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import Link from "next/link";

interface InvoiceTableProps {
  invoices: Invoice[];
  onStatusChange: (id: string, status: Invoice["status"]) => void;
}

export function InvoiceTable({ invoices, onStatusChange }: InvoiceTableProps) {
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  const getStatusBadge = (status: Invoice["status"]) => {
    switch (status) {
      case "Paid": return <Badge variant="passed" dot>Paid</Badge>;
      case "Issued": return <Badge variant="warning" dot>Issued</Badge>;
      case "Draft": return <Badge variant="neutral" dot>Draft</Badge>;
      case "Overdue": return <Badge variant="critical" dot>Overdue</Badge>;
      default: return <Badge variant="neutral">{status}</Badge>;
    }
  };

  if (invoices.length === 0) {
    return (
      <div className="py-16 text-center text-charcoal-soft text-sm">
        No invoices found. Generate your first invoice through the Billing Guard.
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-border bg-surface-muted/50 text-[11px] font-semibold uppercase tracking-wider text-charcoal-soft">
              <th className="py-3 px-4">Invoice #</th>
              <th className="py-3 px-4">Customer & Plan</th>
              <th className="py-3 px-4">Billing Period</th>
              <th className="py-3 px-4 text-right">Subtotal</th>
              <th className="py-3 px-4 text-right">GST</th>
              <th className="py-3 px-4 text-right">Total</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Due Date</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {invoices.map((inv) => (
              <tr key={inv.id} className="hover:bg-ivory-100/50 transition-colors">
                <td className="py-3.5 px-4 font-mono font-bold text-charcoal">
                  {inv.invoiceNumber}
                </td>
                <td className="py-3.5 px-4">
                  <span className="font-semibold text-charcoal block">{inv.customerName}</span>
                  <span className="text-[11px] text-charcoal-soft">{inv.planName}</span>
                </td>
                <td className="py-3.5 px-4 text-charcoal-muted text-[11px]">
                  {formatDate(inv.billingPeriodStart)} –<br />{formatDate(inv.billingPeriodEnd)}
                </td>
                <td className="py-3.5 px-4 text-right font-mono text-charcoal">
                  {formatINR(inv.subtotal - inv.discountTotal)}
                </td>
                <td className="py-3.5 px-4 text-right font-mono text-charcoal-muted">
                  {formatINR(inv.taxTotal)}
                </td>
                <td className="py-3.5 px-4 text-right font-mono font-bold text-charcoal">
                  {formatINR(inv.totalAmount)}
                </td>
                <td className="py-3.5 px-4">{getStatusBadge(inv.status)}</td>
                <td className="py-3.5 px-4 text-[11px] text-charcoal-muted">
                  {formatDate(inv.dueDate)}
                </td>
                <td className="py-3.5 px-4 text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      onClick={() => setSelectedInvoice(inv)}
                      className="text-[11px] font-semibold text-charcoal hover:text-gold-700 underline"
                    >
                      View
                    </button>
                    <Link href={`/invoice-passport?invoiceId=${inv.id}`}>
                      <Button variant="gold" size="sm" className="text-[11px] py-1 px-2">
                        Passport
                      </Button>
                    </Link>
                    {inv.status !== "Paid" && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-[11px] py-1 px-2"
                        onClick={() => onStatusChange(inv.id, "Paid")}
                      >
                        Mark Paid
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Invoice Detail Modal */}
      {selectedInvoice && (
        <Modal
          isOpen={!!selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
          title={selectedInvoice.invoiceNumber}
          description={`Issued to ${selectedInvoice.customerName} • ${selectedInvoice.planName}`}
          maxWidth="lg"
          footer={
            <div className="flex items-center justify-between w-full">
              <Link href={`/invoice-passport?invoiceId=${selectedInvoice.id}`}>
                <Button variant="gold" size="sm">Open Invoice Passport →</Button>
              </Link>
              <Button variant="outline" size="sm" onClick={() => setSelectedInvoice(null)}>Close</Button>
            </div>
          }
        >
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-3 gap-3 p-3 rounded-lg bg-surface-muted border border-border">
              <div>
                <span className="text-[10px] font-bold uppercase text-charcoal-soft block">Issue Date</span>
                <span className="font-medium">{formatDate(selectedInvoice.issueDate)}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-charcoal-soft block">Due Date</span>
                <span className="font-medium">{formatDate(selectedInvoice.dueDate)}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase text-charcoal-soft block">Status</span>
                {getStatusBadge(selectedInvoice.status)}
              </div>
            </div>

            <div>
              <h5 className="text-[10px] font-bold uppercase text-charcoal-soft mb-2">Billing Period</h5>
              <p className="font-medium">{formatDate(selectedInvoice.billingPeriodStart)} — {formatDate(selectedInvoice.billingPeriodEnd)}</p>
            </div>

            <div className="border border-border rounded-lg overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-surface-muted text-[10px] font-bold uppercase text-charcoal-soft">
                    <th className="py-2 px-3 text-left">Description</th>
                    <th className="py-2 px-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {selectedInvoice.lineItems.map((item) => (
                    <tr key={item.id} className="hover:bg-surface-muted/40">
                      <td className="py-2.5 px-3 text-charcoal">{item.description}</td>
                      <td className={`py-2.5 px-3 text-right font-mono font-semibold ${item.amount < 0 ? "text-integrity-passed" : "text-charcoal"}`}>
                        {formatINR(item.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-charcoal text-white">
                    <td className="py-3 px-3 font-bold">Net Amount Payable</td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-gold-400 text-base">
                      {formatINR(selectedInvoice.totalAmount)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="p-3 rounded-lg bg-gold-50/60 border border-gold-200 text-[10px]">
              <span className="font-bold uppercase text-gold-900 block mb-0.5">Calculation Formula (Frozen Snapshot)</span>
              <code className="font-mono text-charcoal break-all">{selectedInvoice.calculationSnapshot.formula}</code>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}

