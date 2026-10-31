"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { formatINR } from "@/lib/utils";

interface RevenueDataPoint {
  month: string;
  mrr: number;
  invoiced: number;
  isForecast?: boolean;
}

const mockRevenueHistory: RevenueDataPoint[] = [
  { month: "Jun 2026", mrr: 32400, invoiced: 35600 },
  { month: "Jul 2026", mrr: 45800, invoiced: 51200 },
  { month: "Aug 2026", mrr: 58200, invoiced: 63900 },
  { month: "Sep 2026", mrr: 72400, invoiced: 78100 },
  { month: "Oct 2026", mrr: 88740, invoiced: 92450 },
  { month: "Nov 2026", mrr: 104500, invoiced: 112000, isForecast: true },
];

export function RevenueChart() {
  const [metric, setMetric] = useState<"mrr" | "invoiced">("mrr");

  const values = mockRevenueHistory.map((d) => d[metric]);
  const maxValue = Math.max(...values) * 1.15;

  return (
    <Card className="flex flex-col justify-between">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <CardTitle>Revenue Trajectory & Forecasting</CardTitle>
          <CardDescription>
            Historical recurring revenue trends with predictive November pipeline
          </CardDescription>
        </div>
        <div className="flex items-center gap-1.5 p-1 bg-ivory-200 rounded-lg border border-border self-start sm:self-auto">
          <button
            onClick={() => setMetric("mrr")}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
              metric === "mrr"
                ? "bg-white text-charcoal shadow-xs font-semibold"
                : "text-charcoal-soft hover:text-charcoal"
            }`}
          >
            MRR Growth
          </button>
          <button
            onClick={() => setMetric("invoiced")}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
              metric === "invoiced"
                ? "bg-white text-charcoal shadow-xs font-semibold"
                : "text-charcoal-soft hover:text-charcoal"
            }`}
          >
            Invoiced Volume
          </button>
        </div>
      </CardHeader>

      <CardContent>
        {/* Visual Bar Graph */}
        <div className="pt-4 pb-2">
          <div className="h-56 flex items-end justify-between gap-2 sm:gap-6 border-b border-border/80 pb-2">
            {mockRevenueHistory.map((point) => {
              const currentVal = point[metric];
              const heightPercent = Math.round((currentVal / maxValue) * 100);

              return (
                <div key={point.month} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                  {/* Tooltip on hover */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity text-[11px] font-mono font-semibold bg-charcoal text-white px-2 py-0.5 rounded shadow-sm pointer-events-none whitespace-nowrap mb-1">
                    {formatINR(currentVal, { minimumFractionDigits: 0 })}
                  </div>

                  {/* Bar */}
                  <div className="w-full max-w-[48px] rounded-t-lg relative flex flex-col justify-end overflow-hidden bg-ivory-200 h-full">
                    <div
                      style={{ height: `${heightPercent}%` }}
                      className={`w-full rounded-t-lg transition-all duration-500 ease-out ${
                        point.isForecast
                          ? "bg-gradient-to-t from-gold-300 to-gold border-t-2 border-dashed border-charcoal/40"
                          : "bg-charcoal group-hover:bg-gold-600"
                      }`}
                    />
                  </div>

                  {/* Label */}
                  <div className="text-[11px] font-medium text-charcoal-soft mt-1 text-center whitespace-nowrap">
                    <span>{point.month.split(" ")[0]}</span>
                    {point.isForecast && (
                      <span className="block text-[9px] text-gold-700 font-semibold uppercase">
                        Forecast
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="mt-4 flex items-center justify-between text-xs text-charcoal-soft">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-charcoal inline-block" />
                <span>Actual Verified Billing</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-gold inline-block" />
                <span>Simulated Pipeline (Nov)</span>
              </div>
            </div>
            <span className="font-mono text-charcoal font-semibold text-[11px]">
              Currency: INR (₹)
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

