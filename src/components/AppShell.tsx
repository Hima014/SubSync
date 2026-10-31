'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  ShieldCheck,
  LayoutDashboard,
  Users,
  CreditCard,
  Layers,
  FileText,
  Sliders,
  DollarSign,
  Activity,
  Settings,
  ChevronRight,
  Menu,
  X,
  Sparkles,
  RefreshCw,
  LogOut,
  Building2,
} from 'lucide-react';
import { getOrganization, resetDemoData } from '@/lib/repository';
import { Organization } from '@/types';
import { useToast } from './ToastProvider';

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { addToast } = useToast();
  const [org, setOrg] = useState<Organization | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => {
    getOrganization().then(setOrg);
  }, [pathname]);

  // Don't render shell on public auth / login page
  if (pathname === '/login' || pathname === '/') {
    return <>{children}</>;
  }

  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    {
      name: 'Billing Integrity Guard',
      href: '/integrity',
      icon: ShieldCheck,
      highlight: true,
      badge: 'Core Guard',
    },
    {
      name: 'What-If Simulator',
      href: '/simulator',
      icon: Sliders,
      highlight: true,
      badge: 'Preview',
    },
    { name: 'Subscriptions', href: '/subscriptions', icon: Layers },
    { name: 'Invoices', href: '/invoices', icon: FileText },
    { name: 'Customers', href: '/customers', icon: Users },
    { name: 'Plans', href: '/plans', icon: CreditCard },
    { name: 'Payments', href: '/payments', icon: DollarSign },
    { name: 'Activity Audit', href: '/activity', icon: Activity },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  const handleResetData = () => {
    if (confirm('Reset demo workspace back to pristine seed records? All sample subscriptions and invoices will be restored.')) {
      setIsResetting(true);
      resetDemoData();
      addToast({
        type: 'info',
        title: 'Demo Environment Reset',
        message: 'Loaded pristine customers, plans, and duplicate billing test scenarios.',
      });
      setTimeout(() => {
        setIsResetting(false);
        router.refresh();
        window.location.reload();
      }, 500);
    }
  };

  const handleLogout = () => {
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-[#070b12] text-slate-100 flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 flex-col fixed inset-y-0 z-30 bg-[#0d131f] border-r border-slate-800/80">
        {/* Brand */}
        <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform shadow-lg shadow-emerald-500/10">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="font-bold text-lg tracking-tight flex items-center gap-1.5 text-white">
                SUBSYNC
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Guard
                </span>
              </div>
              <div className="text-[11px] text-slate-400 leading-none">Billing Integrity Platform</div>
            </div>
          </Link>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <div className="px-3 pb-2 text-[11px] font-semibold tracking-wider uppercase text-slate-500">
            Platform Navigation
          </div>

          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold shadow-sm'
                    : item.highlight
                    ? 'text-slate-200 hover:bg-slate-800/60 hover:text-white border border-slate-800/60'
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon
                    className={`w-4 h-4 ${
                      isActive
                        ? 'text-emerald-400'
                        : item.highlight
                        ? 'text-emerald-400'
                        : 'text-slate-400'
                    }`}
                  />
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      isActive
                        ? 'bg-emerald-500/30 text-emerald-300'
                        : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* Demo Mode Status Card */}
        <div className="p-3 m-3 rounded-xl bg-slate-900/90 border border-slate-800 text-xs">
          <div className="flex items-center justify-between text-slate-300 mb-1">
            <span className="font-medium flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Demo Workspace
            </span>
            <button
              onClick={handleResetData}
              disabled={isResetting}
              title="Reset Demo Records"
              className="text-slate-400 hover:text-white transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
            </button>
          </div>
          <p className="text-[11px] text-slate-500 leading-tight">
            Safe sandbox with preloaded duplicate billing test cases.
          </p>
        </div>

        {/* User / Org Footer */}
        <div className="p-3 border-t border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-300 font-semibold text-xs border border-slate-700 shrink-0">
              <Building2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-white truncate">
                {org?.name || 'Demo Org'}
              </div>
              <div className="text-[10px] text-emerald-400 truncate">Protected Tier</div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Log out"
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-h-screen">
        {/* Top Navbar */}
        <header className="sticky top-0 z-20 h-16 bg-[#070b12]/90 backdrop-blur-md border-b border-slate-800/80 px-4 lg:px-8 flex items-center justify-between">
          {/* Mobile menu trigger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          {/* Tagline / Context */}
          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Every Subscription in Sync.</span>
            <span className="text-slate-600">•</span>
            <span className="text-emerald-400 font-medium">Every Billing Action Protected.</span>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2.5">
            <Link
              href="/simulator"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-xs font-medium text-slate-200 border border-slate-700/80 transition-colors shadow-sm"
            >
              <Sliders className="w-3.5 h-3.5 text-emerald-400" />
              <span>What-If Simulator</span>
            </Link>
            <Link
              href="/integrity"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-xs font-semibold text-slate-950 transition-colors shadow-lg shadow-emerald-500/20"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Billing Integrity Center</span>
            </Link>
          </div>
        </header>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-40 bg-slate-950/95 flex flex-col p-6">
            <div className="flex items-center justify-between pb-6 border-b border-slate-800">
              <div className="flex items-center gap-2 font-bold text-white text-lg">
                <ShieldCheck className="w-6 h-6 text-emerald-400" />
                SUBSYNC
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="flex-1 py-6 space-y-2 overflow-y-auto">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between px-4 py-3 rounded-xl text-base font-medium ${
                    pathname === item.href
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'text-slate-300 hover:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="w-5 h-5 text-emerald-400" />
                    <span>{item.name}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500" />
                </Link>
              ))}
            </div>
            <div className="pt-4 border-t border-slate-800 flex justify-between">
              <button
                onClick={handleResetData}
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Reset Demo Records
              </button>
              <button
                onClick={handleLogout}
                className="text-xs text-rose-400 hover:underline"
              >
                Log Out
              </button>
            </div>
          </div>
        )}

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-8 max-w-7xl w-full mx-auto">{children}</main>
      </div>
    </div>
  );
}

