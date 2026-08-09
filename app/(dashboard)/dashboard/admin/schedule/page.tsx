"use client";

import { useState } from "react";
import { CheckCircle2, FileUp, ShieldAlert, Trash2, XCircle } from "lucide-react";
import { ConfirmModal } from "@/components/ConfirmModal";
import { Card } from "@/components/dashboard/Card";
import { FilterTabs } from "@/components/dashboard/FilterTabs";
import { FormField, TextInput } from "@/components/dashboard/FormField";
import { SectionHeader } from "@/components/dashboard/SectionHeader";
import {
  getMockAdminScheduleEntries,
  getMockLecturers,
  getMockOfficeHours,
  getMockScheduleImportHistory,
} from "@/lib/office-hours/mock-data";
import type { AdminScheduleEntry, ParsedTimetableRow, ScheduleImportHistoryEntry } from "@/lib/office-hours/types";
import { DAY_NAME_TO_INDEX, parseTimetablePdf, type TimetableMetadata } from "@/lib/timetable/parse-pdf";

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

function SourceBadge({ source }: { source: AdminScheduleEntry["source"] }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-semibold uppercase tracking-wide bg-[var(--paper-100)] text-[var(--ink-500)]">
      {source === "IMPORTED" ? "Imported" : "Manual"}
    </span>
  );
}

// ---- Import tab ------------------------------------------------------------

type ParseStatus = "idle" | "parsing" | "done" | "error";

function ImportTab({
  entries,
  setEntries,
  history,
  setHistory,
}: {
  entries: AdminScheduleEntry[];
  setEntries: React.Dispatch<React.SetStateAction<AdminScheduleEntry[]>>;
  history: ScheduleImportHistoryEntry[];
  setHistory: React.Dispatch<React.SetStateAction<ScheduleImportHistoryEntry[]>>;
}) {
  const [status, setStatus] = useState<ParseStatus>("idle");
  const [fileName, setFileName] = useState<string | null>(null);
  const [rows, setRows] = useState<ParsedTimetableRow[]>([]);
  const [metadata, setMetadata] = useState<TimetableMetadata | null>(null);
  const [imported, setImported] = useState(false);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setStatus("parsing");
    setImported(false);
    try {
      const parsed = await parseTimetablePdf(file);
      setRows(parsed.rows);
      setMetadata(parsed.metadata);
      setStatus("done");
    } catch (err) {
      console.error(err);
      setRows([]);
      setMetadata(null);
      setStatus("error");
    }
  }

  function handleImport() {
    const importable = rows.filter((r) => DAY_NAME_TO_INDEX[r.day] >= 1 && DAY_NAME_TO_INDEX[r.day] <= 5);
    const startId = entries.length === 0 ? 1 : Math.max(...entries.map((e) => e.id)) + 1;
    const newEntries: AdminScheduleEntry[] = importable.map((r, i) => ({
      id: startId + i,
      lecturerName: r.lecturerName,
      title: r.subjectCode !== "N/A" ? `${r.subjectName} (${r.subjectCode})` : r.subjectName,
      dayOfWeek: DAY_NAME_TO_INDEX[r.day],
      startTime: r.startTime,
      endTime: r.endTime,
      source: "IMPORTED",
    }));
    setEntries((list) => [...list, ...newEntries]);

    const nextHistoryId = history.length === 0 ? 1 : Math.max(...history.map((h) => h.id)) + 1;
    setHistory((list) => [
      { id: nextHistoryId, fileName: fileName ?? "unknown.pdf", importedAt: new Date().toISOString(), rowCount: newEntries.length, status: "SUCCESS" },
      ...list,
    ]);
    setImported(true);
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <SectionHeader title="Upload a timetable PDF" />
        <p className="text-[12.5px] text-[var(--ink-500)] bg-[var(--paper-50)] border border-[var(--paper-200)] rounded-lg px-3.5 py-2.5 mb-4 flex items-center gap-2">
          <FileUp className="w-3.5 h-3.5 shrink-0" strokeWidth={2} />
          Parses an EIU &quot;lịch học&quot; export entirely in your browser (day-column +
          room-anchor clustering) — nothing is uploaded to a server.
        </p>

        <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-[var(--brand-200)] bg-[var(--brand-50)] rounded-xl px-6 py-8 cursor-pointer hover:bg-[var(--brand-100)] transition-colors">
          <FileUp className="w-6 h-6 text-[var(--brand-500)]" strokeWidth={1.8} />
          <span className="text-sm font-semibold text-[var(--brand-700)]">Click to choose a PDF timetable</span>
          <input type="file" accept=".pdf" className="hidden" onChange={handleFileChange} />
        </label>

        {status === "parsing" && <p className="text-[13px] text-[var(--ink-600)] mt-3">Parsing {fileName}…</p>}
        {status === "error" && (
          <p className="text-[13px] text-[var(--danger-700)] font-semibold mt-3">Couldn&apos;t parse that file. Try another PDF.</p>
        )}
        {status === "done" && (
          <>
            <p className="text-[13px] text-[var(--success-700)] font-semibold mt-3">
              Parsed {rows.length} class session{rows.length === 1 ? "" : "s"} from {fileName}.
            </p>
            {(metadata?.name || metadata?.semester) && (
              <p className="text-[12.5px] text-[var(--ink-500)] mt-1">
                Detected in PDF:{" "}
                {metadata.name && <span className="font-semibold text-[var(--ink-700)]">{metadata.name}</span>}
                {metadata.name && metadata.semester && " · "}
                {metadata.semester && <span className="font-semibold text-[var(--ink-700)]">{metadata.semester}</span>}
              </p>
            )}
          </>
        )}
      </Card>

      {status === "done" && rows.length > 0 && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <SectionHeader title="Preview" />
            <button
              type="button"
              onClick={handleImport}
              disabled={imported}
              className="px-4 py-2 rounded-xl bg-[var(--brand-500)] text-white text-sm font-bold hover:bg-[var(--brand-600)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {imported ? "Imported" : `Import ${rows.length} entries`}
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--paper-200)] text-left text-[11px] font-bold uppercase tracking-wide text-[var(--ink-500)]">
                  <th className="py-2 pr-4">Day</th>
                  <th className="py-2 pr-4">Time</th>
                  <th className="py-2 pr-4">Subject</th>
                  <th className="py-2 pr-4">Group</th>
                  <th className="py-2 pr-4">Room</th>
                  <th className="py-2 pr-4">Lecturer</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={i} className="border-b border-[var(--paper-100)] last:border-0">
                    <td className="py-2 pr-4 font-semibold text-[var(--brand-700)] whitespace-nowrap">{row.day}</td>
                    <td className="py-2 pr-4 tabular-nums whitespace-nowrap">
                      {row.startTime || "?"}–{row.endTime || "?"}
                    </td>
                    <td className="py-2 pr-4">
                      <p className="font-semibold text-[var(--ink-900)]">{row.subjectCode}</p>
                      <p className="text-[12px] text-[var(--ink-500)]">{row.subjectName}</p>
                    </td>
                    <td className="py-2 pr-4">{row.group}</td>
                    <td className="py-2 pr-4">{row.room}</td>
                    <td className="py-2 pr-4">{row.lecturerName}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <div>
        <SectionHeader title="Import history" />
        <Card className="p-0 overflow-hidden overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--paper-200)] text-left text-[11px] font-bold uppercase tracking-wide text-[var(--ink-500)]">
                <th className="px-5 py-3">File</th>
                <th className="px-5 py-3">Imported</th>
                <th className="px-5 py-3">Rows</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {history.map((h) => (
                <tr key={h.id} className="border-b border-[var(--paper-100)] last:border-0">
                  <td className="px-5 py-3 font-medium text-[var(--ink-900)]">{h.fileName}</td>
                  <td className="px-5 py-3 tabular-nums text-[var(--ink-600)]">{dateTimeFormatter.format(new Date(h.importedAt))}</td>
                  <td className="px-5 py-3 tabular-nums">{h.rowCount}</td>
                  <td className="px-5 py-3">
                    {h.status === "SUCCESS" ? (
                      <span className="inline-flex items-center gap-1.5 text-[var(--success-700)] font-semibold text-[12.5px]">
                        <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={2} /> Success
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-[var(--danger-700)] font-semibold text-[12.5px]">
                        <XCircle className="w-3.5 h-3.5" strokeWidth={2} /> Failed
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </div>
  );
}

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
                    <SourceBadge source={entry.source} />
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

      {tab === "IMPORT" && <ImportTab entries={entries} setEntries={setEntries} history={history} setHistory={setHistory} />}
      {tab === "MANUAL" && <ManualEntryTab entries={entries} setEntries={setEntries} />}
      {tab === "SEARCH" && <SlotSearchTab />}
    </div>
  );
}
