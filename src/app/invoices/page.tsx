'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  FileText,
  Download,
  CreditCard,
  ShieldCheck,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  ExternalLink,
  Hash,
  Calculator,
} from 'lucide-react';
import { getInvoices, getCustomers, recordPayment } from '@/lib/repository';
import { formatMinorUnits } from '@/lib/billing-engine';
import { generateInvoicePDF } from '@/lib/pdf-generator';
import { Invoice, Customer, PaymentMethod } from '@/types';
import { Badge } from '@/components/Badge';
import { Modal } from '@/components/Modal';
import { useToast } from '@/components/ToastProvider';

export default function InvoicesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="w-6 h-6 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <InvoicesContent />
    </Suspense>
  );
}

function InvoicesContent() {
  const searchParams = useSearchParams();
  const { addToast } = useToast();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected Invoice for Passport / Preview Modal
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  // Payment Modal State
  const [paymentInvoice, setPaymentInvoice] = useState<Invoice | null>(null);
  const [paymentAmountMajor, setPaymentAmountMajor] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
  const [paymentRef, setPaymentRef] = useState<string>('');
  const [paymentNotes, setPaymentNotes] = useState<string>('');
  const [isPaying, setIsPaying] = useState(false);

  const loadData = async () => {
    try {
      const [invs, custs] = await Promise.all([getInvoices(), getCustomers()]);
      setInvoices(invs);
      setCustomers(custs);

      const highlightId = searchParams.get('highlight');
      if (highlightId) {
        const found = invs.find((i) => i.id === highlightId);
        if (found) setSelectedInvoice(found);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [searchParams]);

  const handleDownloadPDF = (inv: Invoice) => {
    const cust = customers.find((c) => c.id === inv.customerId);
    generateInvoicePDF(inv, cust);
    addToast({
      type: 'success',
      title: 'Invoice PDF Downloaded',
      message: `${inv.invoiceNumber}.pdf generated with sealed Explainable Passport.`,
    });
  };

  const handleOpenPayment = (inv: Invoice) => {
    setPaymentInvoice(inv);
    setPaymentAmountMajor((inv.balanceDueMinorUnits / 100).toFixed(2));
    setPaymentRef(`MANUAL-SIM-${Date.now().toString().slice(-6)}`);
    setPaymentNotes('');
  };

  const handleRecordPaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentInvoice) return;

    const amountMinor = Math.round(parseFloat(paymentAmountMajor || '0') * 100);

    // Overpayment check on client before calling service
    if (amountMinor > paymentInvoice.balanceDueMinorUnits) {
      addToast({
        type: 'error',
        title: 'Overpayment Blocked',
        message: `Amount ($${(amountMinor / 100).toFixed(2)}) exceeds remaining balance of $${(paymentInvoice.balanceDueMinorUnits / 100).toFixed(2)}.`,
      });
      return;
    }

    setIsPaying(true);
    try {
      const result = await recordPayment({
        invoiceId: paymentInvoice.id,
        amountMinorUnits: amountMinor,
        paymentMethod,
        referenceNumber: paymentRef,
        notes: paymentNotes,
      });

      addToast({
        type: 'success',
        title: 'Payment Recorded',
        message: `Successfully processed ${formatMinorUnits(amountMinor, paymentInvoice.currency)} for ${paymentInvoice.invoiceNumber}.`,
      });

      setPaymentInvoice(null);
      await loadData();
    } catch (e: any) {
      addToast({
        type: 'error',
        title: 'Payment Failed',
        message: e.message,
      });
    } finally {
      setIsPaying(false);
    }
  };

  const filteredInvoices = invoices.filter((inv) => {
    if (statusFilter !== 'all' && inv.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const cust = customers.find((c) => c.id === inv.customerId);
      const query = searchQuery.toLowerCase();
      const matchCust = cust?.name.toLowerCase().includes(query) || cust?.company.toLowerCase().includes(query);
      const matchNum = inv.invoiceNumber.toLowerCase().includes(query);
      if (!matchCust && !matchNum) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            Invoice Management & Calculation Passports
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Every issued invoice holds an immutable calculation snapshot and cryptographic validation seal.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
            {invoices.length} Total Invoices Tracked
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#0e1524] border border-slate-800 p-4 rounded-2xl">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search by invoice number or customer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {(['all', 'paid', 'partially_paid', 'overdue', 'issued'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize whitespace-nowrap transition-colors ${
                statusFilter === st
                  ? 'bg-emerald-500 text-slate-950'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {st.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-[#0e1524] border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider bg-slate-900/40">
                <th className="py-3.5 px-4">Invoice # & Passport</th>
                <th className="py-3.5 px-4">Customer</th>
                <th className="py-3.5 px-4">Billing Period</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Total Amount</th>
                <th className="py-3.5 px-4">Balance Due</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filteredInvoices.length > 0 ? (
                filteredInvoices.map((inv) => {
                  const cust = customers.find((c) => c.id === inv.customerId);

                  return (
                    <tr key={inv.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-4 px-4">
                        <div className="font-bold text-white text-sm flex items-center gap-2">
                          <span>{inv.invoiceNumber}</span>
                          {inv.passport && (
                            <span
                              title="Holds immutable calculation passport"
                              className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px]"
                            >
                              ✓
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Issued: {inv.issuedDate}
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <div className="font-semibold text-slate-200">
                          {cust?.company || cust?.name || 'Customer'}
                        </div>
                        <div className="text-[11px] text-slate-400">{cust?.email}</div>
                      </td>

                      <td className="py-4 px-4 font-mono text-slate-300">
                        {inv.billingPeriodStart} → {inv.billingPeriodEnd}
                      </td>

                      <td className="py-4 px-4">
                        <Badge status={inv.status} size="sm" />
                      </td>

                      <td className="py-4 px-4 font-mono font-bold text-white">
                        {formatMinorUnits(inv.totalMinorUnits, inv.currency)}
                      </td>

                      <td className="py-4 px-4 font-mono">
                        <span
                          className={
                            inv.balanceDueMinorUnits > 0
                              ? 'text-rose-400 font-bold'
                              : 'text-slate-400'
                          }
                        >
                          {formatMinorUnits(inv.balanceDueMinorUnits, inv.currency)}
                        </span>
                      </td>

                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* Inspect Passport */}
                          <button
                            onClick={() => setSelectedInvoice(inv)}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors border border-slate-700 flex items-center gap-1.5"
                          >
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Passport</span>
                          </button>

                          {/* Download PDF */}
                          <button
                            onClick={() => handleDownloadPDF(inv)}
                            title="Download PDF"
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>

                          {/* Record Payment */}
                          {inv.balanceDueMinorUnits > 0 && (
                            <button
                              onClick={() => handleOpenPayment(inv)}
                              className="px-2.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs transition-colors flex items-center gap-1"
                            >
                              <CreditCard className="w-3.5 h-3.5" />
                              <span>Pay</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    No invoices match criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Explainable Invoice Passport & Full Detail View */}
      {selectedInvoice && (
        <Modal
          isOpen={!!selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
          title={`Invoice ${selectedInvoice.invoiceNumber}`}
          description="Itemized bill with sealed Explainable Calculation Passport."
          maxWidth="2xl"
        >
          <div className="space-y-6 text-xs text-slate-300">
            {/* Customer & Period Header */}
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 grid grid-cols-2 gap-4">
              <div>
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Customer
                </div>
                <div className="font-bold text-white text-sm mt-1">
                  {customers.find((c) => c.id === selectedInvoice.customerId)?.company}
                </div>
                <div className="text-slate-400 mt-0.5">
                  {customers.find((c) => c.id === selectedInvoice.customerId)?.email}
                </div>
              </div>
              <div className="text-right">
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Billing Period
                </div>
                <div className="font-mono text-white mt-1">
                  {selectedInvoice.billingPeriodStart} to {selectedInvoice.billingPeriodEnd}
                </div>
                <div className="mt-1">
                  <Badge status={selectedInvoice.status} size="sm" />
                </div>
              </div>
            </div>

            {/* Line items */}
            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                Itemized Line Items
              </div>
              <div className="border border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900/60 border-b border-slate-800 text-slate-400 uppercase tracking-wider">
                    <tr>
                      <th className="p-3">Description</th>
                      <th className="p-3">Qty</th>
                      <th className="p-3">Rate</th>
                      <th className="p-3 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {selectedInvoice.lineItems.map((li) => (
                      <tr key={li.id}>
                        <td className="p-3 font-medium text-white">{li.description}</td>
                        <td className="p-3">{li.quantity}</td>
                        <td className="p-3 font-mono">
                          {formatMinorUnits(li.unitPriceMinorUnits, selectedInvoice.currency)}
                        </td>
                        <td className="p-3 font-mono text-right">
                          {formatMinorUnits(li.subtotalMinorUnits, selectedInvoice.currency)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Financial Summary */}
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Subtotal:</span>
                <span className="font-mono text-slate-200">
                  {formatMinorUnits(selectedInvoice.subtotalMinorUnits, selectedInvoice.currency)}
                </span>
              </div>
              {selectedInvoice.discountMinorUnits > 0 && (
                <div className="flex justify-between text-emerald-400">
                  <span>Promotional Discount:</span>
                  <span className="font-mono">
                    -{formatMinorUnits(selectedInvoice.discountMinorUnits, selectedInvoice.currency)}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-slate-400">
                <span>Tax Rate & Assessments:</span>
                <span className="font-mono text-slate-200">
                  +{formatMinorUnits(selectedInvoice.taxMinorUnits, selectedInvoice.currency)}
                </span>
              </div>
              <div className="flex justify-between font-bold text-white text-sm pt-2 border-t border-slate-800">
                <span>Total Invoiced:</span>
                <span className="font-mono">
                  {formatMinorUnits(selectedInvoice.totalMinorUnits, selectedInvoice.currency)}
                </span>
              </div>
              <div className="flex justify-between text-slate-400 pt-1">
                <span>Amount Paid:</span>
                <span className="font-mono text-emerald-400">
                  {formatMinorUnits(selectedInvoice.amountPaidMinorUnits, selectedInvoice.currency)}
                </span>
              </div>
              <div className="flex justify-between font-bold text-rose-400">
                <span>Balance Due:</span>
                <span className="font-mono">
                  {formatMinorUnits(selectedInvoice.balanceDueMinorUnits, selectedInvoice.currency)}
                </span>
              </div>
            </div>

            {/* PRIMARY DIFFERENTIATOR: EXPLAINABLE INVOICE PASSPORT */}
            <div className="p-5 rounded-xl bg-emerald-950/20 border border-emerald-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  <h4 className="font-bold text-white text-sm">
                    Explainable Invoice Passport
                  </h4>
                </div>
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold border border-emerald-500/30">
                  IMMUTABLE SNAPSHOT
                </span>
              </div>

              <p className="text-slate-300 text-xs leading-relaxed">
                This invoice calculation was validated by the Billing Integrity Guard upon issuance and permanently sealed.
                Historical invoices are never silently recomputed when plan catalog prices fluctuate.
              </p>

              {selectedInvoice.passport ? (
                <div className="p-3 rounded-lg bg-slate-900/80 border border-emerald-500/20 space-y-2 text-[11px] font-mono">
                  <div className="flex justify-between text-slate-300">
                    <span>Base Formula:</span>
                    <span>
                      {selectedInvoice.passport.quantity} seats × {formatMinorUnits(selectedInvoice.passport.unitPriceMinorUnits)} = {formatMinorUnits(selectedInvoice.passport.baseAmountMinorUnits)}
                    </span>
                  </div>
                  <div className="flex justify-between text-emerald-400">
                    <span>Discount Snapshot:</span>
                    <span>
                      {selectedInvoice.passport.discountPercent}% (-{formatMinorUnits(selectedInvoice.passport.discountMinorUnits)})
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Tax Assessment:</span>
                    <span>
                      {selectedInvoice.passport.taxRatePercent}% (+{formatMinorUnits(selectedInvoice.passport.taxMinorUnits)})
                    </span>
                  </div>
                  <div className="flex justify-between text-white font-bold pt-1 border-t border-slate-800">
                    <span>Integrity Seal Hash:</span>
                    <span className="text-emerald-400">{selectedInvoice.passport.integritySnapshot.hash}</span>
                  </div>
                </div>
              ) : (
                <div className="text-[11px] text-slate-400">
                  Legacy or manual invoice record without cryptographic passport seal.
                </div>
              )}
            </div>

            {/* Actions in Modal */}
            <div className="flex justify-between items-center pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => handleDownloadPDF(selectedInvoice)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition-colors flex items-center gap-2 border border-slate-700"
              >
                <Download className="w-4 h-4 text-emerald-400" />
                <span>Download Sealed PDF</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedInvoice(null)}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs"
              >
                Done
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal: Record Payment with Overpayment Prevention */}
      {paymentInvoice && (
        <Modal
          isOpen={!!paymentInvoice}
          onClose={() => setPaymentInvoice(null)}
          title={`Record Payment for ${paymentInvoice.invoiceNumber}`}
          description={`Outstanding balance: ${formatMinorUnits(paymentInvoice.balanceDueMinorUnits, paymentInvoice.currency)}`}
        >
          <form onSubmit={handleRecordPaymentSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-400 mb-1">
                Payment Amount ($)
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                max={(paymentInvoice.balanceDueMinorUnits / 100).toFixed(2)}
                value={paymentAmountMajor}
                onChange={(e) => setPaymentAmountMajor(e.target.value)}
                required
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500 font-mono text-sm"
              />
              <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
                <span>Maximum allowed: ${(paymentInvoice.balanceDueMinorUnits / 100).toFixed(2)}</span>
                <span className="text-emerald-400">Overpayment strictly guarded</span>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-400 mb-1">
                Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="card">Credit / Debit Card</option>
                <option value="upi">UPI (Instant Realtime)</option>
                <option value="bank_transfer">Corporate Wire / ACH</option>
                <option value="cash">Direct Cash / Cheque</option>
                <option value="other">Other Method</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-400 mb-1">
                Reference / Transaction Number
              </label>
              <input
                type="text"
                value={paymentRef}
                onChange={(e) => setPaymentRef(e.target.value)}
                required
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-400 mb-1">
                Internal Notes (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Cleared via corporate treasury"
                value={paymentNotes}
                onChange={(e) => setPaymentNotes(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-[11px] text-slate-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
              <span>Simulated Payment Mode — Safely updates balance due without external payment gateway risk.</span>
            </div>

            <div className="pt-4 flex justify-end gap-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setPaymentInvoice(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPaying}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold flex items-center gap-1.5"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>{isPaying ? 'Recording...' : 'Record Payment'}</span>
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

