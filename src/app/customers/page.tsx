'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Search,
  Edit2,
  Trash2,
  Building2,
  Mail,
  Phone,
  MapPin,
  FileCheck,
  ShieldAlert,
} from 'lucide-react';
import {
  getCustomers,
  getSubscriptions,
  createCustomer,
  updateCustomer,
  deleteCustomer,
} from '@/lib/repository';
import { Customer, Subscription } from '@/types';
import { Modal } from '@/components/Modal';
import { useToast } from '@/components/ToastProvider';

export default function CustomersPage() {
  const { addToast } = useToast();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [phone, setPhone] = useState('');
  const [taxId, setTaxId] = useState('');
  const [line1, setLine1] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('United States');

  const loadData = async () => {
    try {
      const [c, s] = await Promise.all([getCustomers(), getSubscriptions()]);
      setCustomers(c);
      setSubscriptions(s);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreateModal = () => {
    setEditingCustomer(null);
    setName('');
    setEmail('');
    setCompany('');
    setPhone('');
    setTaxId('');
    setLine1('');
    setCity('');
    setState('');
    setPostalCode('');
    setCountry('United States');
    setIsModalOpen(true);
  };

  const openEditModal = (c: Customer) => {
    setEditingCustomer(c);
    setName(c.name);
    setEmail(c.email);
    setCompany(c.company);
    setPhone(c.phone || '');
    setTaxId(c.taxId || '');
    setLine1(c.billingAddress?.line1 || '');
    setCity(c.billingAddress?.city || '');
    setState(c.billingAddress?.state || '');
    setPostalCode(c.billingAddress?.postalCode || '');
    setCountry(c.billingAddress?.country || 'United States');
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const billingAddress = {
        line1,
        city,
        state,
        postalCode,
        country,
      };

      if (editingCustomer) {
        await updateCustomer(editingCustomer.id, {
          name,
          email,
          company,
          phone,
          taxId,
          billingAddress,
        });
        addToast({
          type: 'success',
          title: 'Customer Updated',
          message: `Record updated for ${name} (${company}).`,
        });
      } else {
        await createCustomer({
          name,
          email,
          company,
          phone,
          taxId,
          billingAddress,
        });
        addToast({
          type: 'success',
          title: 'Customer Created',
          message: `New account created for ${name} (${company}).`,
        });
      }

      setIsModalOpen(false);
      await loadData();
    } catch (e: any) {
      addToast({ type: 'error', title: 'Operation Failed', message: e.message });
    }
  };

  const handleDelete = async (id: string, customerName: string) => {
    const activeSub = subscriptions.find(
      (s) => s.customerId === id && s.status !== 'cancelled'
    );
    if (activeSub) {
      addToast({
        type: 'error',
        title: 'Safe Deletion Prevented',
        message: `Cannot delete ${customerName} because they have an active or paused subscription (${activeSub.id}). Cancel subscriptions first.`,
      });
      return;
    }

    if (confirm(`Are you sure you want to delete customer ${customerName}?`)) {
      try {
        await deleteCustomer(id);
        addToast({
          type: 'info',
          title: 'Customer Deleted',
          message: `${customerName} removed from workspace.`,
        });
        await loadData();
      } catch (e: any) {
        addToast({ type: 'error', title: 'Delete Failed', message: e.message });
      }
    }
  };

  const filteredCustomers = customers.filter((c) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.company.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      (c.taxId && c.taxId.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            Customer Directory
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Accounts, billing addresses, tax identifiers, and subscription linkages.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs transition-colors shadow-lg shadow-emerald-500/20"
        >
          <Plus className="w-4 h-4" />
          <span>Add Customer</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md w-full">
        <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
        <input
          type="text"
          placeholder="Search by name, company, email or tax ID..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-[#0e1524] border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
        />
      </div>

      {/* Customers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredCustomers.map((cust) => {
          const custSubs = subscriptions.filter((s) => s.customerId === cust.id);
          const activeSubCount = custSubs.filter((s) => s.status === 'active').length;

          return (
            <div
              key={cust.id}
              className="bg-[#0e1524] border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-colors shadow-lg flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-sm">
                      {cust.company.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-sm">{cust.company}</h3>
                      <p className="text-xs text-slate-400">{cust.name}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(cust)}
                      title="Edit Customer"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(cust.id, cust.name)}
                      title="Delete Customer"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-800 space-y-2 text-xs text-slate-300">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Mail className="w-3.5 h-3.5 text-slate-500" />
                    <span className="truncate">{cust.email}</span>
                  </div>

                  {cust.phone && (
                    <div className="flex items-center gap-2 text-slate-400">
                      <Phone className="w-3.5 h-3.5 text-slate-500" />
                      <span>{cust.phone}</span>
                    </div>
                  )}

                  {cust.taxId && (
                    <div className="flex items-center gap-2 text-slate-400 font-mono text-[11px]">
                      <FileCheck className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Tax ID: {cust.taxId}</span>
                    </div>
                  )}

                  {cust.billingAddress?.line1 && (
                    <div className="flex items-start gap-2 text-slate-400 text-[11px]">
                      <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                      <span>
                        {cust.billingAddress.line1}, {cust.billingAddress.city},{' '}
                        {cust.billingAddress.country}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <span className="text-slate-400">
                  {custSubs.length} subscription{custSubs.length !== 1 ? 's' : ''} (
                  <strong className="text-emerald-400">{activeSubCount} active</strong>)
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  {new Date(cust.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Create or Edit Customer */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCustomer ? 'Edit Customer Account' : 'Add New Customer'}
        description="Specify contact profile, tax identifiers, and official billing address."
      >
        <form onSubmit={handleSave} className="space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-400 mb-1">Contact Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-400 mb-1">Company / Entity *</label>
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                required
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-400 mb-1">Work Email *</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-400 mb-1">Phone Number</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-400 mb-1">
              Tax ID / VAT / GST Identifier (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. US-EIN-94-3829104 or DE382910492"
              value={taxId}
              onChange={(e) => setTaxId(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500 font-mono"
            />
          </div>

          <div className="space-y-3 pt-2 border-t border-slate-800">
            <label className="block font-semibold text-slate-300">Registered Billing Address</label>
            <div>
              <input
                type="text"
                placeholder="Street Address Line 1"
                value={line1}
                onChange={(e) => setLine1(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <input
                type="text"
                placeholder="City"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              />
              <input
                type="text"
                placeholder="State/Province"
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              />
              <input
                type="text"
                placeholder="Postal Code"
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <input
                type="text"
                placeholder="Country"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
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
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold"
            >
              {editingCustomer ? 'Save Changes' : 'Create Customer'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

