"use client";

import { useState } from "react";
import { FileUp, Info } from "lucide-react";
import { Card } from "@/components/dashboard/Card";
import { FilterTabs } from "@/components/dashboard/FilterTabs";
import { ScheduleSourceBadge, TimetableImport } from "@/components/dashboard/TimetableImport";
import { useAuth } from "@/lib/auth/auth-context";
import {
  getMockMyScheduleImportHistory,
  getMockScheduleBlocks,
  getMockStudentScheduleBlocks,
} from "@/lib/office-hours/mock-data";
import type { ScheduleBlock, ScheduleImportHistoryEntry } from "@/lib/office-hours/types";

const DAY_LABELS: Record<number, string> = {
  1: "Monday",
  2: "Tuesday",
  3: "Wednesday",
  4: "Thursday",
  5: "Friday",
};

type Tab = "VIEW" | "IMPORT";

function groupByDay(blocks: ScheduleBlock[]): { dayOfWeek: number; blocks: ScheduleBlock[] }[] {
  return [1, 2, 3, 4, 5]
    .map((dayOfWeek) => ({
      dayOfWeek,
      blocks: blocks.filter((b) => b.dayOfWeek === dayOfWeek).sort((a, b) => a.startTime.localeCompare(b.startTime)),
    }))
    .filter((day) => day.blocks.length > 0);
}

function ViewTab({ blocks, emptyLabel }: { blocks: ScheduleBlock[]; emptyLabel: string }) {
  const days = groupByDay(blocks);

  if (days.length === 0) {
    return (
      <Card className="text-center py-10">
        <p className="text-sm text-[var(--ink-500)]">{emptyLabel}</p>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
      {days.map(({ dayOfWeek, blocks: dayBlocks }) => (
        <div key={dayOfWeek} className="flex flex-col gap-2">
          <p className="text-xs font-bold uppercase tracking-wide text-[var(--ink-500)] px-1">{DAY_LABELS[dayOfWeek]}</p>
          <div className="flex flex-col gap-2">
            {dayBlocks.map((block) => (
              <Card key={block.id} className="p-3.5">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <p className="text-[13px] font-semibold text-[var(--ink-900)] leading-snug">{block.title}</p>
                  <ScheduleSourceBadge source={block.source} />
                </div>
                <p className="text-[12px] text-[var(--ink-500)] tabular-nums">
                  {block.startTime}–{block.endTime}
                </p>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// Self-service AAO import (docs/capstone-officehours-plan.md §5.1,
// capstone-api-endpoints.md §4) — role-aware single route, matching the
// pattern already used by /dashboard and /dashboard/bookings. Students see
// their own class timetable; lecturers see their teaching timetable. Both
// self-upload their own official AAO export via the same TimetableImport
// used by Admin's on-behalf-of fallback (app/(dashboard)/dashboard/admin/schedule).
export default function SchedulePage() {
  const { user } = useAuth();
  const isStudent = user?.role === "STUDENT";

  const [tab, setTab] = useState<Tab>("VIEW");
  const [entries, setEntries] = useState<ScheduleBlock[]>(() =>
    isStudent ? getMockStudentScheduleBlocks() : getMockScheduleBlocks()
  );
  const [history, setHistory] = useState<ScheduleImportHistoryEntry[]>(() => getMockMyScheduleImportHistory());

  const subtitle = isStudent
    ? "Your class timetable — import your own official AAO export so booking never clashes with class."
    : "Your teaching timetable — import your own official AAO export, or ask admin for a manual fix.";

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--ink-900)] mb-1">My Schedule</h1>
        <p className="text-sm text-[var(--ink-600)]">{subtitle}</p>
      </div>

      <p className="text-[12.5px] text-[var(--ink-500)] bg-[var(--paper-50)] border border-[var(--paper-200)] rounded-lg px-3.5 py-2.5 flex items-center gap-2">
        {tab === "VIEW" ? <Info className="w-3.5 h-3.5 shrink-0" strokeWidth={2} /> : <FileUp className="w-3.5 h-3.5 shrink-0" strokeWidth={2} />}
        {tab === "VIEW"
          ? "This feeds conflict-free slot matching when you browse lecturers — keep it current by re-importing each semester."
          : "Only accepts the genuine AAO timetable export — the same file the school issues you, unedited."}
      </p>

      <FilterTabs
        options={[
          { value: "VIEW" as Tab, label: isStudent ? "My Classes" : "My Teaching" },
          { value: "IMPORT" as Tab, label: "Import" },
        ]}
        value={tab}
        onChange={setTab}
      />

      {tab === "VIEW" && (
        <ViewTab
          blocks={entries}
          emptyLabel={isStudent ? "No class timetable on file — import your AAO export to get started." : "No teaching schedule on file — import your AAO export to get started."}
        />
      )}
      {tab === "IMPORT" && (
        <TimetableImport
          entries={entries}
          setEntries={setEntries}
          history={history}
          setHistory={setHistory}
          heading="Upload your timetable PDF"
          description="Parses your official AAO 'lịch học' export entirely in your browser (day-column + room-anchor clustering) — nothing is uploaded to a server. Re-importing replaces your existing entries for this semester."
          buildEntry={(row, dayOfWeek, id): ScheduleBlock => ({
            id,
            title: row.subjectCode !== "N/A" ? `${row.subjectName} (${row.subjectCode})` : row.subjectName,
            dayOfWeek,
            startTime: row.startTime,
            endTime: row.endTime,
            source: "IMPORTED",
          })}
        />
      )}
    </div>
  );
}
