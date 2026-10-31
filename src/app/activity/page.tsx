'use client';

import React, { useState, useEffect } from 'react';
import {
  Activity,
  ShieldCheck,
  Search,
  Filter,
  Layers,
  FileText,
  DollarSign,
  Users,
  CreditCard,
  Lock,
} from 'lucide-react';
import { getActivityLogs } from '@/lib/repository';
import { ActivityLog } from '@/types';
import { Badge } from '@/components/Badge';

export default function ActivityPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [entityFilter, setEntityFilter] = useState('all');

  useEffect(() => {
    getActivityLogs().then((res) => {
      setLogs(res);
      setLoading(false);
    });
  }, []);

  const filteredLogs = logs.filter((log) => {
    if (entityFilter !== 'all' && log.entityType !== entityFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        log.action.toLowerCase().includes(q) ||
        log.description.toLowerCase().includes(q) ||
        log.entityId.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const getEntityIcon = (type: ActivityLog['entityType']) => {
    switch (type) {
      case 'integrity_guard':
        return <ShieldCheck className="w-4 h-4 text-emerald-400" />;
      case 'invoice':
        return <FileText className="w-4 h-4 text-sky-400" />;
      case 'subscription':
        return <Layers className="w-4 h-4 text-purple-400" />;
      case 'payment':
        return <DollarSign className="w-4 h-4 text-amber-400" />;
      case 'customer':
        return <Users className="w-4 h-4 text-indigo-400" />;
      case 'plan':
        return <CreditCard className="w-4 h-4 text-rose-400" />;
      default:
        return <Activity className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            Activity & Audit History
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Immutable audit trail of subscription state transitions, invoice issuances, and Billing Integrity Guard intercepts.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800">
          <Lock className="w-3.5 h-3.5 text-emerald-400" />
          <span>Tamper-Resistant Historical Record</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#0e1524] border border-slate-800 p-4 rounded-2xl">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search action, description, or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {['all', 'integrity_guard', 'subscription', 'invoice', 'payment', 'customer', 'plan'].map(
            (t) => (
              <button
                key={t}
                onClick={() => setEntityFilter(t)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize whitespace-nowrap transition-colors ${
                  entityFilter === t
                    ? 'bg-emerald-500 text-slate-950'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {t.replace('_', ' ')}
              </button>
            )
          )}
        </div>
      </div>

      {/* Audit Log Timeline */}
      <div className="bg-[#0e1524] border border-slate-800 rounded-2xl p-6 shadow-xl">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredLogs.length > 0 ? (
          <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-800">
            {filteredLogs.map((log) => (
              <div key={log.id} className="relative group">
                <div className="absolute -left-6 top-1.5 w-5 h-5 rounded-full bg-slate-900 border-2 border-slate-700 group-hover:border-emerald-500 flex items-center justify-center transition-colors">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                </div>

                <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800/80 group-hover:border-slate-700 transition-colors space-y-1.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {getEntityIcon(log.entityType)}
                      <span className="font-bold text-white text-xs tracking-wide">
                        {log.action}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                        {log.entityType}
                      </span>
                    </div>

                    <span className="text-[11px] text-slate-400 font-mono">
                      {new Date(log.timestamp).toLocaleString([], {
                        dateStyle: 'medium',
                        timeStyle: 'medium',
                      })}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">{log.description}</p>

                  <div className="text-[10px] text-slate-500 font-mono pt-1">
                    Entity ID: <span className="text-slate-400">{log.entityId}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center text-slate-500 text-xs">
            No audit records match the selected filter.
          </div>
        )}
      </div>
    </div>
  );
}

