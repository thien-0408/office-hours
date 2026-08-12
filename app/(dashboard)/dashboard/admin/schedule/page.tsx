"use client";

import { useState } from "react";
import { ShieldAlert, Trash2 } from "lucide-react";
import { ConfirmModal } from "@/components/ConfirmModal";
import { Card } from "@/components/dashboard/Card";
import { FilterTabs } from "@/components/dashboard/FilterTabs";
import { FormField, TextInput } from "@/components/dashboard/FormField";
import { SectionHeader } from "@/components/dashboard/SectionHeader";
import { ScheduleSourceBadge, TimetableImport } from "@/components/dashboard/TimetableImport";
import {
  getMockAdminScheduleEntries,
  getMockLecturers,
  getMockOfficeHours,
  getMockScheduleImportHistory,
} from "@/lib/office-hours/mock-data";
import type { AdminScheduleEntry, ScheduleImportHistoryEntry } from "@/lib/office-hours/types";

type Tab = "IMPORT" | "MANUAL" | "SEARCH";

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

const dateTimeFormatter = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" });

// ---- Manual Entry tab -------------------------------------------------------

function ManualEntryTab({ entries, setEntries }: { entries: AdminScheduleEntry[]; setEntries: React.Dispatch<React.SetStateAction<AdminScheduleEntry[]>> }) {
  const lecturers = getMockLecturers();
  const [lecturerName, setLecturerName] = useState(lecturers[0]?.name ?? "");
  const [title, setTitle] = useState("");
  const [dayOfWeek, setDayOfWeek] = useState("1");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);

  const sorted = [...entries].sort((a, b) => a.dayOfWeek - b.dayOfWeek || a.startTime.localeCompare(b.startTime));

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    const nextId = entries.length === 0 ? 1 : Math.max(...entries.map((row) => row.id)) + 1;
    setEntries((list) => [
      ...list,
      { id: nextId, lecturerName, title: title.trim(), dayOfWeek: Number(dayOfWeek), startTime, endTime, source: "MANUAL" },
    ]);
    setTitle("");
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <SectionHeader title="Add a schedule block" />
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-4">
            <FormField label="Lecturer">
              <select
                value={lecturerName}
                onChange={(e) => setLecturerName(e.target.value)}
                className="rounded-xl border border-[var(--paper-200)] bg-white px-3.5 py-2.5 text-sm text-[var(--ink-900)] outline-none focus:ring-2 focus:ring-[var(--brand-300)]"
              >
                {lecturers.map((l) => (
                  <option key={l.id} value={l.name}>
                    {l.name}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="Title">
              <TextInput value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Department committee" className="w-56" />
            </FormField>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-[12.5px] font-semibold text-[var(--ink-700)]">Day of week</span>
            <FilterTabs options={DAY_OPTIONS} value={dayOfWeek} onChange={setDayOfWeek} />
          </div>

          <div className="flex flex-wrap gap-4">
            <FormField label="Start time">
              <TextInput type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
            </FormField>
            <FormField label="End time">
              <TextInput type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
            </FormField>
          </div>

          <button
            type="submit"
            className="px-4 py-2.5 rounded-xl bg-[var(--brand-500)] text-white text-sm font-bold hover:bg-[var(--brand-600)] transition-colors w-fit"
          >
            Add entry
          </button>
        </form>
      </Card>

      <div>
        <SectionHeader title="All schedule entries" />
        {sorted.length === 0 ? (
          <Card className="text-center py-10">
            <p className="text-sm text-[var(--ink-500)]">No schedule entries yet.</p>
          </Card>
        ) : (
          <div className="flex flex-col gap-3">
            {sorted.map((entry) => (
              <Card key={entry.id} className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-[var(--ink-900)]">{entry.title}</p>
                    <ScheduleSourceBadge source={entry.source} />
                  </div>
                  <p className="text-[13px] text-[var(--ink-600)]">{entry.lecturerName}</p>
                  <p className="text-[12.5px] text-[var(--ink-500)] tabular-nums mt-0.5">
                    {DAY_LABEL_LONG[entry.dayOfWeek]} · {entry.startTime}–{entry.endTime}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setPendingDeleteId(entry.id)}
                  aria-label="Delete entry"
                  className="flex items-center justify-center w-8 h-8 rounded-full text-[var(--ink-500)] hover:bg-[var(--danger-100)] hover:text-[var(--danger-700)] transition-colors shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" strokeWidth={2} />
                </button>
              </Card>
            ))}
          </div>
        )}
      </div>

      <ConfirmModal
        open={pendingDeleteId !== null}
        icon={ShieldAlert}
        title="Delete this schedule entry?"
        description="This frees up that time — students may be able to book slots that overlap it going forward."
        confirmLabel="Delete entry"
        cancelLabel="Never mind"
        onCancel={() => setPendingDeleteId(null)}
        onConfirm={() => {
          setEntries((list) => list.filter((row) => row.id !== pendingDeleteId));
          setPendingDeleteId(null);
        }}
      />
    </div>
  );
}

// ---- Slot Search tab ---------------------------------------------------------

function SlotSearchTab() {
  const allSlots = getMockOfficeHours({ page: 0, size: 500 }).content;
  const departments = Array.from(new Set(allSlots.map((s) => s.department).filter((d): d is string => Boolean(d)))).sort();

  const [department, setDepartment] = useState<string>("ALL");
  const [lecturerQuery, setLecturerQuery] = useState("");

  const q = lecturerQuery.trim().toLowerCase();
  const filtered = allSlots
    .filter((s) => department === "ALL" || s.department === department)
    .filter((s) => !q || s.lecturerName.toLowerCase().includes(q))
    .sort((a, b) => a.startAt.localeCompare(b.startAt));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row sm:items-end gap-3">
        <FormField label="Lecturer">
          <TextInput
            value={lecturerQuery}
            onChange={(e) => setLecturerQuery(e.target.value)}
            placeholder="Search by lecturer name…"
            className="sm:w-72"
          />
        </FormField>
        <FilterTabs
          options={[{ value: "ALL", label: "All departments" }, ...departments.map((d) => ({ value: d, label: d }))]}
          value={department}
          onChange={setDepartment}
        />
      </div>

      {filtered.length === 0 ? (
        <Card className="text-center py-10">
          <p className="text-sm text-[var(--ink-500)]">No open slots match those filters.</p>
        </Card>
      ) : (
        <Card className="p-0 overflow-hidden overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--paper-200)] text-left text-[11px] font-bold uppercase tracking-wide text-[var(--ink-500)]">
                <th className="px-5 py-3">Lecturer</th>
                <th className="px-5 py-3">Department</th>
                <th className="px-5 py-3">Date &amp; time</th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 100).map((slot) => (
                <tr key={slot.id} className="border-b border-[var(--paper-100)] last:border-0 hover:bg-[var(--paper-50)] transition-colors">
                  <td className="px-5 py-3.5 font-semibold text-[var(--ink-900)]">{slot.lecturerName}</td>
                  <td className="px-5 py-3.5 text-[var(--ink-600)]">{slot.department ?? "—"}</td>
                  <td className="px-5 py-3.5 tabular-nums text-[var(--ink-700)] whitespace-nowrap">{dateTimeFormatter.format(new Date(slot.startAt))}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length > 100 && (
            <p className="text-[12.5px] text-[var(--ink-500)] text-center py-3 border-t border-[var(--paper-100)]">
              Showing first 100 of {filtered.length} matches — narrow your filters to see more.
            </p>
          )}
        </Card>
      )}
    </div>
  );
}

// ---- Page --------------------------------------------------------------------

export default function AdminSchedulePage() {
  const [tab, setTab] = useState<Tab>("IMPORT");
  const [entries, setEntries] = useState<AdminScheduleEntry[]>(() => getMockAdminScheduleEntries());
  const [history, setHistory] = useState<ScheduleImportHistoryEntry[]>(() => getMockScheduleImportHistory());

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--ink-900)] mb-1">Schedule</h1>
        <p className="text-sm text-[var(--ink-600)]">Import teaching schedules, enter blocks manually, and browse open slots across lecturers.</p>
      </div>

      <FilterTabs
        options={[
          { value: "IMPORT" as Tab, label: "Import" },
          { value: "MANUAL" as Tab, label: "Manual Entry" },
          { value: "SEARCH" as Tab, label: "Slot Search" },
        ]}
        value={tab}
        onChange={setTab}
      />

      {tab === "IMPORT" && (
        <TimetableImport
          entries={entries}
          setEntries={setEntries}
          history={history}
          setHistory={setHistory}
          heading="Upload a timetable PDF (on behalf of a user)"
          description="Admin fallback for a user who can't self-serve — parses an EIU 'lịch học' export entirely in your browser (day-column + room-anchor clustering) — nothing is uploaded to a server. Students and lecturers can import their own on their My Schedule page."
          buildEntry={(row, dayOfWeek, id): AdminScheduleEntry => ({
            id,
            lecturerName: row.lecturerName,
            title: row.subjectCode !== "N/A" ? `${row.subjectName} (${row.subjectCode})` : row.subjectName,
            dayOfWeek,
            startTime: row.startTime,
            endTime: row.endTime,
            source: "IMPORTED",
          })}
        />
      )}
      {tab === "MANUAL" && <ManualEntryTab entries={entries} setEntries={setEntries} />}
      {tab === "SEARCH" && <SlotSearchTab />}
    </div>
  );
}
