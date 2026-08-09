"use client";

import { useState } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Scale, Table2 } from "lucide-react";
import { ActivityChart } from "@/components/dashboard/ActivityChart";
import { Card } from "@/components/dashboard/Card";
import { IconChip } from "@/components/dashboard/IconChip";
import { SectionHeader } from "@/components/dashboard/SectionHeader";
import {
  getMockAdvisorLoad,
  getMockAllocationPolicies,
  getMockEquityMetrics,
  getMockNoShowRateByLecturer,
  getMockPolicyComparison,
} from "@/lib/office-hours/mock-data";
import type { PolicyComparisonRow } from "@/lib/office-hours/types";
import { ACCENT_TOKENS } from "@/lib/ui/accent-palette";

const POLICY_LABELS: Record<PolicyComparisonRow["policyName"], string> = {
  FCFS: "FCFS",
  NEED: "Need-Based",
  ROUND_ROBIN: "Round Robin",
  HYBRID: "Hybrid",
};

// ---- Equity (Gini + Lorenz curve) -------------------------------------------

function GiniStat({ label, value }: { label: string; value: number }) {
  return (
    <Card className="flex items-center gap-3.5 p-4">
      <IconChip icon={Scale} tone={ACCENT_TOKENS.rose} />
      <div>
        <p className="text-xl font-bold text-[var(--ink-900)] tabular-nums leading-tight">{value.toFixed(2)}</p>
        <p className="text-[12.5px] text-[var(--ink-600)]">{label}</p>
      </div>
    </Card>
  );
}

function LorenzTooltip({ active, payload }: { active?: boolean; payload?: { payload?: { cumulativeStudentsPct: number; cumulativeSlotsPct: number } }[] }) {
  if (!active || !payload?.length) return null;
  const point = payload[0]?.payload;
  if (!point) return null;
  return (
    <div className="rounded-lg border border-[var(--paper-200)] bg-white px-3 py-2 shadow-lg">
      <p className="text-sm font-bold text-[var(--ink-900)] tabular-nums">
        {point.cumulativeStudentsPct}% of students hold {point.cumulativeSlotsPct}% of slots
      </p>
    </div>
  );
}

function EquitySection() {
  const [showTable, setShowTable] = useState(false);
  const metrics = getMockEquityMetrics();

  return (
    <div className="flex flex-col gap-4">
      <SectionHeader title="Equity" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <GiniStat label="Gini — slots per student" value={metrics.giniSlotsPerStudent} />
        <GiniStat label="Gini — lecturer access per student" value={metrics.giniLecturerAccess} />
      </div>

      <Card>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-[var(--ink-900)]">Lorenz curve — slots per student</h2>
            <p className="text-[12px] text-[var(--ink-500)] mt-0.5">Dashed line = perfect equality. The further the curve sags below it, the more unequal access is.</p>
          </div>
          <button
            type="button"
            onClick={() => setShowTable((v) => !v)}
            className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[var(--ink-500)] hover:text-[var(--brand-700)] transition-colors shrink-0"
          >
            <Table2 className="w-3.5 h-3.5" strokeWidth={2} />
            {showTable ? "View chart" : "View as table"}
          </button>
        </div>

        {showTable ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--paper-200)]">
                <th className="text-left py-2 text-[11px] font-bold uppercase tracking-wide text-[var(--ink-500)]">Cumulative students</th>
                <th className="text-right py-2 text-[11px] font-bold uppercase tracking-wide text-[var(--ink-500)]">Cumulative slots</th>
              </tr>
            </thead>
            <tbody>
              {metrics.lorenzCurve.map((p) => (
                <tr key={p.cumulativeStudentsPct} className="border-b border-[var(--paper-100)] last:border-0">
                  <td className="py-2 text-[var(--ink-800)] tabular-nums">{p.cumulativeStudentsPct}%</td>
                  <td className="py-2 text-right font-semibold text-[var(--ink-900)] tabular-nums">{p.cumulativeSlotsPct}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={metrics.lorenzCurve} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="var(--paper-200)" vertical={false} />
                <XAxis
                  dataKey="cumulativeStudentsPct"
                  type="number"
                  domain={[0, 100]}
                  tickFormatter={(v) => `${v}%`}
                  axisLine={{ stroke: "var(--paper-200)" }}
                  tickLine={false}
                  tick={{ fill: "var(--ink-500)", fontSize: 11, fontWeight: 600 }}
                />
                <YAxis
                  dataKey="cumulativeSlotsPct"
                  type="number"
                  domain={[0, 100]}
                  tickFormatter={(v) => `${v}%`}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "var(--ink-500)", fontSize: 11, fontWeight: 600 }}
                  width={40}
                />
                <Tooltip content={<LorenzTooltip />} />
                <Line
                  data={[{ cumulativeStudentsPct: 0, cumulativeSlotsPct: 0 }, { cumulativeStudentsPct: 100, cumulativeSlotsPct: 100 }]}
                  dataKey="cumulativeSlotsPct"
                  stroke="var(--ink-300)"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                  isAnimationActive={false}
                  legendType="none"
                />
                <Line
                  dataKey="cumulativeSlotsPct"
                  stroke="var(--rose-500)"
                  strokeWidth={2}
                  dot={{ r: 3, fill: "var(--rose-500)", strokeWidth: 0 }}
                  activeDot={{ r: 5 }}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>
    </div>
  );
}

// ---- Policy comparison (small multiples) ------------------------------------

function PolicyComparisonSection() {
  const rows = getMockPolicyComparison();
  const activePolicyName = getMockAllocationPolicies().find((p) => p.active)?.name;
  const activityRows = (metric: keyof Omit<PolicyComparisonRow, "policyName">) =>
    rows.map((r) => ({ key: r.policyName, label: POLICY_LABELS[r.policyName], value: r[metric] }));

  return (
    <div className="flex flex-col gap-4">
      <SectionHeader title="Policy comparison" href="/dashboard/admin/research" actionLabel="Open research tools" />
      <p className="text-[12.5px] text-[var(--ink-500)]">
        Active vs. alternative policies, side by side — four independent metrics, not one chart with mixed scales.
        Highlighted bar is the currently active policy.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ActivityChart
          title="Gini — slots per student"
          data={activityRows("giniSlotsPerStudent")}
          highlightKey={activePolicyName}
          accent="rose"
          valueLabel="Gini"
          formatValue={(v) => `Gini ${v.toFixed(2)}`}
        />
        <ActivityChart
          title="Gini — lecturer access"
          data={activityRows("giniLecturerAccess")}
          highlightKey={activePolicyName}
          accent="rose"
          valueLabel="Gini"
          formatValue={(v) => `Gini ${v.toFixed(2)}`}
        />
        <ActivityChart
          title="Slot utilization %"
          data={activityRows("utilizationPct")}
          highlightKey={activePolicyName}
          accent="mint"
          valueLabel="Utilization %"
          formatValue={(v) => `${v}% utilization`}
        />
        <ActivityChart
          title="Avg wait time (min)"
          data={activityRows("avgWaitMinutes")}
          highlightKey={activePolicyName}
          accent="coral"
          valueLabel="Avg wait (min)"
          formatValue={(v) => `${v} min avg wait`}
        />
      </div>
    </div>
  );
}

// ---- Page --------------------------------------------------------------------

export default function AdminAnalyticsPage() {
  const advisorLoad = getMockAdvisorLoad();
  const noShowRate = getMockNoShowRateByLecturer();

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold text-[var(--ink-900)] mb-1">Analytics</h1>
        <p className="text-sm text-[var(--ink-600)]">Advisor load, no-show rate, access equity, and policy comparison for the pilot semester.</p>
      </div>

      <div className="flex flex-col gap-4">
        <SectionHeader title="Advisor load this week" />
        <ActivityChart title="Bookings per lecturer" data={advisorLoad} accent="coral" />
      </div>

      <div className="flex flex-col gap-4">
        <SectionHeader title="No-show rate by lecturer" />
        {noShowRate.length === 0 ? (
          <Card className="text-center py-8">
            <p className="text-sm text-[var(--ink-500)]">Not enough closed bookings yet.</p>
          </Card>
        ) : (
          <ActivityChart
            title="No-show %"
            data={noShowRate}
            accent="brand"
            valueLabel="No-show %"
            formatValue={(v) => `${v}% no-show`}
          />
        )}
      </div>

      <EquitySection />

      <PolicyComparisonSection />
    </div>
  );
}
