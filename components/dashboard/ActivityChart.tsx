"use client";

import { useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  LabelList,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Table2 } from "lucide-react";
import type { ActivityPoint } from "@/lib/office-hours/mock-data";
import { Card } from "./Card";
import { useI18n } from "@/i18n/provider";

// All chart styles keep one highlighted point and a neutral base so the accent
// remains meaningful instead of turning a single weekly measure into a rainbow.
export type ChartAccent = "coral" | "rose" | "mint" | "brand";
export type ChartStyle = "LOLLIPOP" | "RANKING" | "TREND";

// These are the exact neutral colors used by public/chart-style-previews.html.
// Ranking bars use brand-300; lollipop stems use brand-200; all neutral dots
// use brand-500. The highlighted value is supplied by the selected accent.
const BASE_FILL = "var(--brand-300)";
const BASE_STROKE = "var(--brand-300)";
const BASE_STEM = "var(--brand-200)";
const BASE_DOT = "var(--brand-500)";

const ACCENT_TONES: Record<ChartAccent, { fill: string; stroke: string; label: string; stem: string }> = {
  coral: { fill: "var(--coral-500)", stroke: "var(--coral-600)", label: "var(--coral-700)", stem: "var(--coral-100)" },
  // The preview uses this lighter rose stem even though rose-300 is not part
  // of the app ramp, so keep the same fallback value here.
  rose: { fill: "var(--rose-500)", stroke: "var(--rose-600)", label: "var(--rose-700)", stem: "var(--rose-300, #f9a8d4)" },
  mint: { fill: "var(--mint-500)", stroke: "var(--mint-600)", label: "var(--mint-700)", stem: "var(--mint-100)" },
  brand: { fill: "var(--brand-500)", stroke: "var(--brand-600)", label: "var(--brand-700)", stem: "var(--brand-200)" },
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
      <p className="mb-0.5 text-[11px] font-bold uppercase tracking-wide text-[var(--ink-500)]">{label}</p>
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
  variant = "standard",
}: {
  title: string;
  data: ActivityPoint[];
  highlightKey?: string;
  accent?: ChartAccent;
  valueLabel?: string;
  formatValue?: (value: number) => string;
  variant?: "standard" | "weeklyOverview";
}) {
  const { t } = useI18n();
  const [showTable, setShowTable] = useState(false);
  const [chartStyle, setChartStyle] = useState<ChartStyle>("LOLLIPOP");
  const tone = ACCENT_TONES[accent];
  const chartId = title.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
  const gradientId = `activity-chart-fill-${chartId}`;

  if (data.length === 0) {
    return (
      <Card className="py-8 text-center">
        <p className="text-sm text-[var(--ink-500)]">{t("chart.noActivity")}</p>
      </Card>
    );
  }

  const busiest = data.reduce((max, point) => (point.value > max.value ? point : max), data[0]);
  const highlighted = highlightKey ?? busiest.key;
  const weeklyTotal = data.reduce((sum, point) => sum + point.value, 0);
  const isWeeklyOverview = variant === "weeklyOverview";

  // Recharts injects x/y/width/value/index at runtime for custom labels.
  // `any` matches Recharts' custom-label examples because its exported base
  // SVG type does not include the runtime viewBox fields.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function renderBarLabel(props: any) {
    const x = Number(props.x ?? 0);
    const y = Number(props.y ?? 0);
    const width = Number(props.width ?? 0);
    const height = Number(props.height ?? 0);
    const index = props.index as number | undefined;
    if (data[index ?? -1]?.key !== highlighted) return null;

    if (chartStyle === "RANKING") {
      return (
        <text x={x + width + 7} y={y + height / 2 + 4} textAnchor="start" fontSize={11} fontWeight={700} fill={tone.label}>
          {props.value}
        </text>
      );
    }

    return (
      <text x={x + width / 2} y={y - 6} textAnchor="middle" fontSize={11} fontWeight={700} fill={tone.label}>
        {props.value}
      </text>
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function renderLollipopDot(props: any) {
    const index = props.index as number | undefined;
    const isHighlighted = data[index ?? -1]?.key === highlighted;
    return (
      <g>
        <circle
          cx={props.cx}
          cy={props.cy}
          r={isHighlighted ? 7 : 6}
          fill="none"
          stroke={isHighlighted ? tone.fill : BASE_DOT}
          strokeWidth={1}
        />
        <circle
          cx={props.cx}
          cy={props.cy}
          r={isHighlighted ? 5 : 4}
          fill={isHighlighted ? tone.fill : BASE_DOT}
          stroke="var(--paper-0)"
          strokeWidth={3}
        />
      </g>
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function renderTrendDot(props: any) {
    const index = props.index as number | undefined;
    const isHighlighted = data[index ?? -1]?.key === highlighted;
    return (
      <g>
        <circle
          cx={props.cx}
          cy={props.cy}
          r={isHighlighted ? 5.5 : 4}
          fill={isHighlighted ? tone.fill : "var(--paper-0)"}
          stroke={isHighlighted ? tone.fill : BASE_DOT}
          strokeWidth={2}
        />
        {isHighlighted && (
          <text x={props.cx} y={props.cy - 11} textAnchor="middle" fontSize={11} fontWeight={700} fill={tone.label}>
            {props.value}
          </text>
        )}
      </g>
    );
  }

  const chartOptions: { value: ChartStyle; label: string }[] = [
    { value: "LOLLIPOP", label: t("chart.lollipop") },
    { value: "RANKING", label: t("chart.ranking") },
    { value: "TREND", label: t("chart.trend") },
  ];

  function renderChart() {
    if (chartStyle === "RANKING") {
      return (
        <BarChart data={data} layout="vertical" margin={{ top: 8, right: 30, left: 8, bottom: 0 }} barCategoryGap="28%">
          <XAxis type="number" hide domain={[0, "auto"]} />
          <YAxis
            type="category"
            dataKey="label"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "var(--ink-500)", fontSize: 11, fontWeight: 600 }}
            width={38}
          />
          <Tooltip content={<ChartTooltip formatValue={formatValue} />} cursor={{ fill: "var(--paper-100)" }} />
          <Bar dataKey="value" radius={[0, 5, 5, 0]} maxBarSize={isWeeklyOverview ? 13 : 24}>
            <LabelList dataKey="value" content={renderBarLabel} />
            {data.map((point) => (
              <Cell
                key={point.key}
                fill={point.key === highlighted ? tone.fill : BASE_FILL}
                stroke={point.key === highlighted ? tone.fill : BASE_STROKE}
                strokeWidth={1}
              />
            ))}
          </Bar>
        </BarChart>
      );
    }

    if (chartStyle === "TREND") {
      return (
        <AreaChart data={data} margin={{ top: 22, right: 8, left: 4, bottom: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor={accent === "brand" || isWeeklyOverview ? "var(--brand-300)" : tone.fill} stopOpacity={0.45} />
              <stop offset="100%" stopColor={accent === "brand" || isWeeklyOverview ? "var(--brand-50)" : tone.fill} stopOpacity={0.15} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="var(--paper-100)" strokeDasharray="3 4" />
          <XAxis
            dataKey="label"
            axisLine={{ stroke: "var(--paper-200)" }}
            tickLine={false}
            tick={{ fill: "var(--ink-500)", fontSize: 11, fontWeight: 600 }}
          />
          <YAxis hide domain={[0, "auto"]} />
          <Tooltip content={<ChartTooltip formatValue={formatValue} />} cursor={{ stroke: tone.fill, strokeDasharray: "3 4" }} />
          <Area
            type="monotone"
            dataKey="value"
            stroke={accent === "brand" || isWeeklyOverview ? "var(--brand-500)" : tone.fill}
            strokeWidth={3}
            fill={`url(#${gradientId})`}
            dot={renderTrendDot}
            activeDot={{ r: 5 }}
            isAnimationActive={false}
          />
        </AreaChart>
      );
    }

    return (
      <ComposedChart data={data} barCategoryGap="28%" margin={{ top: 22, right: 4, left: 4, bottom: 0 }}>
        <XAxis
          dataKey="label"
          axisLine={{ stroke: "var(--paper-200)" }}
          tickLine={false}
          tick={{ fill: "var(--ink-500)", fontSize: 11, fontWeight: 600 }}
        />
        <YAxis hide domain={[0, "auto"]} />
        <Tooltip content={<ChartTooltip formatValue={formatValue} />} cursor={{ fill: "var(--paper-100)" }} />
        <Bar dataKey="value" barSize={isWeeklyOverview ? 3 : 2} maxBarSize={isWeeklyOverview ? 3 : 2} radius={[2, 2, 0, 0]}>
          <LabelList dataKey="value" content={renderBarLabel} />
          {data.map((point) => (
            <Cell
              key={point.key}
              fill={point.key === highlighted ? tone.stem : BASE_STEM}
              stroke={point.key === highlighted ? tone.stem : BASE_STEM}
              strokeWidth={1}
            />
          ))}
        </Bar>
        <Line dataKey="value" stroke="transparent" strokeWidth={0} dot={renderLollipopDot} activeDot={false} isAnimationActive={false} />
      </ComposedChart>
    );
  }

  return (
    <Card className={isWeeklyOverview ? "px-3 py-4 sm:px-6 sm:py-5" : ""}>
      <div className={`${isWeeklyOverview ? "mb-1" : "mb-4"} flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between`}>
        <h2 className="text-sm font-bold text-[var(--ink-900)]">{title}</h2>
        <div className="flex flex-wrap items-center gap-2">
          <label className="sr-only" htmlFor={`chart-style-${chartId}`}>
            {t("chart.style")}
          </label>
          <select
            id={`chart-style-${chartId}`}
            value={chartStyle}
            onChange={(event) => setChartStyle(event.target.value as ChartStyle)}
            className="h-8 max-w-[210px] rounded-lg border border-[var(--paper-200)] bg-white px-2.5 text-[11px] font-semibold text-[var(--ink-700)] outline-none transition-colors focus:border-[var(--brand-400)] focus:ring-2 focus:ring-[var(--brand-100)]"
          >
            {chartOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
          <button
            type="button"
            onClick={() => setShowTable((v) => !v)}
            className="inline-flex h-8 items-center gap-1.5 rounded-md text-[12px] font-semibold text-[var(--ink-500)] transition-colors hover:text-[var(--brand-700)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-500)]"
          >
            <Table2 className="h-3.5 w-3.5" strokeWidth={2} />
            {showTable ? t("chart.viewChart") : t("chart.viewTable")}
          </button>
        </div>
      </div>

      {isWeeklyOverview && !showTable && (
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 text-[11px] text-[var(--ink-500)]">
          <span>{t("chart.weeklyContext")}</span>
          <span>{t("chart.peak")} <strong className="font-bold text-[var(--rose-700)] tabular-nums">{busiest.value}</strong> · {busiest.label}</span>
        </div>
      )}

      {showTable ? (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--paper-200)]">
              <th className="py-2 text-left text-[11px] font-bold uppercase tracking-wide text-[var(--ink-500)]">{t("chart.label")}</th>
              <th className="py-2 text-right text-[11px] font-bold uppercase tracking-wide text-[var(--ink-500)]">{valueLabel}</th>
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
        <>
          <div className={isWeeklyOverview ? "mt-3 h-[220px] sm:h-[260px]" : "h-[180px]"}>
            <ResponsiveContainer width="100%" height="100%">
              {renderChart()}
            </ResponsiveContainer>
          </div>
          {isWeeklyOverview && (
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-[var(--paper-100)] pt-3 text-[11px] text-[var(--ink-500)]">
              <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-[var(--rose-500)]" aria-hidden="true" />{t("chart.busiestDay")} {busiest.label}</span>
              <span><strong className="font-bold text-[var(--ink-800)] tabular-nums">{weeklyTotal}</strong> {t("chart.weeklyTotal")}</span>
            </div>
          )}
        </>
      )}
    </Card>
  );
}
