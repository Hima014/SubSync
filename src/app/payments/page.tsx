'use client';

import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  ShieldCheck,
  CreditCard,
  Building2,
  ExternalLink,
} from 'lucide-react';
import { getPayments, getInvoices, getCustomers, recordPayment } from '@/lib/repository';
import { formatMinorUnits } from '@/lib/billing-engine';
import { Payment, Invoice, Customer, PaymentMethod } from '@/types';
import { Badge } from '@/components/Badge';
import { Modal } from '@/components/Modal';
import { useToast } from '@/components/ToastProvider';

export default function PaymentsPage() {
  const { addToast } = useToast();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState('');
  const [amountMajor, setAmountMajor] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
  const [refNumber, setRefNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    try {
      const [pays, invs, custs] = await Promise.all([
        getPayments(),
        getInvoices(),
        getCustomers(),
      ]);
      setPayments(pays);
      setInvoices(invs);
      setCustomers(custs);

      // Default to first invoice with balance due
      const unpaid = invs.find((i) => i.balanceDueMinorUnits > 0);
      if (unpaid) {
        setSelectedInvoiceId(unpaid.id);
        setAmountMajor((unpaid.balanceDueMinorUnits / 100).toFixed(2));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openRecordModal = () => {
    const unpaid = invoices.find((i) => i.balanceDueMinorUnits > 0) || invoices[0];
    if (unpaid) {
      setSelectedInvoiceId(unpaid.id);
      setAmountMajor((unpaid.balanceDueMinorUnits / 100).toFixed(2));
    }
    setRefNumber(`TXN-SIM-${Date.now().toString().slice(-6)}`);
    setNotes('');
    setIsModalOpen(true);
  };

  const handleInvoiceChange = (id: string) => {
    setSelectedInvoiceId(id);
    const target = invoices.find((i) => i.id === id);
    if (target) {
      setAmountMajor((target.balanceDueMinorUnits / 100).toFixed(2));
    }
  };

  const handleRecordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoiceId) return;

    const targetInv = invoices.find((i) => i.id === selectedInvoiceId);
    if (!targetInv) return;

    const amountMinor = Math.round(parseFloat(amountMajor || '0') * 100);

    // Overpayment check
    if (amountMinor > targetInv.balanceDueMinorUnits) {
      addToast({
        type: 'error',
        title: 'Overpayment Blocked',
        message: `Entered amount ($${(amountMinor / 100).toFixed(2)}) exceeds balance due of $${(targetInv.balanceDueMinorUnits / 100).toFixed(2)}.`,
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await recordPayment({
        invoiceId: targetInv.id,
        amountMinorUnits: amountMinor,
        paymentMethod,
        referenceNumber: refNumber,
        notes,
      });

      addToast({
        type: 'success',
        title: 'Payment Recorded',
        message: `Processed ${formatMinorUnits(amountMinor, targetInv.currency)} for ${targetInv.invoiceNumber}.`,
      });

      setIsModalOpen(false);
      await loadData();
    } catch (e: any) {
      addToast({ type: 'error', title: 'Payment Failed', message: e.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredPayments = payments.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const cust = customers.find((c) => c.id === p.customerId);
    const inv = invoices.find((i) => i.id === p.invoiceId);
    return (
      p.referenceNumber.toLowerCase().includes(q) ||
      p.paymentMethod.toLowerCase().includes(q) ||
      (cust && cust.company.toLowerCase().includes(q)) ||
      (inv && inv.invoiceNumber.toLowerCase().includes(q))
    );
  });

  const selectedTargetInvoice = invoices.find((i) => i.id === selectedInvoiceId);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            Payment Records & Ledger
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Reconciliation records, payment method breakdowns, and strict financial overpayment barriers.
          </p>
        </div>

        <button
          onClick={openRecordModal}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs transition-colors shadow-lg shadow-emerald-500/20"
        >
          <Plus className="w-4 h-4" />
          <span>Record Demo Payment</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md w-full">
        <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
        <input
          type="text"
          placeholder="Search by reference, method, or invoice number..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-[#0e1524] border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
        />
      </div>

      {/* Payments Table */}
      <div className="bg-[#0e1524] border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider bg-slate-900/40">
                <th className="py-3.5 px-4">Transaction Reference</th>
                <th className="py-3.5 px-4">Customer</th>
                <th className="py-3.5 px-4">Linked Invoice</th>
                <th className="py-3.5 px-4">Method</th>
                <th className="py-3.5 px-4">Amount</th>
                <th className="py-3.5 px-4">Status & Simulation</th>
                <th className="py-3.5 px-4 text-right">Recorded Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filteredPayments.length > 0 ? (
                filteredPayments.map((p) => {
                  const cust = customers.find((c) => c.id === p.customerId);
                  const inv = invoices.find((i) => i.id === p.invoiceId);

                  return (
                    <tr key={p.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-4 px-4 font-mono font-medium text-white">
                        {p.referenceNumber}
                        {p.notes && (
                          <div className="text-[10px] text-slate-400 font-sans mt-0.5 truncate max-w-xs">
                            {p.notes}
                          </div>
                        )}
                      </td>

                      <td className="py-4 px-4">
                        <div className="font-semibold text-slate-200">
                          {cust?.company || cust?.name || 'Customer'}
                        </div>
                      </td>

                      <td className="py-4 px-4 font-mono text-emerald-400">
                        {inv?.invoiceNumber || p.invoiceId}
                      </td>

                      <td className="py-4 px-4 uppercase font-semibold text-slate-300">
                        {p.paymentMethod.replace('_', ' ')}
                      </td>

                      <td className="py-4 px-4 font-mono font-bold text-white">
                        {formatMinorUnits(p.amountMinorUnits, p.currency)}
                      </td>

                      <td className="py-4 px-4">
                        <div className="flex items-center gap-1.5">
                          <Badge status={p.status} size="sm" />
                          {p.isSimulated && (
                            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                              Simulated
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-4 px-4 text-right text-slate-400 text-[11px]">
                        {new Date(p.recordedAt).toLocaleString([], {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    No payment records match criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Record Payment */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Record Manual / Demo Payment"
        description="Links to existing invoice and updates remaining balance with overpayment prevention."
      >
        <form onSubmit={handleRecordSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-400 mb-1">Target Invoice *</label>
            <select
              value={selectedInvoiceId}
              onChange={(e) => handleInvoiceChange(e.target.value)}
              required
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
            >
              {invoices.map((inv) => {
                const c = customers.find((cust) => cust.id === inv.customerId);
                return (
                  <option key={inv.id} value={inv.id}>
                    {inv.invoiceNumber} — {c?.company} (Balance: ${(inv.balanceDueMinorUnits / 100).toFixed(2)})
                  </option>
                );
              })}
            </select>
            {selectedTargetInvoice && (
              <div className="mt-1 text-[11px] text-slate-400 flex justify-between">
                <span>Total: ${(selectedTargetInvoice.totalMinorUnits / 100).toFixed(2)}</span>
                <span className="text-rose-400 font-semibold">
                  Outstanding: ${(selectedTargetInvoice.balanceDueMinorUnits / 100).toFixed(2)}
                </span>
              </div>
            )}
          </div>

          <div>
            <label className="block font-semibold text-slate-400 mb-1">Payment Amount ($) *</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              max={selectedTargetInvoice ? (selectedTargetInvoice.balanceDueMinorUnits / 100).toFixed(2) : undefined}
              value={amountMajor}
              onChange={(e) => setAmountMajor(e.target.value)}
              required
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500 font-mono text-sm"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-400 mb-1">Payment Method</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="card">Credit / Debit Card</option>
              <option value="upi">UPI (Unified Payments Interface)</option>
              <option value="bank_transfer">Corporate Wire / ACH</option>
              <option value="cash">Direct Cash / Cheque</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-400 mb-1">
              Reference / Transaction ID *
            </label>
            <input
              type="text"
              value={refNumber}
              onChange={(e) => setRefNumber(e.target.value)}
              required
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500 font-mono"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-400 mb-1">Notes</label>
            <input
              type="text"
              placeholder="e.g. Bank approval code 99281"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="pt-4 flex justify-end gap-2 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold"
            >
              {isSubmitting ? 'Recording...' : 'Record Payment'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

