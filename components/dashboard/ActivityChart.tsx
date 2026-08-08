"use client";

import { useState } from "react";
import { Bar, BarChart, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { Table2 } from "lucide-react";
import type { ActivityPoint } from "@/lib/office-hours/mock-data";
import { Card } from "./Card";

// "Highlight one bar, mute the rest" — one measure (bookings), one bar drawn
// out. The base/muted bars are a neutral surface tint, not a competing hue, so
// they're validated as a *lone* accent color (dataviz skill: "for a lone
// status/text color check WCAG text contrast"), not run through the
// categorical multi-hue CVD check — that check is for genuinely distinct
// categories, and penalizes a deliberately neutral bar for reading gray.
// `rose-500` passes contrast standalone; `coral-500`/`mint-500` WARN (same as
// the original brand-500 build) — resolved the same way: a direct label on
// the highlighted bar + a border stroke + the always-available table view,
// never color alone. See docs/DESIGN.md §1.2 / DASHBOARD-UPGRADE.md Phase 6.
export type ChartAccent = "coral" | "rose" | "mint" | "brand";

const BASE_FILL = "var(--paper-200)";
const BASE_STROKE = "var(--ink-300)";

const ACCENT_TONES: Record<ChartAccent, { fill: string; stroke: string; label: string }> = {
  coral: { fill: "var(--coral-500)", stroke: "var(--coral-600)", label: "var(--coral-700)" },
  rose: { fill: "var(--rose-500)", stroke: "var(--rose-600)", label: "var(--rose-700)" },
  mint: { fill: "var(--mint-500)", stroke: "var(--mint-600)", label: "var(--mint-700)" },
  brand: { fill: "var(--brand-500)", stroke: "var(--brand-600)", label: "var(--brand-700)" },
};

const defaultFormatValue = (value: number) => `${value} booking${value === 1 ? "" : "s"}`;

function ChartTooltip({
  active,
  payload,
  label,
  formatValue,
}: {
  active?: boolean;
  payload?: { value?: number }[];
  label?: string;
  formatValue: (value: number) => string;
}) {
  if (!active || !payload?.length) return null;
  const value = payload[0]?.value ?? 0;
  return (
    <div className="rounded-lg border border-[var(--paper-200)] bg-white px-3 py-2 shadow-lg">
      <p className="text-[11px] font-bold uppercase tracking-wide text-[var(--ink-500)] mb-0.5">{label}</p>
      <p className="text-sm font-bold text-[var(--ink-900)] tabular-nums">{formatValue(value)}</p>
    </div>
  );
}

export function ActivityChart({
  title,
  data,
  highlightKey,
  accent = "brand",
  valueLabel = "Bookings",
  formatValue = defaultFormatValue,
}: {
  title: string;
  data: ActivityPoint[];
  highlightKey?: string;
  accent?: ChartAccent;
  // Table-view column header — default matches every pre-existing caller
  // (booking activity, advisor load), both of which are literally booking
  // counts. Non-booking metrics (Gini, %, minutes) must pass both this and
  // formatValue so the tooltip/table don't mislabel the unit.
  valueLabel?: string;
  formatValue?: (value: number) => string;
}) {
  const [showTable, setShowTable] = useState(false);
  const tone = ACCENT_TONES[accent];

  if (data.length === 0) {
    return (
      <Card className="text-center py-8">
        <p className="text-sm text-[var(--ink-500)]">No activity yet.</p>
      </Card>
    );
  }

  const busiest = data.reduce((max, point) => (point.value > max.value ? point : max), data[0]);
  const highlighted = highlightKey ?? busiest.key;

  // recharts injects x/y/width/value/index at runtime via the viewBox, but its
  // exported LabelContentType is statically typed as the base SVG text props
  // (no index signature) — `any` here matches recharts' own custom-label
  // examples, since no concrete param type is both accurate and assignable.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function renderHighlightLabel(props: any) {
    const x = Number(props.x ?? 0);
    const y = Number(props.y ?? 0);
    const width = Number(props.width ?? 0);
    const index = props.index as number | undefined;
    if (data[index ?? -1]?.key !== highlighted) return null;
    return (
      <text x={x + width / 2} y={y - 6} textAnchor="middle" fontSize={11} fontWeight={700} fill={tone.label}>
        {props.value}
      </text>
    );
  }

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-bold text-[var(--ink-900)]">{title}</h2>
        <button
          type="button"
          onClick={() => setShowTable((v) => !v)}
          className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-[var(--ink-500)] hover:text-[var(--brand-700)] transition-colors"
        >
          <Table2 className="w-3.5 h-3.5" strokeWidth={2} />
          {showTable ? "View chart" : "View as table"}
        </button>
      </div>

      {showTable ? (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--paper-200)]">
              <th className="text-left py-2 text-[11px] font-bold uppercase tracking-wide text-[var(--ink-500)]">
                Label
              </th>
              <th className="text-right py-2 text-[11px] font-bold uppercase tracking-wide text-[var(--ink-500)]">
                {valueLabel}
              </th>
            </tr>
          </thead>
          <tbody>
            {data.map((point) => (
              <tr key={point.key} className="border-b border-[var(--paper-100)] last:border-0">
                <td className="py-2 text-[var(--ink-800)]">{point.label}</td>
                <td className="py-2 text-right font-semibold text-[var(--ink-900)] tabular-nums">{point.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="h-[180px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} barCategoryGap="28%" margin={{ top: 22, right: 4, left: 4, bottom: 0 }}>
              <XAxis
                dataKey="label"
                axisLine={{ stroke: "var(--paper-200)" }}
                tickLine={false}
                tick={{ fill: "var(--ink-500)", fontSize: 11, fontWeight: 600 }}
              />
              <Tooltip content={<ChartTooltip formatValue={formatValue} />} cursor={{ fill: "var(--paper-100)" }} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={36}>
                <LabelList dataKey="value" content={renderHighlightLabel} />
                {data.map((point) => (
                  <Cell
                    key={point.key}
                    fill={point.key === highlighted ? tone.fill : BASE_FILL}
                    stroke={point.key === highlighted ? tone.stroke : BASE_STROKE}
                    strokeWidth={1}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
}
