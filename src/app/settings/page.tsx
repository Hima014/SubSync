"use client";

import React, { useState } from "react";
import { useApp } from "@/context/app-context";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { SystemSettings } from "@/types";

function SettingsSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export default function SettingsPage() {
  const { settings, updateSettings, resetToMockData } = useApp();

  // Local form state — only persisted on Save
  const [form, setForm] = useState<SystemSettings>({ ...settings });
  const [saved, setSaved] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetDone, setResetDone] = useState(false);

  const handleChange = (field: keyof SystemSettings, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setSaved(false);
  };

  const handleSave = () => {
    updateSettings(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleReset = () => {
    resetToMockData();
    setShowResetConfirm(false);
    setResetDone(true);
    setTimeout(() => setResetDone(false), 4000);
    // Reset local form too
    setForm({ ...settings });
  };

  const isDirty = JSON.stringify(form) !== JSON.stringify(settings);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-ivory-200 border border-border text-[10px] font-bold uppercase tracking-wider text-charcoal mb-1">
            <span>System Configuration</span>
            <span className="w-1.5 h-1.5 rounded-full bg-gold" />
            <span>Persisted to LocalStorage</span>
          </div>
          <h2 className="text-xl lg:text-2xl font-bold tracking-tight text-charcoal">Settings</h2>
          <p className="text-xs text-charcoal-soft mt-0.5">
            Business profile, currency, tax configuration, and application preferences
          </p>
        </div>
        <div className="flex items-center gap-3">
          {isDirty && (
            <span className="text-xs text-amber-600 font-semibold">Unsaved changes</span>
          )}
          <Button
            variant="gold"
            size="sm"
            onClick={handleSave}
            disabled={!isDirty}
          >
            {saved ? "✓ Saved" : "Save Changes"}
          </Button>
        </div>
      </div>

      {/* Save success toast */}
      {saved && (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-integrity-passed-bg border border-integrity-passed-border text-xs">
          <svg className="w-4 h-4 text-integrity-passed shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span className="font-semibold text-integrity-passed">Settings saved successfully.</span>
          <span className="text-charcoal-soft">Changes are persisted to browser localStorage.</span>
        </div>
      )}

      {/* Reset success toast */}
      {resetDone && (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-integrity-warning-bg border border-integrity-warning-border text-xs">
          <svg className="w-4 h-4 text-amber-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span className="font-semibold text-amber-700">Application reset to demo data.</span>
          <span className="text-charcoal-soft">All customers, subscriptions and invoices restored to original mock data.</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Business Profile */}
        <SettingsSection
          title="Business Profile"
          description="Your organization's registered details used on invoices"
        >
          <div className="space-y-4">
            <Input
              label="Business Name"
              value={form.businessName}
              onChange={(e) => handleChange("businessName", e.target.value)}
              placeholder="e.g. Acme Technologies Pvt Ltd"
            />
            <Input
              label="Business Address"
              value={form.businessAddress}
              onChange={(e) => handleChange("businessAddress", e.target.value)}
              placeholder="e.g. 42 MG Road, Bangalore – 560001"
            />
            <Input
              label="GSTIN"
              value={form.gstin}
              onChange={(e) => handleChange("gstin", e.target.value)}
              placeholder="e.g. 29AABCU9603R1ZM"
              helperText="15-character GST Identification Number"
            />
            <Input
              label="Support Email"
              type="email"
              value={form.supportEmail}
              onChange={(e) => handleChange("supportEmail", e.target.value)}
              placeholder="e.g. billing@acme.com"
            />
          </div>
        </SettingsSection>

        {/* Currency & Tax */}
        <div className="space-y-6">
          <SettingsSection
            title="Currency"
            description="Default currency for all billing calculations and invoices"
          >
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Currency Code"
                  value={form.currency}
                  onChange={(e) => handleChange("currency", e.target.value)}
                  placeholder="INR"
                  helperText="ISO 4217 code"
                />
                <Input
                  label="Currency Symbol"
                  value={form.currencySymbol}
                  onChange={(e) => handleChange("currencySymbol", e.target.value)}
                  placeholder="₹"
                />
              </div>
              <div className="p-3 rounded-lg bg-ivory-200 border border-border text-xs text-charcoal-soft">
                Preview:{" "}
                <span className="font-mono font-bold text-charcoal">
                  {form.currencySymbol}1,00,000.00 {form.currency}
                </span>
              </div>
            </div>
          </SettingsSection>

          <SettingsSection
            title="Tax Configuration"
            description="Default GST rate applied when billing calculations are run"
          >
            <div className="space-y-4">
              <Select
                label="Default GST Rate"
                value={form.defaultGstRate.toString()}
                onChange={(e) => handleChange("defaultGstRate", parseFloat(e.target.value))}
                options={[
                  { value: "18", label: "18% — Standard Rate (Goods & Services)" },
                  { value: "12", label: "12% — Reduced Rate" },
                  { value: "5", label: "5% — Essential Services" },
                  { value: "0", label: "0% — Tax Exempt" },
                ]}
                helperText="Applied as CGST + SGST split equally"
              />
              <div className="p-3 rounded-lg bg-ivory-200 border border-border text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-charcoal-soft">CGST rate</span>
                  <span className="font-mono font-semibold text-charcoal">{form.defaultGstRate / 2}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-charcoal-soft">SGST rate</span>
                  <span className="font-mono font-semibold text-charcoal">{form.defaultGstRate / 2}%</span>
                </div>
                <div className="flex justify-between border-t border-border pt-1">
                  <span className="text-charcoal-soft font-semibold">Combined GST</span>
                  <span className="font-mono font-bold text-charcoal">{form.defaultGstRate}%</span>
                </div>
              </div>
            </div>
          </SettingsSection>
        </div>

        {/* Billing Integrity */}
        <SettingsSection
          title="Billing Integrity Guard"
          description="Controls how the Guard handles validation severity thresholds"
        >
          <div className="space-y-4">
            <Select
              label="Integrity Strictness"
              value={form.integrityStrictness}
              onChange={(e) =>
                handleChange("integrityStrictness", e.target.value as SystemSettings["integrityStrictness"])
              }
              options={[
                { value: "Standard", label: "Standard — Block Critical, Warn on Warning" },
                { value: "Strict", label: "Strict — Block on Warning and Critical" },
                { value: "Lenient", label: "Lenient — Block on Critical only (ignore Warnings)" },
              ]}
              helperText="Strict mode blocks invoice generation even for Warning-level issues"
            />

            <div className="space-y-2">
              {[
                { mode: "Standard", desc: "Critical errors block invoice. Warnings shown but allow generation.", badge: "warning" as const },
                { mode: "Strict", desc: "Both Critical and Warning block invoice generation entirely.", badge: "critical" as const },
                { mode: "Lenient", desc: "Only Critical errors block. Warnings are surfaced as informational only.", badge: "passed" as const },
              ].map((opt) => (
                <div
                  key={opt.mode}
                  className={`p-3 rounded-lg border text-xs transition-all cursor-pointer ${
                    form.integrityStrictness === opt.mode
                      ? "bg-gold/5 border-gold/30"
                      : "bg-surface-muted border-border opacity-60"
                  }`}
                  onClick={() => handleChange("integrityStrictness", opt.mode)}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={opt.badge}>{opt.mode}</Badge>
                    {form.integrityStrictness === opt.mode && (
                      <span className="text-gold font-bold text-[10px] uppercase tracking-wider">Active</span>
                    )}
                  </div>
                  <p className="text-charcoal-soft">{opt.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </SettingsSection>

        {/* Danger Zone */}
        <SettingsSection
          title="Data Management"
          description="Reset application state for demo and testing purposes"
        >
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-integrity-critical-bg border border-integrity-critical-border">
              <h4 className="text-sm font-bold text-integrity-critical mb-1">Reset to Demo Data</h4>
              <p className="text-xs text-charcoal-soft leading-relaxed mb-3">
                Clears all customers, subscriptions, invoices, and payments from localStorage and
                restores the original mock data. This is irreversible. Use to reset the demo environment.
              </p>

              {!showResetConfirm ? (
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => setShowResetConfirm(true)}
                >
                  Reset to Mock Data
                </Button>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs font-bold text-integrity-critical">
                    ⚠ Are you sure? All data will be overwritten.
                  </p>
                  <div className="flex gap-2">
                    <Button variant="secondary" size="sm" onClick={() => setShowResetConfirm(false)}>
                      Cancel
                    </Button>
                    <Button variant="danger" size="sm" onClick={handleReset}>
                      Yes, Reset Everything
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <div className="p-3 rounded-lg bg-ivory-200 border border-border text-xs text-charcoal-soft leading-relaxed">
              <strong className="text-charcoal">Storage:</strong> All application state is stored in your
              browser&apos;s localStorage under the key{" "}
              <code className="font-mono bg-border px-1 py-0.5 rounded text-[10px]">subsync_app_state_v1</code>.
              No data is sent to any server.
            </div>
          </div>
        </SettingsSection>
      </div>

      {/* Save footer */}
      <div className="flex items-center justify-between p-4 rounded-xl bg-ivory-200 border border-border">
        <div>
          <div className="text-sm font-semibold text-charcoal">
            {isDirty ? "You have unsaved changes" : "All settings are up to date"}
          </div>
          <div className="text-xs text-charcoal-soft mt-0.5">
            Settings are applied immediately after saving and persist across sessions.
          </div>
        </div>
        <Button variant="gold" onClick={handleSave} disabled={!isDirty}>
          {saved ? "✓ Saved" : "Save All Changes"}
        </Button>
      </div>
    </div>
  );
}
