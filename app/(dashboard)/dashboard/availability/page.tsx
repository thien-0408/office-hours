"use client";

import { useState } from "react";
import { CalendarOff, CalendarPlus, Pencil, ShieldAlert, Trash2, Users2 } from "lucide-react";
import { ConfirmModal } from "@/components/ConfirmModal";
import { Card } from "@/components/dashboard/Card";
import { FilterTabs } from "@/components/dashboard/FilterTabs";
import { FormField, TextInput } from "@/components/dashboard/FormField";
import { SectionHeader } from "@/components/dashboard/SectionHeader";
import { StatTile } from "@/components/dashboard/StatTile";
import {
  getMockAvailabilityExceptions,
  getMockAvailabilityRules,
  getMockSlotWaitlistGroups,
} from "@/lib/office-hours/mock-data";
import type { AvailabilityException, AvailabilityRule, ExceptionType } from "@/lib/office-hours/types";
import { ACCENT_TOKENS } from "@/lib/ui/accent-palette";
import { HUE_TOKENS } from "@/lib/ui/status-hues";

// Mon-Fri only — matches RecurringBookingClient's DAY_OPTIONS convention
// (office hours don't run on weekends in this dataset).
const DAY_OPTIONS = [
  { value: "1", label: "Mon" },
  { value: "2", label: "Tue" },
  { value: "3", label: "Wed" },
  { value: "4", label: "Thu" },
  { value: "5", label: "Fri" },
];

const DAY_LABEL_LONG: Record<number, string> = {
  1: "Monday",
  2: "Tuesday",
  3: "Wednesday",
  4: "Thursday",
  5: "Friday",
};

const SLOT_LENGTH_OPTIONS = [15, 30, 45, 60];

const dateFormatter = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" });

function formatDate(iso: string): string {
  // Avoid UTC-shift-by-a-day on plain "YYYY-MM-DD" strings.
  return dateFormatter.format(new Date(`${iso}T00:00:00`));
}

type Tab = "RULES" | "EXCEPTIONS" | "WAITLIST";

// ---- Rules tab ----------------------------------------------------------

interface RuleFormState {
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  slotLengthMinutes: number;
  effectiveFrom: string;
  effectiveTo: string;
}

const EMPTY_RULE_FORM: RuleFormState = {
  dayOfWeek: "1",
  startTime: "09:00",
  endTime: "11:00",
  slotLengthMinutes: 30,
  effectiveFrom: new Date().toISOString().slice(0, 10),
  effectiveTo: "",
};

function RuleCard({
  rule,
  onEdit,
  onDelete,
}: {
  rule: AvailabilityRule;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <Card className="flex items-start justify-between gap-3">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <p className="font-semibold text-[var(--ink-900)]">{DAY_LABEL_LONG[rule.dayOfWeek]}</p>
          {!rule.active && (
            <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[var(--paper-100)] text-[var(--ink-500)]">
              Inactive
            </span>
          )}
        </div>
        <p className="text-[13px] text-[var(--ink-600)] tabular-nums">
          {rule.startTime}–{rule.endTime} · {rule.slotLengthMinutes} min slots
        </p>
        <p className="text-[12px] text-[var(--ink-500)] tabular-nums mt-0.5">
          From {formatDate(rule.effectiveFrom)}
          {rule.effectiveTo ? ` to ${formatDate(rule.effectiveTo)}` : " · ongoing"}
        </p>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <button
          type="button"
          onClick={onEdit}
          aria-label="Edit rule"
          className="flex items-center justify-center w-8 h-8 rounded-full text-[var(--ink-500)] hover:bg-[var(--brand-50)] hover:text-[var(--brand-700)] transition-colors"
        >
          <Pencil className="w-3.5 h-3.5" strokeWidth={2} />
        </button>
        <button
          type="button"
          onClick={onDelete}
          aria-label="Delete rule"
          className="flex items-center justify-center w-8 h-8 rounded-full text-[var(--ink-500)] hover:bg-[var(--danger-100)] hover:text-[var(--danger-700)] transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" strokeWidth={2} />
        </button>
      </div>
    </Card>
  );
}

function RulesTab({
  rules,
  setRules,
}: {
  rules: AvailabilityRule[];
  setRules: React.Dispatch<React.SetStateAction<AvailabilityRule[]>>;
}) {
  const [form, setForm] = useState<RuleFormState>(EMPTY_RULE_FORM);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);

  const sorted = [...rules].sort((a, b) => a.dayOfWeek - b.dayOfWeek);

  function startEdit(rule: AvailabilityRule) {
    setEditingId(rule.id);
    setForm({
      dayOfWeek: String(rule.dayOfWeek),
      startTime: rule.startTime,
      endTime: rule.endTime,
      slotLengthMinutes: rule.slotLengthMinutes,
      effectiveFrom: rule.effectiveFrom,
      effectiveTo: rule.effectiveTo ?? "",
    });
  }

  function resetForm() {
    setEditingId(null);
    setForm(EMPTY_RULE_FORM);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload: Omit<AvailabilityRule, "id" | "active"> = {
      dayOfWeek: Number(form.dayOfWeek),
      startTime: form.startTime,
      endTime: form.endTime,
      slotLengthMinutes: form.slotLengthMinutes,
      effectiveFrom: form.effectiveFrom,
      effectiveTo: form.effectiveTo || null,
    };

    if (editingId !== null) {
      setRules((list) => list.map((r) => (r.id === editingId ? { ...r, ...payload } : r)));
    } else {
      const nextId = rules.length === 0 ? 1 : Math.max(...rules.map((r) => r.id)) + 1;
      setRules((list) => [...list, { id: nextId, active: true, ...payload }]);
    }
    resetForm();
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <SectionHeader title={editingId !== null ? "Edit rule" : "Add a rule"} />
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <span className="text-[12.5px] font-semibold text-[var(--ink-700)]">Day of week</span>
            <FilterTabs options={DAY_OPTIONS} value={form.dayOfWeek} onChange={(v) => setForm((f) => ({ ...f, dayOfWeek: v }))} />
          </div>

          <div className="flex flex-wrap gap-4">
            <FormField label="Start time">
              <TextInput type="time" value={form.startTime} onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))} />
            </FormField>
            <FormField label="End time">
              <TextInput type="time" value={form.endTime} onChange={(e) => setForm((f) => ({ ...f, endTime: e.target.value }))} />
            </FormField>
            <FormField label="Slot length">
              <select
                value={form.slotLengthMinutes}
                onChange={(e) => setForm((f) => ({ ...f, slotLengthMinutes: Number(e.target.value) }))}
                className="w-full rounded-xl border border-[var(--paper-200)] bg-white px-3.5 py-2.5 text-sm text-[var(--ink-900)] outline-none focus:ring-2 focus:ring-[var(--brand-300)]"
              >
                {SLOT_LENGTH_OPTIONS.map((m) => (
                  <option key={m} value={m}>
                    {m} min
                  </option>
                ))}
              </select>
            </FormField>
          </div>

          <div className="flex flex-wrap gap-4">
            <FormField label="Effective from">
              <TextInput
                type="date"
                value={form.effectiveFrom}
                onChange={(e) => setForm((f) => ({ ...f, effectiveFrom: e.target.value }))}
              />
            </FormField>
            <FormField label="Effective to (optional)">
              <TextInput
                type="date"
                value={form.effectiveTo}
                onChange={(e) => setForm((f) => ({ ...f, effectiveTo: e.target.value }))}
              />
            </FormField>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              className="px-4 py-2.5 rounded-xl bg-[var(--brand-500)] text-white text-sm font-bold hover:bg-[var(--brand-600)] transition-colors w-fit"
            >
              {editingId !== null ? "Save changes" : "Add rule"}
            </button>
            {editingId !== null && (
              <button
                type="button"
                onClick={resetForm}
                className="text-sm font-semibold text-[var(--ink-600)] hover:text-[var(--ink-900)]"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </Card>

      <div>
        <SectionHeader title="Your rules" />
        {sorted.length === 0 ? (
          <Card className="text-center py-10">
            <p className="text-sm text-[var(--ink-500)]">No availability rules yet.</p>
          </Card>
        ) : (
          <div className="flex flex-col gap-3">
            {sorted.map((rule) => (
              <RuleCard key={rule.id} rule={rule} onEdit={() => startEdit(rule)} onDelete={() => setPendingDeleteId(rule.id)} />
            ))}
          </div>
        )}
      </div>

      <ConfirmModal
        open={pendingDeleteId !== null}
        icon={ShieldAlert}
        title="Delete this rule?"
        description="Future slots generated from this rule will no longer be offered to students."
        confirmLabel="Delete rule"
        cancelLabel="Never mind"
        onCancel={() => setPendingDeleteId(null)}
        onConfirm={() => {
          setRules((list) => list.filter((r) => r.id !== pendingDeleteId));
          if (editingId === pendingDeleteId) resetForm();
          setPendingDeleteId(null);
        }}
      />
    </div>
  );
}

// ---- Exceptions tab ------------------------------------------------------

interface ExceptionFormState {
  date: string;
  type: ExceptionType;
  startTime: string;
  endTime: string;
  reason: string;
}

const EMPTY_EXCEPTION_FORM: ExceptionFormState = {
  date: new Date().toISOString().slice(0, 10),
  type: "BLOCK",
  startTime: "09:00",
  endTime: "10:00",
  reason: "",
};

function ExceptionCard({ exception, onDelete }: { exception: AvailabilityException; onDelete: () => void }) {
  const hue = exception.type === "BLOCK" ? HUE_TOKENS.danger : HUE_TOKENS.success;
  return (
    <Card className="flex items-start justify-between gap-3">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11.5px] font-semibold"
            style={{ background: hue.bg, color: hue.text }}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: hue.dot }} />
            {exception.type === "BLOCK" ? "Blocked" : "Added"}
          </span>
          <p className="text-[13px] font-semibold text-[var(--ink-900)] tabular-nums">{formatDate(exception.date)}</p>
        </div>
        <p className="text-[13px] text-[var(--ink-600)] tabular-nums">
          {exception.startTime}–{exception.endTime}
        </p>
        {exception.reason && <p className="text-[12.5px] text-[var(--ink-500)] mt-0.5">{exception.reason}</p>}
      </div>
      <button
        type="button"
        onClick={onDelete}
        aria-label="Delete exception"
        className="flex items-center justify-center w-8 h-8 rounded-full text-[var(--ink-500)] hover:bg-[var(--danger-100)] hover:text-[var(--danger-700)] transition-colors shrink-0"
      >
        <Trash2 className="w-3.5 h-3.5" strokeWidth={2} />
      </button>
    </Card>
  );
}

function ExceptionsTab({
  exceptions,
  setExceptions,
}: {
  exceptions: AvailabilityException[];
  setExceptions: React.Dispatch<React.SetStateAction<AvailabilityException[]>>;
}) {
  const [form, setForm] = useState<ExceptionFormState>(EMPTY_EXCEPTION_FORM);
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);

  const sorted = [...exceptions].sort((a, b) => a.date.localeCompare(b.date));

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const nextId = exceptions.length === 0 ? 1 : Math.max(...exceptions.map((x) => x.id)) + 1;
    setExceptions((list) => [
      ...list,
      {
        id: nextId,
        date: form.date,
        type: form.type,
        startTime: form.startTime,
        endTime: form.endTime,
        reason: form.reason.trim() || null,
      },
    ]);
    setForm(EMPTY_EXCEPTION_FORM);
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <SectionHeader title="Add an exception" />
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <span className="text-[12.5px] font-semibold text-[var(--ink-700)]">Type</span>
            <FilterTabs
              options={[
                { value: "BLOCK" as ExceptionType, label: "Block time off" },
                { value: "ADD" as ExceptionType, label: "Add extra hours" },
              ]}
              value={form.type}
              onChange={(v) => setForm((f) => ({ ...f, type: v }))}
            />
          </div>

          <div className="flex flex-wrap gap-4">
            <FormField label="Date">
              <TextInput type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} />
            </FormField>
            <FormField label="Start time">
              <TextInput type="time" value={form.startTime} onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))} />
            </FormField>
            <FormField label="End time">
              <TextInput type="time" value={form.endTime} onChange={(e) => setForm((f) => ({ ...f, endTime: e.target.value }))} />
            </FormField>
          </div>

          <FormField label="Reason (optional)">
            <TextInput
              type="text"
              value={form.reason}
              onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
              placeholder="e.g. Faculty meeting"
            />
          </FormField>

          <button
            type="submit"
            className="px-4 py-2.5 rounded-xl bg-[var(--brand-500)] text-white text-sm font-bold hover:bg-[var(--brand-600)] transition-colors w-fit"
          >
            Add exception
          </button>
        </form>
      </Card>

      <div>
        <SectionHeader title="Upcoming exceptions" />
        {sorted.length === 0 ? (
          <Card className="text-center py-10">
            <p className="text-sm text-[var(--ink-500)]">No exceptions on your calendar.</p>
          </Card>
        ) : (
          <div className="flex flex-col gap-3">
            {sorted.map((exception) => (
              <ExceptionCard key={exception.id} exception={exception} onDelete={() => setPendingDeleteId(exception.id)} />
            ))}
          </div>
        )}
      </div>

      <ConfirmModal
        open={pendingDeleteId !== null}
        icon={ShieldAlert}
        title="Delete this exception?"
        description="This removes the one-off change — your regular weekly rules take over again for that window."
        confirmLabel="Delete exception"
        cancelLabel="Never mind"
        onCancel={() => setPendingDeleteId(null)}
        onConfirm={() => {
          setExceptions((list) => list.filter((x) => x.id !== pendingDeleteId));
          setPendingDeleteId(null);
        }}
      />
    </div>
  );
}

// ---- Waitlist tab (read-only) --------------------------------------------

const relativeFormatter = new Intl.RelativeTimeFormat("en-US", { numeric: "auto" });

function requestedAgoLabel(iso: string): string {
  const diffDays = Math.round((new Date(iso).getTime() - new Date().getTime()) / 86_400_000);
  return relativeFormatter.format(diffDays, "day");
}

function WaitlistTab() {
  const groups = getMockSlotWaitlistGroups();

  if (groups.length === 0) {
    return (
      <Card className="text-center py-10">
        <p className="text-sm text-[var(--ink-500)]">No one is waiting on any of your slots.</p>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {groups.map((group) => (
        <Card key={group.id}>
          <SectionHeader title={group.slotLabel} />
          <div className="flex flex-col divide-y divide-[var(--paper-200)]">
            {group.queue.map((entry) => (
              <div key={entry.studentName} className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-[var(--brand-50)] text-[var(--brand-700)] text-[11px] font-bold shrink-0 tabular-nums">
                    #{entry.position}
                  </span>
                  <span className="text-sm font-semibold text-[var(--ink-900)] truncate">{entry.studentName}</span>
                </div>
                <span className="text-[12.5px] text-[var(--ink-500)] whitespace-nowrap tabular-nums">
                  {requestedAgoLabel(entry.requestedAt)}
                </span>
              </div>
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
}

// ---- Page -----------------------------------------------------------------

export default function AvailabilityPage() {
  const [tab, setTab] = useState<Tab>("RULES");
  const [rules, setRules] = useState<AvailabilityRule[]>(() => getMockAvailabilityRules());
  const [exceptions, setExceptions] = useState<AvailabilityException[]>(() => getMockAvailabilityExceptions());
  const waitlistCount = getMockSlotWaitlistGroups().reduce((sum, g) => sum + g.queue.length, 0);

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-[var(--ink-900)] mb-1">Availability</h1>
        <p className="text-sm text-[var(--ink-600)]">Manage your weekly office-hours rules and one-off changes.</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <StatTile icon={CalendarPlus} tone={ACCENT_TOKENS.mint} value={rules.filter((r) => r.active).length} label="Active rules" />
        <StatTile icon={CalendarOff} tone={HUE_TOKENS.danger} value={exceptions.filter((x) => x.type === "BLOCK").length} label="Blocked windows" />
        <StatTile icon={Users2} tone={HUE_TOKENS.info} value={waitlistCount} label="Students waiting" />
      </div>

      <FilterTabs
        options={[
          { value: "RULES" as Tab, label: "Rules" },
          { value: "EXCEPTIONS" as Tab, label: "Exceptions" },
          { value: "WAITLIST" as Tab, label: "Waitlist" },
        ]}
        value={tab}
        onChange={setTab}
      />

      {tab === "RULES" && <RulesTab rules={rules} setRules={setRules} />}
      {tab === "EXCEPTIONS" && <ExceptionsTab exceptions={exceptions} setExceptions={setExceptions} />}
      {tab === "WAITLIST" && <WaitlistTab />}
    </div>
  );
}
