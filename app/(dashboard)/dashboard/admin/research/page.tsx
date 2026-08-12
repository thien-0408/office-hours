"use client";

import { useState } from "react";
import {
  Cell,
  LabelList,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";
import { Beaker, Download, FlaskConical, ShieldAlert, Table2, Trash2 } from "lucide-react";
import { ConfirmModal } from "@/components/ConfirmModal";
import { ActivityChart } from "@/components/dashboard/ActivityChart";
import { Card } from "@/components/dashboard/Card";
import { FilterTabs } from "@/components/dashboard/FilterTabs";
import { FormField, TextInput } from "@/components/dashboard/FormField";
import { IconChip } from "@/components/dashboard/IconChip";
import { SectionHeader } from "@/components/dashboard/SectionHeader";
import {
  computeExperimentResults,
  getMockAllocationPolicies,
  getMockExperiments,
  getMockSyntheticDemandRuns,
} from "@/lib/office-hours/mock-data";
import type {
  AllocationPolicyName,
  ArrivalPattern,
  Experiment,
  SyntheticDemandRun,
} from "@/lib/office-hours/types";
import { ACCENT_TOKENS } from "@/lib/ui/accent-palette";

type Tab = "DEMAND" | "EXPERIMENTS";

const POLICY_LABELS: Record<AllocationPolicyName, string> = {
  FCFS: "First Come, First Served",
  NEED: "Need-Based",
  ROUND_ROBIN: "Round Robin",
  HYBRID: "Hybrid",
};

const ARRIVAL_PATTERN_LABELS: Record<ArrivalPattern, string> = {
  POISSON: "Poisson",
  BURST_BEFORE_DEADLINE: "Burst before deadline",
  UNIFORM: "Uniform",
};

const ALL_POLICIES: AllocationPolicyName[] = ["FCFS", "NEED", "ROUND_ROBIN", "HYBRID"];

const dateTimeFormatter = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" });

// ---- Demand tab --------------------------------------------------------------

function DemandRunForm({ onSubmit }: { onSubmit: (run: Omit<SyntheticDemandRun, "id" | "generatedAt">) => void }) {
  const [seed, setSeed] = useState("4821");
  const [popularitySkew, setPopularitySkew] = useState("1.2");
  const [arrivalPattern, setArrivalPattern] = useState<ArrivalPattern>("POISSON");
  const [numStudents, setNumStudents] = useState("200");
  const [numLecturers, setNumLecturers] = useState("15");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit({
      seed: Number(seed) || 0,
      popularitySkew: Number(popularitySkew) || 0,
      arrivalPattern,
      numStudents: Number(numStudents) || 0,
      numLecturers: Number(numLecturers) || 0,
    });
  }

  return (
    <Card>
      <SectionHeader title="Generate a synthetic demand stream" />
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-4">
          <FormField label="Seed">
            <TextInput type="number" value={seed} onChange={(e) => setSeed(e.target.value)} className="w-28" />
          </FormField>
          <FormField label="Popularity skew">
            <TextInput type="number" step="0.1" min="0" value={popularitySkew} onChange={(e) => setPopularitySkew(e.target.value)} className="w-28" />
          </FormField>
          <FormField label="Arrival pattern">
            <select
              value={arrivalPattern}
              onChange={(e) => setArrivalPattern(e.target.value as ArrivalPattern)}
              className="rounded-xl border border-[var(--paper-200)] bg-white px-3.5 py-2.5 text-sm text-[var(--ink-900)] outline-none focus:ring-2 focus:ring-[var(--brand-300)]"
            >
              {(Object.keys(ARRIVAL_PATTERN_LABELS) as ArrivalPattern[]).map((p) => (
                <option key={p} value={p}>
                  {ARRIVAL_PATTERN_LABELS[p]}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Students">
            <TextInput type="number" min="1" value={numStudents} onChange={(e) => setNumStudents(e.target.value)} className="w-28" />
          </FormField>
          <FormField label="Lecturers">
            <TextInput type="number" min="1" value={numLecturers} onChange={(e) => setNumLecturers(e.target.value)} className="w-28" />
          </FormField>
        </div>
        <button
          type="submit"
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[var(--brand-500)] text-white text-sm font-bold hover:bg-[var(--brand-600)] transition-colors w-fit"
        >
          <Beaker className="w-4 h-4" strokeWidth={2} />
          Generate demand stream
        </button>
      </form>
    </Card>
  );
}

function DemandRunCard({ run, onDelete }: { run: SyntheticDemandRun; onDelete: () => void }) {
  return (
    <Card className="flex items-start justify-between gap-3">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <p className="font-semibold text-[var(--ink-900)]">Run #{run.id}</p>
          <span className="px-2.5 py-1 rounded-full text-[11.5px] font-semibold bg-[var(--paper-100)] text-[var(--ink-600)]">
            {ARRIVAL_PATTERN_LABELS[run.arrivalPattern]}
          </span>
        </div>
        <p className="text-[13px] text-[var(--ink-600)] tabular-nums">
          seed {run.seed} · skew {run.popularitySkew.toFixed(1)} · {run.numStudents.toLocaleString()} students × {run.numLecturers.toLocaleString()} lecturers
        </p>
        <p className="text-[12px] text-[var(--ink-500)] mt-1 tabular-nums">Generated {dateTimeFormatter.format(new Date(run.generatedAt))}</p>
      </div>
      <button
        type="button"
        onClick={onDelete}
        title="Delete"
        className="flex items-center justify-center w-8 h-8 rounded-full text-[var(--ink-500)] hover:bg-[var(--danger-100)] hover:text-[var(--danger-700)] transition-colors shrink-0"
      >
        <Trash2 className="w-3.5 h-3.5" strokeWidth={2} />
      </button>
    </Card>
  );
}

function DemandTab({
  runs,
  setRuns,
}: {
  runs: SyntheticDemandRun[];
  setRuns: React.Dispatch<React.SetStateAction<SyntheticDemandRun[]>>;
}) {
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);

  return (
    <div className="flex flex-col gap-6">
      <DemandRunForm
        onSubmit={(input) => {
          const nextId = runs.length === 0 ? 1 : Math.max(...runs.map((r) => r.id)) + 1;
          setRuns((list) => [{ id: nextId, generatedAt: new Date().toISOString(), ...input }, ...list]);
        }}
      />

      <div>
        <SectionHeader title="Demand runs" />
        {runs.length === 0 ? (
          <Card className="text-center py-10">
            <p className="text-sm text-[var(--ink-500)]">No demand streams generated yet.</p>
          </Card>
        ) : (
          <div className="flex flex-col gap-3">
            {runs.map((run) => (
              <DemandRunCard key={run.id} run={run} onDelete={() => setPendingDeleteId(run.id)} />
            ))}
          </div>
        )}
      </div>

      <ConfirmModal
        open={pendingDeleteId !== null}
        icon={ShieldAlert}
        title="Delete this demand run?"
        description="Experiments that already replayed it keep their recorded results — this only removes it from future experiment setup."
        confirmLabel="Delete run"
        cancelLabel="Never mind"
        onCancel={() => setPendingDeleteId(null)}
        onConfirm={() => {
          setRuns((list) => list.filter((r) => r.id !== pendingDeleteId));
          setPendingDeleteId(null);
        }}
      />
    </div>
  );
}

// ---- Experiments tab ----------------------------------------------------------

function ExperimentForm({
  runs,
  onSubmit,
}: {
  runs: SyntheticDemandRun[];
  onSubmit: (demandRunId: number, policyNames: AllocationPolicyName[], seed: number) => void;
}) {
  const [demandRunId, setDemandRunId] = useState<number | null>(runs[0]?.id ?? null);
  const [policyNames, setPolicyNames] = useState<AllocationPolicyName[]>(ALL_POLICIES);
  const [seed, setSeed] = useState("1000");

  function togglePolicy(name: AllocationPolicyName) {
    setPolicyNames((list) => (list.includes(name) ? list.filter((p) => p !== name) : [...list, name]));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (demandRunId === null || policyNames.length === 0) return;
    onSubmit(demandRunId, policyNames, Number(seed) || 0);
  }

  if (runs.length === 0) {
    return (
      <Card className="text-center py-10">
        <p className="text-sm text-[var(--ink-500)]">Generate a demand run in the Demand tab first.</p>
      </Card>
    );
  }

  return (
    <Card>
      <SectionHeader title="Run an experiment" />
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-4">
          <FormField label="Demand run">
            <select
              value={demandRunId ?? ""}
              onChange={(e) => setDemandRunId(Number(e.target.value))}
              className="rounded-xl border border-[var(--paper-200)] bg-white px-3.5 py-2.5 text-sm text-[var(--ink-900)] outline-none focus:ring-2 focus:ring-[var(--brand-300)]"
            >
              {runs.map((r) => (
                <option key={r.id} value={r.id}>
                  Run #{r.id} — seed {r.seed}, {ARRIVAL_PATTERN_LABELS[r.arrivalPattern]}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Seed">
            <TextInput type="number" value={seed} onChange={(e) => setSeed(e.target.value)} className="w-28" />
          </FormField>
        </div>
        <FormField label="Policies to compare">
          <div className="flex flex-wrap gap-3">
            {ALL_POLICIES.map((name) => (
              <label key={name} className="inline-flex items-center gap-2 text-sm text-[var(--ink-700)] cursor-pointer">
                <input
                  type="checkbox"
                  checked={policyNames.includes(name)}
                  onChange={() => togglePolicy(name)}
                  className="accent-[var(--brand-500)]"
                />
                {POLICY_LABELS[name]}
              </label>
            ))}
          </div>
        </FormField>
        <button
          type="submit"
          disabled={policyNames.length === 0}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[var(--brand-500)] text-white text-sm font-bold hover:bg-[var(--brand-600)] transition-colors w-fit disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <FlaskConical className="w-4 h-4" strokeWidth={2} />
          Run experiment
        </button>
      </form>
    </Card>
  );
}

function ResultsTable({ experiment }: { experiment: Experiment }) {
  return (
    <Card className="p-0 overflow-hidden overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[var(--paper-200)] text-left text-[11px] font-bold uppercase tracking-wide text-[var(--ink-500)]">
            <th className="px-5 py-3">Policy</th>
            <th className="px-5 py-3 text-right">Gini (slots)</th>
            <th className="px-5 py-3 text-right">Gini (access)</th>
            <th className="px-5 py-3 text-right">Max-min ratio</th>
            <th className="px-5 py-3 text-right">% with a slot</th>
            <th className="px-5 py-3 text-right">Utilization</th>
            <th className="px-5 py-3 text-right">Time to fill</th>
            <th className="px-5 py-3 text-right">Rejection rate</th>
            <th className="px-5 py-3 text-right">Avg wait</th>
            <th className="px-5 py-3 text-right">Wait variance</th>
          </tr>
        </thead>
        <tbody>
          {experiment.results.map((r) => (
            <tr key={r.policyName} className="border-b border-[var(--paper-100)] last:border-0 hover:bg-[var(--paper-50)] transition-colors">
              <td className="px-5 py-3.5 font-medium text-[var(--ink-900)] whitespace-nowrap">{POLICY_LABELS[r.policyName]}</td>
              <td className="px-5 py-3.5 text-right tabular-nums text-[var(--ink-700)]">{r.giniSlotsPerStudent.toFixed(2)}</td>
              <td className="px-5 py-3.5 text-right tabular-nums text-[var(--ink-700)]">{r.giniLecturerAccess.toFixed(2)}</td>
              <td className="px-5 py-3.5 text-right tabular-nums text-[var(--ink-700)]">{r.maxMinRatio.toFixed(2)}</td>
              <td className="px-5 py-3.5 text-right tabular-nums text-[var(--ink-700)]">{r.pctStudentsWithSlot.toFixed(1)}%</td>
              <td className="px-5 py-3.5 text-right tabular-nums text-[var(--ink-700)]">{r.slotUtilizationPct}%</td>
              <td className="px-5 py-3.5 text-right tabular-nums text-[var(--ink-700)]">{r.avgTimeToFillSeconds}s</td>
              <td className="px-5 py-3.5 text-right tabular-nums text-[var(--ink-700)]">{r.offerRejectionRatePct.toFixed(1)}%</td>
              <td className="px-5 py-3.5 text-right tabular-nums text-[var(--ink-700)]">{r.avgWaitTimeSeconds}s</td>
              <td className="px-5 py-3.5 text-right tabular-nums text-[var(--ink-700)]">{r.waitTimeVariance}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}

// Fairness-vs-efficiency frontier (capstone-officehours-plan.md §11.4's
// stated deliverable) — a genuine 2-D scatter (utilization on X, Gini on Y),
// not a dual-axis combo chart layering two unrelated measures on one
// categorical X (the dataviz skill's #1 anti-pattern). Each policy is one
// labeled point; text labels carry identity, never color alone. Lower-right
// is the "frontier" — fairer (lower Gini) and more efficient (higher
// utilization) at once.
function FrontierTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload?: { policyName: AllocationPolicyName; slotUtilizationPct: number; giniSlotsPerStudent: number } }[];
}) {
  if (!active || !payload?.length) return null;
  const point = payload[0]?.payload;
  if (!point) return null;
  return (
    <div className="rounded-lg border border-[var(--paper-200)] bg-white px-3 py-2 shadow-lg">
      <p className="text-[11px] font-bold uppercase tracking-wide text-[var(--ink-500)] mb-0.5">{POLICY_LABELS[point.policyName]}</p>
      <p className="text-sm font-bold text-[var(--ink-900)] tabular-nums">
        {point.slotUtilizationPct}% utilization · Gini {point.giniSlotsPerStudent.toFixed(2)}
      </p>
    </div>
  );
}

function FrontierScatter({ experiment, activePolicyName }: { experiment: Experiment; activePolicyName?: AllocationPolicyName }) {
  const [showTable, setShowTable] = useState(false);
  const highlighted = activePolicyName ?? experiment.results[0]?.policyName;

  return (
    <Card>
      <div className="flex items-center justify-between mb-1">
        <div>
          <h2 className="text-sm font-bold text-[var(--ink-900)]">Fairness vs. efficiency frontier</h2>
          <p className="text-[12px] text-[var(--ink-500)] mt-0.5">Lower-right = fairer (lower Gini) and more efficient (higher utilization) at once.</p>
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
        <table className="w-full text-sm mt-3">
          <thead>
            <tr className="border-b border-[var(--paper-200)]">
              <th className="text-left py-2 text-[11px] font-bold uppercase tracking-wide text-[var(--ink-500)]">Policy</th>
              <th className="text-right py-2 text-[11px] font-bold uppercase tracking-wide text-[var(--ink-500)]">Utilization %</th>
              <th className="text-right py-2 text-[11px] font-bold uppercase tracking-wide text-[var(--ink-500)]">Gini (slots)</th>
            </tr>
          </thead>
          <tbody>
            {experiment.results.map((r) => (
              <tr key={r.policyName} className="border-b border-[var(--paper-100)] last:border-0">
                <td className="py-2 text-[var(--ink-800)]">{POLICY_LABELS[r.policyName]}</td>
                <td className="py-2 text-right tabular-nums text-[var(--ink-900)]">{r.slotUtilizationPct}%</td>
                <td className="py-2 text-right tabular-nums text-[var(--ink-900)]">{r.giniSlotsPerStudent.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="h-[280px] mt-3">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 24, left: 8, bottom: 8 }}>
              <XAxis
                dataKey="slotUtilizationPct"
                type="number"
                name="Utilization"
                unit="%"
                domain={["dataMin - 5", "dataMax + 5"]}
                axisLine={{ stroke: "var(--paper-200)" }}
                tickLine={false}
                tick={{ fill: "var(--ink-500)", fontSize: 11, fontWeight: 600 }}
                label={{ value: "Slot utilization %  (efficiency, higher is better)", position: "insideBottom", offset: -4, fontSize: 11, fill: "var(--ink-500)" }}
              />
              <YAxis
                dataKey="giniSlotsPerStudent"
                type="number"
                name="Gini"
                domain={["dataMin - 0.05", "dataMax + 0.05"]}
                axisLine={false}
                tickLine={false}
                tick={{ fill: "var(--ink-500)", fontSize: 11, fontWeight: 600 }}
                width={44}
                label={{ value: "Gini (fairness, lower is better)", angle: -90, position: "insideLeft", fontSize: 11, fill: "var(--ink-500)" }}
              />
              <ZAxis range={[160, 160]} />
              <Tooltip content={<FrontierTooltip />} cursor={{ strokeDasharray: "3 3", stroke: "var(--paper-200)" }} />
              <Scatter data={experiment.results} isAnimationActive={false}>
                <LabelList
                  dataKey="policyName"
                  position="top"
                  formatter={(v: unknown) => POLICY_LABELS[v as AllocationPolicyName] ?? String(v ?? "")}
                  style={{ fontSize: 11, fontWeight: 700, fill: "var(--ink-700)" }}
                />
                {experiment.results.map((r) => (
                  <Cell
                    key={r.policyName}
                    fill={r.policyName === highlighted ? "var(--rose-500)" : "var(--paper-200)"}
                    stroke={r.policyName === highlighted ? "var(--rose-600)" : "var(--ink-300)"}
                    strokeWidth={1.5}
                  />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
}

function exportExperiment(experiment: Experiment, format: "json" | "csv") {
  let blob: Blob;
  let filename: string;
  if (format === "json") {
    blob = new Blob([JSON.stringify(experiment, null, 2)], { type: "application/json" });
    filename = `experiment-${experiment.id}.json`;
  } else {
    const header = "policy,giniSlotsPerStudent,giniLecturerAccess,maxMinRatio,pctStudentsWithSlot,slotUtilizationPct,avgTimeToFillSeconds,offerRejectionRatePct,avgWaitTimeSeconds,waitTimeVariance";
    const rows = experiment.results.map((r) =>
      [r.policyName, r.giniSlotsPerStudent, r.giniLecturerAccess, r.maxMinRatio, r.pctStudentsWithSlot, r.slotUtilizationPct, r.avgTimeToFillSeconds, r.offerRejectionRatePct, r.avgWaitTimeSeconds, r.waitTimeVariance].join(",")
    );
    blob = new Blob([[header, ...rows].join("\n")], { type: "text/csv" });
    filename = `experiment-${experiment.id}.csv`;
  }
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function ExperimentCard({ experiment, selected, onSelect }: { experiment: Experiment; selected: boolean; onSelect: () => void }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`text-left rounded-2xl border p-4 transition-colors ${
        selected ? "border-[var(--brand-300)] bg-[var(--brand-50)]" : "border-[var(--paper-200)] bg-white hover:bg-[var(--paper-50)]"
      }`}
    >
      <p className="font-semibold text-[var(--ink-900)]">Experiment #{experiment.id}</p>
      <p className="text-[12.5px] text-[var(--ink-600)] mt-0.5 tabular-nums">
        Demand run #{experiment.demandRunId} · seed {experiment.seed} · {experiment.policyNames.length} polic{experiment.policyNames.length === 1 ? "y" : "ies"}
      </p>
      <p className="text-[12px] text-[var(--ink-500)] mt-1 tabular-nums">{dateTimeFormatter.format(new Date(experiment.runAt))}</p>
    </button>
  );
}

function ExperimentsTab({
  runs,
  experiments,
  setExperiments,
  activePolicyName,
}: {
  runs: SyntheticDemandRun[];
  experiments: Experiment[];
  setExperiments: React.Dispatch<React.SetStateAction<Experiment[]>>;
  activePolicyName?: AllocationPolicyName;
}) {
  const [selectedId, setSelectedId] = useState<number | null>(experiments[0]?.id ?? null);
  const selected = experiments.find((e) => e.id === selectedId) ?? null;

  function handleRun(demandRunId: number, policyNames: AllocationPolicyName[], seed: number) {
    const demandRun = runs.find((r) => r.id === demandRunId);
    if (!demandRun) return;
    const nextId = experiments.length === 0 ? 1 : Math.max(...experiments.map((e) => e.id)) + 1;
    const experiment: Experiment = {
      id: nextId,
      demandRunId,
      seed,
      policyNames,
      results: computeExperimentResults(demandRun, policyNames, seed),
      runAt: new Date().toISOString(),
    };
    setExperiments((list) => [experiment, ...list]);
    setSelectedId(nextId);
  }

  return (
    <div className="flex flex-col gap-6">
      <ExperimentForm runs={runs} onSubmit={handleRun} />

      {selected && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <SectionHeader title={`Results — experiment #${selected.id}`} />
            <div className="flex items-center gap-2 -mt-3">
              <button
                type="button"
                onClick={() => exportExperiment(selected, "json")}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[var(--paper-200)] bg-white text-[12.5px] font-semibold text-[var(--ink-700)] hover:bg-[var(--paper-50)] transition-colors"
              >
                <Download className="w-3.5 h-3.5" strokeWidth={2} />
                Export JSON
              </button>
              <button
                type="button"
                onClick={() => exportExperiment(selected, "csv")}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[var(--paper-200)] bg-white text-[12.5px] font-semibold text-[var(--ink-700)] hover:bg-[var(--paper-50)] transition-colors"
              >
                <Download className="w-3.5 h-3.5" strokeWidth={2} />
                Export CSV
              </button>
            </div>
          </div>

          <ResultsTable experiment={selected} />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ActivityChart
              title="Gini — slots per student"
              data={selected.results.map((r) => ({ key: r.policyName, label: POLICY_LABELS[r.policyName], value: r.giniSlotsPerStudent }))}
              highlightKey={activePolicyName}
              accent="rose"
              valueLabel="Gini"
              formatValue={(v) => `Gini ${v.toFixed(2)}`}
            />
            <ActivityChart
              title="Slot utilization %"
              data={selected.results.map((r) => ({ key: r.policyName, label: POLICY_LABELS[r.policyName], value: r.slotUtilizationPct }))}
              highlightKey={activePolicyName}
              accent="mint"
              valueLabel="Utilization %"
              formatValue={(v) => `${v}% utilization`}
            />
          </div>

          <FrontierScatter experiment={selected} activePolicyName={activePolicyName} />
        </div>
      )}

      <div>
        <SectionHeader title="Past experiments" />
        {experiments.length === 0 ? (
          <Card className="text-center py-10">
            <p className="text-sm text-[var(--ink-500)]">No experiments run yet.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {experiments.map((exp) => (
              <ExperimentCard key={exp.id} experiment={exp} selected={exp.id === selectedId} onSelect={() => setSelectedId(exp.id)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ---- Page --------------------------------------------------------------------

export default function AdminResearchPage() {
  const [tab, setTab] = useState<Tab>("DEMAND");
  const [runs, setRuns] = useState<SyntheticDemandRun[]>(() => getMockSyntheticDemandRuns());
  const [experiments, setExperiments] = useState<Experiment[]>(() => getMockExperiments());
  const activePolicyName = getMockAllocationPolicies().find((p) => p.active)?.name;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--ink-900)] mb-1">Research tools</h1>
        <p className="text-sm text-[var(--ink-600)]">
          Generate synthetic demand streams and replay them through allocation policies — the §11 fairness study&apos;s experiment console.
        </p>
      </div>

      <Card className="flex items-start gap-3 bg-[var(--paper-50)]">
        <IconChip icon={FlaskConical} tone={ACCENT_TOKENS.rose} />
        <p className="text-[12.5px] text-[var(--ink-600)] leading-relaxed">
          Research console — runs the real allocate() engine (FCFS/NEED/ROUND_ROBIN/HYBRID) against a bounded, seeded synthetic population,
          deterministic given a seed (the same seed always reproduces the same metrics, per NFR-3). The population size and event count are
          capped for client-side performance, so treat these as a demo-scale proof of the methodology, not the full-scale server-side study
          the pilot&apos;s real experiments would run. Dev/research tooling exposed here alongside the rest of the admin console for discoverability.
        </p>
      </Card>

      <FilterTabs
        options={[
          { value: "DEMAND" as Tab, label: "Demand" },
          { value: "EXPERIMENTS" as Tab, label: "Experiments" },
        ]}
        value={tab}
        onChange={setTab}
      />

      {tab === "DEMAND" ? (
        <DemandTab runs={runs} setRuns={setRuns} />
      ) : (
        <ExperimentsTab runs={runs} experiments={experiments} setExperiments={setExperiments} activePolicyName={activePolicyName} />
      )}
    </div>
  );
}
