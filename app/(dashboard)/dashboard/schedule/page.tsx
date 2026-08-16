"use client";

import { useMemo, useState } from "react";
import {
  CalendarDays,
  Clock,
  Laptop,
  LayoutGrid,
  ListFilter,
  Plus,
  Printer,
  School,
  X,
} from "lucide-react";
import { ConfirmModal } from "@/components/ConfirmModal";
import { Card } from "@/components/dashboard/Card";
import { FilterTabs } from "@/components/dashboard/FilterTabs";
import { FormField, TextInput } from "@/components/dashboard/FormField";
import {
  DayRangeFilter,
  DAY_METADATA,
  ShiftFilter,
  TIME_SLOTS_FULL,
  timeToMinutes,
  TimetableGrid,
} from "@/components/dashboard/TimetableGrid";
import { TimetableAgenda } from "@/components/dashboard/TimetableAgenda";
import { TimetableImport } from "@/components/dashboard/TimetableImport";
import { useAuth } from "@/lib/auth/auth-context";
import {
  getMockMyScheduleImportHistory,
  getMockScheduleBlocks,
  getMockStudentScheduleBlocks,
} from "@/lib/office-hours/mock-data";
import type { ParsedTimetableRow, ScheduleBlock, ScheduleImportHistoryEntry } from "@/lib/office-hours/types";

type PageTab = "VIEW" | "IMPORT";
type ViewMode = "GRID" | "AGENDA";

export default function SchedulePage() {
  const { user } = useAuth();
  const isStudent = user?.role === "STUDENT";

  const [tab, setTab] = useState<PageTab>("VIEW");
  const [viewMode, setViewMode] = useState<ViewMode>("GRID");
  const [dayRange, setDayRange] = useState<DayRangeFilter>("PLUS_SAT");
  const [shiftFilter, setShiftFilter] = useState<ShiftFilter>("ALL");

  const [entries, setEntries] = useState<ScheduleBlock[]>(() =>
    isStudent ? getMockStudentScheduleBlocks() : getMockScheduleBlocks()
  );
  const [history, setHistory] = useState<ScheduleImportHistoryEntry[]>(() =>
    getMockMyScheduleImportHistory()
  );

  // Manual block modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDayOfWeek, setNewDayOfWeek] = useState<number>(1);
  const [newStartTime, setNewStartTime] = useState("07:30");
  const [newEndTime, setNewEndTime] = useState("09:30");
  const [newRoom, setNewRoom] = useState("");
  const [newNotes, setNewNotes] = useState("");

  // Delete modal state
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);

  // Calculated Stats
  const stats = useMemo(() => {
    const totalSessions = entries.length;
    let totalMinutes = 0;
    let labCount = 0;
    let onlineCount = 0;
    let roomCount = 0;

    entries.forEach((b) => {
      const dur = timeToMinutes(b.endTime) - timeToMinutes(b.startTime);
      if (dur > 0) totalMinutes += dur;

      if (b.locationType === "LAB" || b.room?.toUpperCase().includes("LAB")) {
        labCount++;
      } else if (b.locationType === "ONLINE" || b.room?.toUpperCase().includes("ONLINE")) {
        onlineCount++;
      } else {
        roomCount++;
      }
    });

    const totalHours = (totalMinutes / 60).toFixed(1);

    return {
      totalSessions,
      totalHours,
      labCount,
      onlineCount,
      roomCount,
    };
  }, [entries]);

  function handleOpenAddModal(dayNum?: number, slotTime?: string) {
    if (dayNum) setNewDayOfWeek(dayNum);
    if (slotTime) {
      setNewStartTime(slotTime);
      const slotMin = timeToMinutes(slotTime);
      const endMin = slotMin + 120; // default 2h
      const h = Math.floor(endMin / 60).toString().padStart(2, "0");
      const m = (endMin % 60).toString().padStart(2, "0");
      setNewEndTime(`${h}:${m}`);
    }
    setIsAddModalOpen(true);
  }

  function handleCreateManualBlock(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const nextId = entries.length === 0 ? 1 : Math.max(...entries.map((b) => b.id)) + 1;
    const isLab = newRoom.toUpperCase().includes("LAB");
    const isOnline = newRoom.toUpperCase().includes("ONLINE");

    const newBlock: ScheduleBlock = {
      id: nextId,
      title: newTitle.trim(),
      subjectName: newTitle.trim(),
      dayOfWeek: Number(newDayOfWeek),
      startTime: newStartTime,
      endTime: newEndTime,
      room: newRoom.trim() || undefined,
      locationType: isLab ? "LAB" : isOnline ? "ONLINE" : "ROOM",
      source: "MANUAL",
      notes: newNotes.trim() || undefined,
    };

    setEntries((prev) => [...prev, newBlock]);
    setIsAddModalOpen(false);
    setNewTitle("");
    setNewRoom("");
    setNewNotes("");
  }

  function handleDeleteBlock(id: number) {
    setEntries((prev) => prev.filter((b) => b.id !== id));
  }

  const subtitle = isStudent
    ? "Your official class timetable — 07:30 AM university schedule synchronized with AAO."
    : "Your teaching timetable — starts from 07:30 AM, auto-aligned with official AAO session clusters.";

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold text-[var(--ink-900)]">
              {isStudent ? "My Class Schedule" : "My Teaching Schedule"}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[var(--brand-50)] text-[var(--brand-700)] border border-[var(--brand-200)]">
              07:30 AM Standard
            </span>
          </div>
          <p className="text-sm text-[var(--ink-600)]">{subtitle}</p>
        </div>

        {tab === "VIEW" && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleOpenAddModal()}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[var(--brand-500)] text-white text-xs font-bold hover:bg-[var(--brand-600)] shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Event
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[var(--paper-100)] text-[var(--ink-700)] text-xs font-semibold hover:bg-[var(--paper-200)] transition-colors border border-[var(--paper-200)]"
              title="Print or export timetable"
            >
              <Printer className="w-3.5 h-3.5" />
              Print
            </button>
          </div>
        )}
      </div>

      {/* Main Tab Switcher */}
      <FilterTabs
        options={[
          { value: "VIEW" as PageTab, label: isStudent ? "Timetable View" : "My Teaching Timetable" },
          { value: "IMPORT" as PageTab, label: "Import AAO PDF" },
        ]}
        value={tab}
        onChange={setTab}
      />

      {tab === "VIEW" && (
        <div className="flex flex-col gap-5">
          {/* Quick Metrics & Load Banner */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Card className="p-3.5 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[var(--brand-100)] flex items-center justify-center text-[var(--brand-600)] shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11.5px] font-medium text-[var(--ink-500)]">Weekly Load</p>
                <p className="text-base font-bold text-[var(--ink-900)] tabular-nums">
                  {stats.totalHours} <span className="text-xs font-semibold text-[var(--ink-500)]">hours</span>
                </p>
              </div>
            </Card>

            <Card className="p-3.5 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[var(--coral-100)] flex items-center justify-center text-[var(--coral-600)] shrink-0">
                <CalendarDays className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11.5px] font-medium text-[var(--ink-500)]">Total Sessions</p>
                <p className="text-base font-bold text-[var(--ink-900)] tabular-nums">
                  {stats.totalSessions} <span className="text-xs font-semibold text-[var(--ink-500)]">classes</span>
                </p>
              </div>
            </Card>

            <Card className="p-3.5 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[var(--info-100)] flex items-center justify-center text-[var(--info-600)] shrink-0">
                <Laptop className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11.5px] font-medium text-[var(--ink-500)]">Lab Sessions</p>
                <p className="text-base font-bold text-[var(--ink-900)] tabular-nums">
                  {stats.labCount} <span className="text-xs font-semibold text-[var(--ink-500)]">labs</span>
                </p>
              </div>
            </Card>

            <Card className="p-3.5 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[var(--mint-100)] flex items-center justify-center text-[var(--mint-600)] shrink-0">
                <School className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11.5px] font-medium text-[var(--ink-500)]">Lecture & Online</p>
                <p className="text-base font-bold text-[var(--ink-900)] tabular-nums">
                  {stats.roomCount + stats.onlineCount} <span className="text-xs font-semibold text-[var(--ink-500)]">rooms</span>
                </p>
              </div>
            </Card>
          </div>

          {/* Interactive Toolbar: View Switcher, Days Filter, Shift Filter */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 p-3 bg-[var(--paper-50)] border border-[var(--paper-200)] rounded-2xl">
            {/* View Mode (Grid vs Agenda) */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--ink-400)] pl-1">View:</span>
              <div className="flex bg-white rounded-xl p-1 border border-[var(--paper-200)] shadow-2xs">
                <button
                  type="button"
                  onClick={() => setViewMode("GRID")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                    viewMode === "GRID"
                      ? "bg-[var(--brand-500)] text-white shadow-xs"
                      : "text-[var(--ink-600)] hover:text-[var(--ink-900)]"
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  Timetable Matrix
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("AGENDA")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                    viewMode === "AGENDA"
                      ? "bg-[var(--brand-500)] text-white shadow-xs"
                      : "text-[var(--ink-600)] hover:text-[var(--ink-900)]"
                  }`}
                >
                  <ListFilter className="w-3.5 h-3.5" />
                  Agenda List
                </button>
              </div>
            </div>

            {/* Days Range & Shift Filters */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Days Range */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--ink-400)]">Days:</span>
                <FilterTabs
                  options={[
                    { value: "WORKDAYS" as DayRangeFilter, label: "Mon–Fri" },
                    { value: "PLUS_SAT" as DayRangeFilter, label: "Mon–Sat (+Sat)" },
                    { value: "FULL_WEEK" as DayRangeFilter, label: "All 7 Days" },
                  ]}
                  value={dayRange}
                  onChange={setDayRange}
                />
              </div>

              {/* Shift Filter (only for Grid view) */}
              {viewMode === "GRID" && (
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-[var(--ink-400)]">Shift:</span>
                  <FilterTabs
                    options={[
                      { value: "ALL" as ShiftFilter, label: "All Shifts" },
                      { value: "MORNING" as ShiftFilter, label: "Morning" },
                      { value: "AFTERNOON" as ShiftFilter, label: "Afternoon" },
                      { value: "EVENING" as ShiftFilter, label: "Evening" },
                    ]}
                    value={shiftFilter}
                    onChange={setShiftFilter}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Timetable Body */}
          {entries.length === 0 ? (
            <Card className="text-center py-12">
              <School className="w-10 h-10 text-[var(--ink-400)] mx-auto mb-2 opacity-50" />
              <p className="text-sm font-semibold text-[var(--ink-800)]">No schedule blocks found</p>
              <p className="text-xs text-[var(--ink-500)] mt-1 mb-4">
                Import your official AAO export or add manual teaching events to get started.
              </p>
              <button
                type="button"
                onClick={() => setTab("IMPORT")}
                className="px-4 py-2 rounded-xl bg-[var(--brand-500)] text-white text-xs font-bold hover:bg-[var(--brand-600)] transition-colors"
              >
                Import AAO PDF
              </button>
            </Card>
          ) : viewMode === "GRID" ? (
            <TimetableGrid
              blocks={entries}
              dayRange={dayRange}
              shiftFilter={shiftFilter}
              onAddManualBlock={(dayNum, slotTime) => handleOpenAddModal(dayNum, slotTime)}
              onDeleteBlock={(id) => setPendingDeleteId(id)}
            />
          ) : (
            <TimetableAgenda
              blocks={entries}
              dayRange={dayRange}
              onAddManualBlock={(dayNum) => handleOpenAddModal(dayNum)}
              onDeleteBlock={(id) => setPendingDeleteId(id)}
            />
          )}
        </div>
      )}

      {tab === "IMPORT" && (
        <TimetableImport
          entries={entries}
          setEntries={setEntries}
          history={history}
          setHistory={setHistory}
          heading="Upload your AAO Timetable PDF"
          description="Parses your official EIU AAO 'lịch học' export starting from 07:30 AM entirely in your browser — detects course codes, section groups, rooms, and shift clusters."
          buildEntry={(row: ParsedTimetableRow, dayOfWeek: number, id: number): ScheduleBlock => {
            const isLab = row.room.toUpperCase().includes("LAB");
            const isOnline = row.room.toUpperCase().includes("ONLINE");
            return {
              id,
              title: row.subjectCode !== "N/A" ? `${row.subjectName} (${row.subjectCode})` : row.subjectName,
              subjectCode: row.subjectCode !== "N/A" ? row.subjectCode : undefined,
              subjectName: row.subjectName,
              group: row.group !== "N/A" ? row.group : undefined,
              room: row.room,
              lecturerName: row.lecturerName !== "Chưa rõ" ? row.lecturerName : undefined,
              locationType: isLab ? "LAB" : isOnline ? "ONLINE" : "ROOM",
              dayOfWeek,
              date: row.date ?? undefined,
              startTime: row.startTime,
              endTime: row.endTime,
              source: "IMPORTED",
            };
          }}
        />
      )}

      {/* Add Manual Event Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-[var(--bg-surface)] border border-[var(--paper-200)] rounded-2xl shadow-xl max-w-md w-full overflow-hidden p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-[var(--ink-900)]">Add Schedule Event</h2>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--ink-400)] hover:bg-[var(--paper-100)] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateManualBlock} className="flex flex-col gap-4">
              <FormField label="Event Title / Subject">
                <TextInput
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Department Committee, Thesis Defense"
                  required
                />
              </FormField>

              <div className="flex flex-col gap-1.5">
                <span className="text-[12.5px] font-semibold text-[var(--ink-700)]">Day of Week</span>
                <select
                  value={newDayOfWeek}
                  onChange={(e) => setNewDayOfWeek(Number(e.target.value))}
                  className="rounded-xl border border-[var(--paper-200)] bg-white px-3.5 py-2 text-sm text-[var(--ink-900)] outline-none focus:ring-2 focus:ring-[var(--brand-300)]"
                >
                  {Object.entries(DAY_METADATA).map(([num, meta]) => (
                    <option key={num} value={num}>
                      {meta.en} ({meta.vn})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <FormField label="Start Time">
                  <select
                    value={newStartTime}
                    onChange={(e) => setNewStartTime(e.target.value)}
                    className="rounded-xl border border-[var(--paper-200)] bg-white px-3 py-2 text-sm text-[var(--ink-900)] outline-none focus:ring-2 focus:ring-[var(--brand-300)] tabular-nums"
                  >
                    {TIME_SLOTS_FULL.slice(0, -1).map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </FormField>

                <FormField label="End Time">
                  <select
                    value={newEndTime}
                    onChange={(e) => setNewEndTime(e.target.value)}
                    className="rounded-xl border border-[var(--paper-200)] bg-white px-3 py-2 text-sm text-[var(--ink-900)] outline-none focus:ring-2 focus:ring-[var(--brand-300)] tabular-nums"
                  >
                    {TIME_SLOTS_FULL.slice(1).map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </FormField>
              </div>

              <FormField label="Room / Facility (Optional)">
                <TextInput
                  value={newRoom}
                  onChange={(e) => setNewRoom(e.target.value)}
                  placeholder="e.g. Boardroom B02, Room 402, Online"
                />
              </FormField>

              <FormField label="Notes (Optional)">
                <TextInput
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="e.g. Capstone defense evaluation panel"
                />
              </FormField>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--paper-200)]">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-[var(--ink-600)] hover:bg-[var(--paper-100)] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[var(--brand-500)] text-white text-xs font-bold hover:bg-[var(--brand-600)] transition-colors"
                >
                  Add Block
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        open={pendingDeleteId !== null}
        title="Delete this schedule block?"
        description="This will remove the event from your timetable view. Students will be able to book slots during this window."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onCancel={() => setPendingDeleteId(null)}
        onConfirm={() => {
          if (pendingDeleteId) handleDeleteBlock(pendingDeleteId);
          setPendingDeleteId(null);
        }}
      />
    </div>
  );
}
