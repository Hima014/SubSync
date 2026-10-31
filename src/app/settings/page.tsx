'use client';

import React, { useState, useEffect } from 'react';
import {
  Settings,
  Building2,
  Database,
  RotateCcw,
  ShieldCheck,
  CheckCircle2,
  Save,
  Lock,
} from 'lucide-react';
import { getOrganization, updateOrganization, resetDemoData } from '@/lib/repository';
import { Organization, Currency } from '@/types';
import { useToast } from '@/components/ToastProvider';

export default function SettingsPage() {
  const { addToast } = useToast();
  const [org, setOrg] = useState<Organization | null>(null);
  const [name, setName] = useState('');
  const [currency, setCurrency] = useState<Currency>('USD');
  const [taxRatePercent, setTaxRatePercent] = useState<number>(10);
  const [taxIdentifier, setTaxIdentifier] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    getOrganization().then((res) => {
      setOrg(res);
      setName(res.name);
      setCurrency(res.currency);
      setTaxRatePercent(res.taxRatePercent);
      setTaxIdentifier(res.taxIdentifier || '');
    });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const updated = await updateOrganization({
        name,
        currency,
        taxRatePercent,
        taxIdentifier,
      });
      setOrg(updated);
      addToast({
        type: 'success',
        title: 'Settings Saved',
        message: 'Organization configuration updated successfully.',
      });
    } catch (e: any) {
      addToast({ type: 'error', title: 'Save Failed', message: e.message });
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetData = () => {
    if (confirm('Reset demo workspace back to pristine seed records? All test subscriptions, duplicate billing scenarios, and invoices will be restored.')) {
      resetDemoData();
      addToast({
        type: 'info',
        title: 'Demo Workspace Restored',
        message: 'Pristine customers, subscriptions, and duplicate billing test cases reloaded.',
      });
      setTimeout(() => {
        window.location.reload();
      }, 400);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-4xl">
      {/* Header */}
      <div className="pb-4 border-b border-slate-800">
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          Organization & System Settings
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Configure organization profile, default financial boundaries, and inspect architecture persistence.
        </p>
      </div>

      {/* Organization Profile Form */}
      <div className="bg-[#0e1524] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
          <Building2 className="w-4 h-4 text-emerald-400" />
          Organization Profile & Tax Parameters
        </h2>

        <form onSubmit={handleSave} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-400 mb-1">
              Organization Legal Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500 font-medium"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-400 mb-1">
                Default Currency
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as Currency)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="USD">USD ($) — United States Dollar</option>
                <option value="EUR">EUR (€) — Euro</option>
                <option value="GBP">GBP (£) — British Pound</option>
                <option value="INR">INR (₹) — Indian Rupee</option>
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
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-400 mb-1">
              Company Tax ID / EIN / VAT Identifier
            </label>
            <input
              type="text"
              value={taxIdentifier}
              onChange={(e) => setTaxIdentifier(e.target.value)}
              placeholder="e.g. US-EIN-94-3829104"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500 font-mono"
            />
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs transition-colors shadow-lg shadow-emerald-500/20"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Saving...' : 'Save Configuration'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Architecture & Persistence Strategy */}
      <div className="bg-[#0e1524] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
          <Database className="w-4 h-4 text-sky-400" />
          Persistence Architecture & Boundaries
        </h2>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-white">Active Persistence Mode:</span>
            <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[11px] font-bold">
              Protected Local Demo Store
            </span>
          </div>

          <p className="text-slate-400 leading-relaxed">
            SUBSYNC implements a strict repository service layer separating the UI from data persistence.
            In Demo Mode, realistic sample records are maintained in browser localStorage and memory with zero risk of external credential leakage.
          </p>

          <div className="pt-2 border-t border-slate-800/80 space-y-2 text-slate-400">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Integer Minor-Unit Math: All monetary calculations are performed in integer cents/paise.</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Supabase-Ready Repository: Repository interfaces map 1:1 to PostgreSQL tables & RLS policies.</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Zero Leakage: No external secret keys are required or exposed to client bundles.</span>
            </div>
          </div>
        </div>
      </div>

      {/* Reset Demo Data Card */}
      <div className="bg-rose-950/10 border border-rose-500/30 rounded-2xl p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-white text-sm flex items-center gap-2">
            <RotateCcw className="w-4 h-4 text-rose-400" />
            Reset Demo Workspace
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Restores the 5 customers, 4 plans, 6 subscriptions, and preloaded duplicate billing test scenario back to pristine seed states.
          </p>
        </div>

        <button
          onClick={handleResetData}
          className="px-4 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-semibold text-xs border border-rose-500/40 transition-colors shrink-0"
        >
          Reset Demo Data
        </button>
      </div>
    </div>
  );
}

