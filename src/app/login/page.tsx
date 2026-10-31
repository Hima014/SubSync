'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, ArrowRight, Lock, Mail, CheckCircle2, Sparkles } from 'lucide-react';
import { resetDemoData } from '@/lib/repository';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('demo.lead@subsync.io');
  const [password, setPassword] = useState('••••••••••••');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      router.push('/dashboard');
    }, 400);
  };

  const handleQuickDemoEntry = () => {
    setIsLoading(true);
    resetDemoData();
    setTimeout(() => {
      router.push('/dashboard');
    }, 300);
  };

  return (
    <div className="min-h-screen bg-[#070b12] text-slate-100 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      {/* Background subtle radial glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 mb-4 shadow-xl shadow-emerald-500/10">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">SUBSYNC</h1>
          <p className="text-sm text-emerald-400 font-medium mt-1">
            Every Subscription in Sync. Every Billing Action Protected.
          </p>
          <p className="text-xs text-slate-400 mt-2 max-w-sm mx-auto">
            The subscription management platform with deterministic financial validation guards to eliminate billing discrepancies.
          </p>
        </div>

        {/* Login Box */}
        <div className="bg-[#0e1524] border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl backdrop-blur-md">
          {/* 1-Click Demo Workspace Access */}
          <div className="mb-6 pb-6 border-b border-slate-800">
            <button
              onClick={handleQuickDemoEntry}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-bold text-sm transition-all shadow-lg shadow-emerald-500/20 active:scale-[0.99]"
            >
              <Sparkles className="w-4 h-4" />
              <span>Enter Demo Workspace with Pre-Seeded Scenarios</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>
            <div className="mt-2 text-center text-[11px] text-slate-400">
              Includes preloaded duplicate billing test case & live calculation passports
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Work Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm transition-colors border border-slate-700/60"
            >
              {isLoading ? 'Verifying Credentials...' : 'Sign In'}
            </button>
          </form>

          {/* Highlights checklist */}
          <div className="mt-6 pt-6 border-t border-slate-800/80 space-y-2 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Billing Integrity Guard active on all subscriptions</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>What-If simulator preview with zero database mutation</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Minor-unit integer math guarantees zero float drift</span>
            </div>
          </div>
        </div>

        <div className="text-center mt-6 text-xs text-slate-400">
          SUBSYNC Platform v1.0 • Built with Next.js, TypeScript & Tailwind
        </div>
      </div>
    </div>
  );
}

