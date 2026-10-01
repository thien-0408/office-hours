"use client";

import { useMemo, useState } from "react";
import {
  LayoutGrid,
  ListFilter,
  School,
} from "lucide-react";
import { ConfirmModal } from "@/components/ConfirmModal";
import { Card } from "@/components/dashboard/Card";
import { FilterTabs } from "@/components/dashboard/FilterTabs";
import { FormField, TextInput } from "@/components/dashboard/FormField";
import {
  type DayRangeFilter,
  DAY_METADATA,
  type ShiftFilter,
  TimetableGrid,
  TIME_SLOTS_FULL,
  timeToMinutes,
} from "@/components/dashboard/TimetableGrid";
import { TimetableAgenda } from "@/components/dashboard/TimetableAgenda";
import { TimetableImport } from "@/components/dashboard/TimetableImport";
import { useAuth } from "@/lib/auth/auth-context";
import {
  getMockMyScheduleImportHistory,
  getMockScheduleBlocks,
  getMockStudentScheduleBlocks,
} from "@/lib/office-hours/mock-data";
import type {
  ParsedTimetableRow,
  ScheduleBlock,
  ScheduleImportHistoryEntry,
} from "@/lib/office-hours/types";
import { useI18n } from "@/i18n/provider";
import { ChalkboardTeacher, CalendarDots, ClockCountdown, Laptop as PhLaptop, PlusIcon, PrinterIcon } from "@phosphor-icons/react";
import { SelectField } from "@/components/ui/select-field";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

type PageTab = "VIEW" | "IMPORT";
type ViewMode = "GRID" | "AGENDA";

export default function SchedulePage() {
  const { user } = useAuth();
  const { t } = useI18n();
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

  function handleOpenAddModal(dayNum?: number, slotTime?: string, endTime?: string) {
    if (dayNum) setNewDayOfWeek(dayNum);
    if (slotTime) {
      setNewStartTime(slotTime);

      if (endTime) {
        // Drag selection from TimetableGrid provides an exact end boundary.
        setNewEndTime(endTime);
      } else {
        // Toolbar / agenda add keeps the previous convenient 2-hour default.
        const slotMin = timeToMinutes(slotTime);
        const endMin = slotMin + 120;
        const h = Math.floor(endMin / 60)
          .toString()
          .padStart(2, "0");
        const m = (endMin % 60).toString().padStart(2, "0");
        setNewEndTime(`${h}:${m}`);
      }
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

  const subtitle = isStudent ? t("schedule.studentSubtitle") : t("schedule.lecturerSubtitle");

  return (
    <div className="flex flex-col gap-7">
      {/* Page Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <div className="mb-2 flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--ink-400)]">
              {t("nav.schedule")}
            </span>
            <span className="h-1 w-1 rounded-full bg-[var(--paper-300)]" />
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[var(--ink-500)]">
              <ClockCountdown className="h-4 w-4 text-[var(--brand-500)]" weight="fill" aria-hidden />
              Starts 07:30
            </span>
          </div>

          <h1 className="text-2xl font-semibold tracking-[-0.02em] text-[var(--ink-900)] sm:text-[28px]">
            {isStudent ? t("schedule.studentTitle") : t("schedule.lecturerTitle")}
          </h1>
          <p className="mt-1.5 text-sm leading-6 text-[var(--ink-500)]">{subtitle}</p>
        </div>

        {tab === "VIEW" && (
          <div className="flex items-center gap-2">
            <Button variant="outline"
              type="button"
              onClick={() => window.print()}
              className="h-9"
              title="Print or export timetable"
            >
              <PrinterIcon className="h-4 w-4" weight="bold" aria-hidden />
              {t("schedule.print")}
            </Button>
            <Button
              type="button"
              onClick={() => handleOpenAddModal()}
              className="h-9"
            >
              <PlusIcon className="h-4 w-4" weight="bold" aria-hidden />
              {t("schedule.addEvent")}
            </Button>
          </div>
        )}
      </div>

      {/* Main Tab Switcher */}
      <div className="w-fit">
        <FilterTabs
          options={[
            { value: "VIEW" as PageTab, label: isStudent ? "Timetable" : "Teaching timetable" },
            { value: "IMPORT" as PageTab, label: "Import AAO PDF" },
          ]}
          value={tab}
          onChange={setTab}
        />
      </div>

      {tab === "VIEW" && (
        <div className="flex flex-col gap-4">
          {/* Compact weekly summary */}
          <div className="grid grid-cols-2 overflow-hidden rounded-xl border border-[var(--paper-200)] bg-white sm:grid-cols-4">
            <div className="flex min-h-[74px] items-center gap-3 border-b border-r border-[var(--paper-200)] px-4 py-3 sm:border-b-0">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--brand-500)] text-white shadow-[0_6px_14px_-4px_color-mix(in_srgb,var(--brand-500)_55%,transparent)]">
                <ClockCountdown className="h-5 w-5" weight="fill" aria-hidden />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--ink-400)]">Weekly load</p>
                <p className="mt-0.5 text-[17px] font-semibold tracking-tight text-[var(--ink-900)] tabular-nums">
                  {stats.totalHours} <span className="text-[11px] font-medium text-[var(--ink-400)]">hours</span>
                </p>
              </div>
            </div>

            <div className="flex min-h-[74px] items-center gap-3 border-b border-[var(--paper-200)] px-4 py-3 sm:border-b-0 sm:border-r">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--coral-500)] text-white shadow-[0_6px_14px_-4px_color-mix(in_srgb,var(--coral-500)_55%,transparent)]">
                <CalendarDots className="h-5 w-5" weight="fill" aria-hidden />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--ink-400)]">Sessions</p>
                <p className="mt-0.5 text-[17px] font-semibold tracking-tight text-[var(--ink-900)] tabular-nums">
                  {stats.totalSessions} <span className="text-[11px] font-medium text-[var(--ink-400)]">classes</span>
                </p>
              </div>
            </div>

            <div className="flex min-h-[74px] items-center gap-3 border-r border-[var(--paper-200)] px-4 py-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--info-500)] text-white shadow-[0_6px_14px_-4px_color-mix(in_srgb,var(--info-500)_55%,transparent)]">
                <PhLaptop className="h-5 w-5" weight="fill" aria-hidden />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--ink-400)]">Labs</p>
                <p className="mt-0.5 text-[17px] font-semibold tracking-tight text-[var(--ink-900)] tabular-nums">
                  {stats.labCount} <span className="text-[11px] font-medium text-[var(--ink-400)]">sessions</span>
                </p>
              </div>
            </div>

            <div className="flex min-h-[74px] items-center gap-3 px-4 py-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--mint-500)] text-white shadow-[0_6px_14px_-4px_color-mix(in_srgb,var(--mint-500)_55%,transparent)]">
                <ChalkboardTeacher className="h-5 w-5" weight="fill" aria-hidden />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--ink-400)]">Lecture / online</p>
                <p className="mt-0.5 text-[17px] font-semibold tracking-tight text-[var(--ink-900)] tabular-nums">
                  {stats.roomCount + stats.onlineCount} <span className="text-[11px] font-medium text-[var(--ink-400)]">sessions</span>
                </p>
              </div>
            </div>
          </div>

          {/* Calm utility bar */}
          <div className="flex flex-col gap-3 rounded-xl border border-[var(--paper-200)] bg-[var(--paper-50)]/70 p-2.5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-2">
              <span className="hidden pl-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--ink-400)] sm:inline">
                Layout
              </span>
              <FilterTabs
                variant="dark"
                value={viewMode}
                onChange={setViewMode}
                options={[
                  { value: "GRID", label: "Week", icon: <LayoutGrid className="h-3.5 w-3.5" /> },
                  { value: "AGENDA", label: "Agenda", icon: <ListFilter className="h-3.5 w-3.5" /> },
                ]}
              />
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--ink-400)]">Days</span>
                <FilterTabs
                  options={[
                    { value: "WORKDAYS" as DayRangeFilter, label: "Mon–Fri" },
                    { value: "PLUS_SAT" as DayRangeFilter, label: "Mon–Sat" },
                    { value: "FULL_WEEK" as DayRangeFilter, label: "7 days" },
                  ]}
                  value={dayRange}
                  onChange={setDayRange}
                />
              </div>

              {viewMode === "GRID" && (
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--ink-400)]">Shift</span>
                  <FilterTabs
                    options={[
                      { value: "ALL" as ShiftFilter, label: "All" },
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
            <Card className="border-dashed py-14 text-center">
              <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--paper-100)] text-[var(--ink-400)]">
                <School className="h-5 w-5" />
              </div>
              <p className="text-sm font-semibold text-[var(--ink-800)]">No schedule blocks yet</p>
              <p className="mx-auto mb-4 mt-1 max-w-sm text-xs leading-5 text-[var(--ink-500)]">
                Import the official AAO timetable or add a manual event to start building your week.
              </p>
              <Button variant="dark" size="sm"
                type="button"
                onClick={() => setTab("IMPORT")}
              >
                Import AAO PDF
              </Button>
            </Card>
          ) : (
            <section className="overflow-hidden rounded-2xl border border-[var(--paper-200)] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
              <div className="flex flex-col gap-1 border-b border-[var(--paper-200)] px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-sm font-semibold tracking-[-0.01em] text-[var(--ink-900)]">
                    {viewMode === "GRID" ? "Weekly timetable" : "Agenda"}
                  </h2>
                  <p className="mt-0.5 text-[11px] text-[var(--ink-400)]">
                    {viewMode === "GRID"
                      ? "Cleaner day cards, calmer course surfaces, and click-to-add empty slots."
                      : "Your classes ordered by day and time."}
                  </p>
                </div>
                <span className="text-[11px] font-medium text-[var(--ink-400)] tabular-nums">
                  {stats.totalSessions} sessions · {stats.totalHours}h
                </span>
              </div>

              <div className="bg-[var(--bg-surface)]">
                {viewMode === "GRID" ? (
                  <TimetableGrid
                    blocks={entries}
                    dayRange={dayRange}
                    shiftFilter={shiftFilter}
                    onAddManualBlock={(dayNum, slotTime, endTime) => handleOpenAddModal(dayNum, slotTime, endTime)}
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
            </section>
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
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogTitle className="text-base font-bold text-[var(--ink-900)]">Add Schedule Event</DialogTitle>

            <form onSubmit={handleCreateManualBlock}
            className="flex flex-col gap-4">
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
                <SelectField
                  value={newDayOfWeek}
                  onChange={(e) => setNewDayOfWeek(Number(e.target.value))}
                  className="w-auto"
                >
                  {Object.entries(DAY_METADATA).map(([num, meta]) => (
                    <option key={num} value={num}>
                      {meta.en} ({meta.vn})
                    </option>
                  ))}
                </SelectField>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <FormField label="Start Time">
                  <SelectField
                    value={newStartTime}
                    onChange={(e) => setNewStartTime(e.target.value)}
                    className="w-auto"
                  >
                    {TIME_SLOTS_FULL.slice(0, -1).map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </SelectField>
                </FormField>

                <FormField label="End Time">
                  <SelectField
                    value={newEndTime}
                    onChange={(e) => setNewEndTime(e.target.value)}
                    className="w-auto"
                  >
                    {TIME_SLOTS_FULL.slice(1).map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </SelectField>
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

              <div className="flex items-center justify-end gap-2 border-t border-[var(--paper-200)] pt-3">
                <Button variant="ghost" size="sm"
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                >
                  Add Block
                </Button>
              </div>
            </form>
        </DialogContent>
      </Dialog>

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
