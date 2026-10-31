'use client';

import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  Plus,
  Edit2,
  Archive,
  CheckCircle2,
  Layers,
  Sparkles,
  DollarSign,
  Percent,
} from 'lucide-react';
import { getPlans, getSubscriptions, createPlan, updatePlan } from '@/lib/repository';
import { formatMinorUnits } from '@/lib/billing-engine';
import { Plan, Currency, BillingInterval, Subscription } from '@/types';
import { Modal } from '@/components/Modal';
import { useToast } from '@/components/ToastProvider';

export default function PlansPage() {
  const { addToast } = useToast();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [priceMajor, setPriceMajor] = useState('49.00');
  const [currency, setCurrency] = useState<Currency>('USD');
  const [billingInterval, setBillingInterval] = useState<BillingInterval>('monthly');
  const [taxRatePercent, setTaxRatePercent] = useState<number>(10);
  const [isActive, setIsActive] = useState(true);

  const loadData = async () => {
    try {
      const [pls, subs] = await Promise.all([getPlans(), getSubscriptions()]);
      setPlans(pls);
      setSubscriptions(subs);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreateModal = () => {
    setEditingPlan(null);
    setName('');
    setDescription('');
    setPriceMajor('49.00');
    setCurrency('USD');
    setBillingInterval('monthly');
    setTaxRatePercent(10);
    setIsActive(true);
    setIsModalOpen(true);
  };

  const openEditModal = (p: Plan) => {
    setEditingPlan(p);
    setName(p.name);
    setDescription(p.description);
    setPriceMajor((p.priceMinorUnits / 100).toFixed(2));
    setCurrency(p.currency);
    setBillingInterval(p.billingInterval);
    setTaxRatePercent(p.taxRatePercent);
    setIsActive(p.isActive);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const priceMinorUnits = Math.round(parseFloat(priceMajor || '0') * 100);

      if (editingPlan) {
        await updatePlan(editingPlan.id, {
          name,
          description,
          priceMinorUnits,
          currency,
          billingInterval,
          taxRatePercent,
          isActive,
        });
        addToast({
          type: 'success',
          title: 'Plan Updated',
          message: `${name} catalog configuration updated.`,
        });
      } else {
        await createPlan({
          name,
          description,
          priceMinorUnits,
          currency,
          billingInterval,
          taxRatePercent,
          isActive,
        });
        addToast({
          type: 'success',
          title: 'Plan Created',
          message: `${name} is now available for subscriptions.`,
        });
      }

      setIsModalOpen(false);
      await loadData();
    } catch (e: any) {
      addToast({ type: 'error', title: 'Operation Failed', message: e.message });
    }
  };

  const handleToggleActive = async (p: Plan) => {
    try {
      await updatePlan(p.id, { isActive: !p.isActive });
      addToast({
        type: 'info',
        title: p.isActive ? 'Plan Archived' : 'Plan Reactivated',
        message: `${p.name} status updated.`,
      });
      await loadData();
    } catch (e: any) {
      addToast({ type: 'error', title: 'Action Failed', message: e.message });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            Subscription Plan Catalog
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Standard pricing tiers, recurring intervals, and minor-unit base rates enforced by the Billing Integrity Guard.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs transition-colors shadow-lg shadow-emerald-500/20"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Plan</span>
        </button>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {plans.map((plan) => {
          const subscriberCount = subscriptions.filter(
            (s) => s.planId === plan.id && s.status === 'active'
          ).length;

          return (
            <div
              key={plan.id}
              className={`bg-[#0e1524] border rounded-2xl p-6 transition-all shadow-lg flex flex-col justify-between ${
                plan.isActive
                  ? 'border-slate-800 hover:border-slate-700'
                  : 'border-slate-800/40 opacity-60'
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      plan.isActive
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}
                  >
                    {plan.isActive ? 'Active Tier' : 'Archived'}
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(plan)}
                      className="p-1 rounded text-slate-400 hover:text-white transition-colors"
                      title="Edit Plan"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleToggleActive(plan)}
                      className="p-1 rounded text-slate-400 hover:text-amber-400 transition-colors"
                      title={plan.isActive ? 'Archive Plan' : 'Reactivate Plan'}
                    >
                      <Archive className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="mt-4">
                  <h3 className="font-bold text-white text-lg tracking-tight">{plan.name}</h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed min-h-[36px]">
                    {plan.description}
                  </p>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-800">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold text-white font-mono">
                      {formatMinorUnits(plan.priceMinorUnits, plan.currency)}
                    </span>
                    <span className="text-xs text-slate-400 capitalize">
                      / {plan.billingInterval}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    Minor units: {plan.priceMinorUnits.toLocaleString()} cents • Tax: {plan.taxRatePercent}%
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-slate-500" />
                  <span>
                    <strong className="text-white">{subscriberCount}</strong> active
                  </span>
                </span>
                <span className="text-slate-400 uppercase font-mono text-[10px]">
                  {plan.currency}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Create or Edit Plan */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingPlan ? 'Edit Plan Definition' : 'Create New Plan'}
        description="Set standard prices using minor-unit integer arithmetic to prevent floating-point drift."
      >
        <form onSubmit={handleSave} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-400 mb-1">Plan Name *</label>
            <input
              type="text"
              placeholder="e.g. Enterprise Shield"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-400 mb-1">Description</label>
            <textarea
              placeholder="Features and target audience..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-400 mb-1">
                Standard Price ($) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={priceMajor}
                onChange={(e) => setPriceMajor(e.target.value)}
                required
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500 font-mono text-sm"
              />
              <div className="text-[10px] text-slate-500 mt-1">
                Stored as: {Math.round(parseFloat(priceMajor || '0') * 100)} minor cents
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-400 mb-1">Currency</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as Currency)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="INR">INR (₹)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-400 mb-1">
                Billing Interval
              </label>
              <select
                value={billingInterval}
                onChange={(e) => setBillingInterval(e.target.value as BillingInterval)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500 capitalize"
              >
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-400 mb-1">
                Default Tax Rate (%)
              </label>
              <input
                type="number"
                min="0"
                value={taxRatePercent}
                onChange={(e) => setTaxRatePercent(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="pt-2 flex items-center gap-2">
            <input
              type="checkbox"
              id="isActiveCheck"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="accent-emerald-500 rounded"
            />
            <label htmlFor="isActiveCheck" className="text-slate-300 font-medium">
              Active plan available for new subscriber subscriptions
            </label>
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
              {editingPlan ? 'Save Plan' : 'Create Plan'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

