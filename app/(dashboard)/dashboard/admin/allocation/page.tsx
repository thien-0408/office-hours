"use client";

import { useState } from "react";
import { CheckCircle2, ShieldAlert, Trash2, UserCog } from "lucide-react";
import { ConfirmModal } from "@/components/ConfirmModal";
import { Card } from "@/components/dashboard/Card";
import { FilterTabs } from "@/components/dashboard/FilterTabs";
import { FormField, TextInput } from "@/components/dashboard/FormField";
import { SectionHeader } from "@/components/dashboard/SectionHeader";
import { useAuth } from "@/lib/auth/auth-context";
import { getMockAllocationEvents, getMockAllocationPolicies } from "@/lib/office-hours/mock-data";
import type { AllocationDecision, AllocationEvent, AllocationPolicy, AllocationPolicyName } from "@/lib/office-hours/types";
import { HUE_TOKENS } from "@/lib/ui/status-hues";

type Tab = "POLICIES" | "EVENTS";

const POLICY_LABELS: Record<AllocationPolicyName, string> = {
  FCFS: "First Come, First Served",
  NEED: "Need-Based",
  ROUND_ROBIN: "Round Robin",
  HYBRID: "Hybrid",
};

const WEIGHT_FIELDS: Record<AllocationPolicyName, { key: string; label: string }[]> = {
  FCFS: [],
  ROUND_ROBIN: [],
  NEED: [{ key: "needWeight", label: "Need weight" }],
  HYBRID: [
    { key: "needWeight", label: "Need weight" },
    { key: "waitTimeWeight", label: "Wait-time weight" },
    { key: "fairnessWeight", label: "Fairness weight" },
  ],
};

const dateTimeFormatter = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" });

// ---- Policies tab -----------------------------------------------------------

function PolicyCard({ policy, onActivate, onDelete }: { policy: AllocationPolicy; onActivate: () => void; onDelete: () => void }) {
  const weights = Object.entries(policy.config);
  return (
    <Card className="flex items-start justify-between gap-3">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <p className="font-semibold text-[var(--ink-900)]">{POLICY_LABELS[policy.name]}</p>
          {policy.active && (
            <span className="px-2.5 py-1 rounded-full text-[11.5px] font-semibold bg-[var(--success-100)] text-[var(--success-700)]">
              Active
            </span>
          )}
        </div>
        {weights.length === 0 ? (
          <p className="text-[13px] text-[var(--ink-500)]">No tunable weights.</p>
        ) : (
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
            {weights.map(([key, value]) => (
              <span key={key} className="text-[13px] text-[var(--ink-600)] tabular-nums">
                {WEIGHT_FIELDS[policy.name].find((f) => f.key === key)?.label ?? key}: <strong className="text-[var(--ink-900)]">{value}</strong>
              </span>
            ))}
          </div>
        )}
      </div>
      <div className="flex items-center gap-1 shrink-0">
        {!policy.active && (
          <button
            type="button"
            onClick={onActivate}
            title="Activate"
            className="flex items-center justify-center w-8 h-8 rounded-full text-[var(--ink-500)] hover:bg-[var(--success-100)] hover:text-[var(--success-700)] transition-colors"
          >
            <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={2} />
          </button>
        )}
        <button
          type="button"
          onClick={onDelete}
          title="Delete"
          className="flex items-center justify-center w-8 h-8 rounded-full text-[var(--ink-500)] hover:bg-[var(--danger-100)] hover:text-[var(--danger-700)] transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" strokeWidth={2} />
        </button>
      </div>
    </Card>
  );
}

function PoliciesTab({ policies, setPolicies }: { policies: AllocationPolicy[]; setPolicies: React.Dispatch<React.SetStateAction<AllocationPolicy[]>> }) {
  const [name, setName] = useState<AllocationPolicyName>("HYBRID");
  const [weights, setWeights] = useState<Record<string, string>>({ needWeight: "0.5", waitTimeWeight: "0.3", fairnessWeight: "0.2" });
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);

  const fields = WEIGHT_FIELDS[name];

  function handleNameChange(next: AllocationPolicyName) {
    setName(next);
    setWeights(Object.fromEntries(WEIGHT_FIELDS[next].map((f) => [f.key, ""])));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const nextId = policies.length === 0 ? 1 : Math.max(...policies.map((p) => p.id)) + 1;
    const config = Object.fromEntries(
      fields.map((f) => [f.key, Number(weights[f.key]) || 0]).filter(([, v]) => (v as number) > 0)
    );
    setPolicies((list) => [...list, { id: nextId, name, config, active: false }]);
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <SectionHeader title="Register a policy" />
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <FormField label="Policy type">
            <select
              value={name}
              onChange={(e) => handleNameChange(e.target.value as AllocationPolicyName)}
              className="w-full rounded-xl border border-[var(--paper-200)] bg-white px-3.5 py-2.5 text-sm text-[var(--ink-900)] outline-none focus:ring-2 focus:ring-[var(--brand-300)]"
            >
              {(Object.keys(POLICY_LABELS) as AllocationPolicyName[]).map((n) => (
                <option key={n} value={n}>
                  {POLICY_LABELS[n]}
                </option>
              ))}
            </select>
          </FormField>

          {fields.length > 0 && (
            <div className="flex flex-wrap gap-4">
              {fields.map((f) => (
                <FormField key={f.key} label={f.label}>
                  <TextInput
                    type="number"
                    step="0.1"
                    min="0"
                    max="1"
                    value={weights[f.key] ?? ""}
                    onChange={(e) => setWeights((w) => ({ ...w, [f.key]: e.target.value }))}
                    className="w-28"
                  />
                </FormField>
              ))}
            </div>
          )}

          <button
            type="submit"
            className="px-4 py-2.5 rounded-xl bg-[var(--brand-500)] text-white text-sm font-bold hover:bg-[var(--brand-600)] transition-colors w-fit"
          >
            Register policy
          </button>
        </form>
      </Card>

      <div>
        <SectionHeader title="Policies" />
        <div className="flex flex-col gap-3">
          {policies.map((p) => (
            <PolicyCard
              key={p.id}
              policy={p}
              onActivate={() => setPolicies((list) => list.map((row) => ({ ...row, active: row.id === p.id })))}
              onDelete={() => setPendingDeleteId(p.id)}
            />
          ))}
        </div>
      </div>

      <ConfirmModal
        open={pendingDeleteId !== null}
        icon={ShieldAlert}
        title="Delete this policy?"
        description="Past allocation events that ran under it stay in the audit log — this only removes it from future selection."
        confirmLabel="Delete policy"
        cancelLabel="Never mind"
        onCancel={() => setPendingDeleteId(null)}
        onConfirm={() => {
          setPolicies((list) => list.filter((p) => p.id !== pendingDeleteId));
          setPendingDeleteId(null);
        }}
      />
    </div>
  );
}

// ---- Events tab (+ Manual Override) -----------------------------------------

type DecisionFilter = AllocationDecision | "ALL";

function DecisionPill({ decision }: { decision: AllocationDecision }) {
  const hue = decision === "SELECTED" ? HUE_TOKENS.success : decision === "OVERRIDDEN" ? HUE_TOKENS.warning : HUE_TOKENS.neutral;
  const label = decision === "SELECTED" ? "Selected" : decision === "OVERRIDDEN" ? "Overridden" : "Skipped";
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11.5px] font-semibold whitespace-nowrap"
      style={{ background: hue.bg, color: hue.text }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: hue.dot }} />
      {label}
    </span>
  );
}

function OverrideForm({ onSubmit, onCancel }: { onSubmit: (slotLabel: string, studentName: string, reason: string) => void; onCancel: () => void }) {
  const [slotLabel, setSlotLabel] = useState("");
  const [studentName, setStudentName] = useState("");
  const [reason, setReason] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!slotLabel.trim() || !studentName.trim() || !reason.trim()) return;
    onSubmit(slotLabel.trim(), studentName.trim(), reason.trim());
  }

  return (
    <Card>
      <SectionHeader title="New manual override" />
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-4">
          <FormField label="Slot">
            <TextInput value={slotLabel} onChange={(e) => setSlotLabel(e.target.value)} placeholder="e.g. Dr. Amara Chen — Tue 10:00" className="w-64" />
          </FormField>
          <FormField label="Student">
            <TextInput value={studentName} onChange={(e) => setStudentName(e.target.value)} placeholder="Student name" className="w-56" />
          </FormField>
        </div>
        <FormField label="Reason">
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Why is this being assigned manually instead of by the active policy?"
            rows={2}
            className="w-full rounded-xl border border-[var(--paper-200)] bg-white px-3.5 py-2.5 text-sm text-[var(--ink-900)] outline-none focus:ring-2 focus:ring-[var(--brand-300)] resize-none"
          />
        </FormField>
        <div className="flex items-center gap-3">
          <button type="submit" className="px-4 py-2.5 rounded-xl bg-[var(--brand-500)] text-white text-sm font-bold hover:bg-[var(--brand-600)] transition-colors w-fit">
            Save override
          </button>
          <button type="button" onClick={onCancel} className="text-sm font-semibold text-[var(--ink-600)] hover:text-[var(--ink-900)]">
            Cancel
          </button>
        </div>
      </form>
    </Card>
  );
}

function EventsTab({ events, setEvents, policies }: { events: AllocationEvent[]; setEvents: React.Dispatch<React.SetStateAction<AllocationEvent[]>>; policies: AllocationPolicy[] }) {
  const { user } = useAuth();
  const [policyFilter, setPolicyFilter] = useState<AllocationPolicyName | "ALL">("ALL");
  const [decisionFilter, setDecisionFilter] = useState<DecisionFilter>("ALL");
  const [showOverrideForm, setShowOverrideForm] = useState(false);

  const filtered = events
    .filter((e) => policyFilter === "ALL" || e.policyName === policyFilter)
    .filter((e) => decisionFilter === "ALL" || e.decision === decisionFilter)
    .sort((a, b) => b.allocatedAt.localeCompare(a.allocatedAt));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row sm:items-end gap-3">
        <FormField label="Policy">
          <select
            value={policyFilter}
            onChange={(e) => setPolicyFilter(e.target.value as AllocationPolicyName | "ALL")}
            className="rounded-xl border border-[var(--paper-200)] bg-white px-3.5 py-2.5 text-sm text-[var(--ink-900)] outline-none focus:ring-2 focus:ring-[var(--brand-300)]"
          >
            <option value="ALL">All policies</option>
            {policies.map((p) => (
              <option key={p.id} value={p.name}>
                {POLICY_LABELS[p.name]}
              </option>
            ))}
          </select>
        </FormField>
        <FilterTabs
          options={[
            { value: "ALL" as DecisionFilter, label: "All" },
            { value: "SELECTED" as DecisionFilter, label: "Selected" },
            { value: "SKIPPED" as DecisionFilter, label: "Skipped" },
            { value: "OVERRIDDEN" as DecisionFilter, label: "Overridden" },
          ]}
          value={decisionFilter}
          onChange={setDecisionFilter}
        />
        <button
          type="button"
          onClick={() => setShowOverrideForm((v) => !v)}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[var(--brand-500)] text-white text-sm font-bold hover:bg-[var(--brand-600)] transition-colors sm:ml-auto"
        >
          <UserCog className="w-4 h-4" strokeWidth={2} />
          New override
        </button>
      </div>

      {showOverrideForm && (
        <OverrideForm
          onCancel={() => setShowOverrideForm(false)}
          onSubmit={(slotLabel, studentName, reason) => {
            const nextId = events.length === 0 ? 1 : Math.max(...events.map((e) => e.id)) + 1;
            setEvents((list) => [
              {
                id: nextId,
                slotLabel,
                studentName,
                decision: "OVERRIDDEN",
                policyName: null,
                computedScore: null,
                randomSeed: null,
                overriddenByName: user?.fullName ?? "Admin",
                overrideReason: reason,
                allocatedAt: new Date().toISOString(),
              },
              ...list,
            ]);
            setShowOverrideForm(false);
          }}
        />
      )}

      {filtered.length === 0 ? (
        <Card className="text-center py-10">
          <p className="text-sm text-[var(--ink-500)]">No events match those filters.</p>
        </Card>
      ) : (
        <Card className="p-0 overflow-hidden overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--paper-200)] text-left text-[11px] font-bold uppercase tracking-wide text-[var(--ink-500)]">
                <th className="px-5 py-3">Slot</th>
                <th className="px-5 py-3">Student</th>
                <th className="px-5 py-3">Decision</th>
                <th className="px-5 py-3">Detail</th>
                <th className="px-5 py-3">When</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((event) => (
                <tr key={event.id} className="border-b border-[var(--paper-100)] last:border-0 hover:bg-[var(--paper-50)] transition-colors align-top">
                  <td className="px-5 py-3.5 font-medium text-[var(--ink-900)] whitespace-nowrap">{event.slotLabel}</td>
                  <td className="px-5 py-3.5 text-[var(--ink-700)] whitespace-nowrap">{event.studentName}</td>
                  <td className="px-5 py-3.5">
                    <DecisionPill decision={event.decision} />
                  </td>
                  <td className="px-5 py-3.5 text-[var(--ink-600)] max-w-[280px]">
                    {event.decision === "OVERRIDDEN" ? (
                      <>
                        <p className="text-[12.5px]">
                          By <span className="font-semibold text-[var(--ink-900)]">{event.overriddenByName}</span>
                        </p>
                        <p className="text-[12.5px] mt-0.5">{event.overrideReason}</p>
                      </>
                    ) : (
                      <p className="text-[12.5px] tabular-nums">
                        {POLICY_LABELS[event.policyName as AllocationPolicyName]} · score {event.computedScore?.toFixed(2)} · seed {event.randomSeed}
                      </p>
                    )}
                  </td>
                  <td className="px-5 py-3.5 tabular-nums text-[var(--ink-600)] whitespace-nowrap">{dateTimeFormatter.format(new Date(event.allocatedAt))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}

// ---- Page --------------------------------------------------------------------

export default function AdminAllocationPage() {
  const [tab, setTab] = useState<Tab>("POLICIES");
  const [policies, setPolicies] = useState<AllocationPolicy[]>(() => getMockAllocationPolicies());
  const [events, setEvents] = useState<AllocationEvent[]>(() => getMockAllocationEvents());

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--ink-900)] mb-1">Allocation</h1>
        <p className="text-sm text-[var(--ink-600)]">Manage waitlist allocation policies and review the decision audit log.</p>
      </div>

      <FilterTabs
        options={[
          { value: "POLICIES" as Tab, label: "Policies" },
          { value: "EVENTS" as Tab, label: "Events" },
        ]}
        value={tab}
        onChange={setTab}
      />

      {tab === "POLICIES" ? (
        <PoliciesTab policies={policies} setPolicies={setPolicies} />
      ) : (
        <EventsTab events={events} setEvents={setEvents} policies={policies} />
      )}
    </div>
  );
}
