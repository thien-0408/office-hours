"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { CalendarClock, ShieldAlert } from "lucide-react";
import { ConfirmModal } from "@/components/ConfirmModal";
import { Card } from "@/components/dashboard/Card";
import { FilterTabs } from "@/components/dashboard/FilterTabs";
import { FormField, TextInput } from "@/components/dashboard/FormField";
import { SectionHeader } from "@/components/dashboard/SectionHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { getMockLecturerById, getMockLecturers, getMockRecurringSeries } from "@/lib/office-hours/mock-data";
import type { RecurringSeries } from "@/lib/office-hours/types";

const DAY_OPTIONS = [
  { value: "1", label: "Mon" },
  { value: "2", label: "Tue" },
  { value: "3", label: "Wed" },
  { value: "4", label: "Thu" },
  { value: "5", label: "Fri" },
];

const dateFormatter = new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric" });

// Next N occurrences of a weekday/time, starting from the next matching date
// on/after today — pure date math, derived during render, no persistence.
function nextOccurrences(dayOfWeek: number, count: number): Date[] {
  const dates: Date[] = [];
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  while (cursor.getDay() !== dayOfWeek) {
    cursor.setDate(cursor.getDate() + 1);
  }
  for (let i = 0; i < count; i++) {
    dates.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 7);
  }
  return dates;
}

function SeriesCard({ series, onCancel }: { series: RecurringSeries; onCancel: () => void }) {
  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-[var(--ink-900)]">{series.lecturerName}</p>
          <p className="text-[12.5px] text-[var(--ink-500)]">
            {series.department} · {DAY_OPTIONS.find((d) => Number(d.value) === series.dayOfWeek)?.label ?? "—"}s,{" "}
            {series.startTime}–{series.endTime} · {series.semester}
          </p>
        </div>
        <span
          className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11.5px] font-semibold whitespace-nowrap ${
            series.status === "ACTIVE"
              ? "bg-[var(--success-100)] text-[var(--success-700)]"
              : "bg-[var(--paper-100)] text-[var(--ink-600)]"
          }`}
        >
          {series.status === "ACTIVE" ? "Active" : series.status === "CANCELLED" ? "Cancelled" : "Ended"}
        </span>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {series.occurrences.map((occ) => (
          <span key={occ.id} className="inline-flex items-center gap-1.5 text-[12px] text-[var(--ink-600)] tabular-nums">
            <StatusBadge status={occ.status} />
          </span>
        ))}
      </div>

      {series.status === "ACTIVE" && (
        <button
          type="button"
          onClick={onCancel}
          className="text-[13px] font-semibold text-[var(--danger-700)] hover:underline w-fit"
        >
          Cancel series
        </button>
      )}
    </Card>
  );
}

export default function RecurringBookingClient() {
  const searchParams = useSearchParams();
  const prefilledLecturerId = Number(searchParams.get("lecturer") ?? "") || undefined;
  const prefilledLecturer = prefilledLecturerId ? getMockLecturerById(prefilledLecturerId) : undefined;

  const lecturers = getMockLecturers();
  const [lecturerId, setLecturerId] = useState<number>(prefilledLecturer?.id ?? lecturers[0].id);
  const [dayOfWeek, setDayOfWeek] = useState("2");
  const [time, setTime] = useState("10:00");
  const [semester, setSemester] = useState("Fall 2026");

  const [series, setSeries] = useState<RecurringSeries[]>(() => getMockRecurringSeries());
  const [created, setCreated] = useState(false);
  const [pendingCancelId, setPendingCancelId] = useState<number | null>(null);

  const selectedLecturer = lecturers.find((l) => l.id === lecturerId) ?? lecturers[0];
  const preview = nextOccurrences(Number(dayOfWeek), 4);

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const [hh, mm] = time.split(":").map(Number);
    const nextId = series.length === 0 ? 1 : Math.max(...series.map((s) => s.id)) + 1;
    setSeries((list) => [
      {
        id: nextId,
        lecturerName: selectedLecturer.name,
        department: selectedLecturer.department,
        dayOfWeek: Number(dayOfWeek),
        startTime: time,
        endTime: `${String(hh).padStart(2, "0")}:${String(mm + 30).padStart(2, "0")}`,
        semester,
        status: "ACTIVE",
        occurrences: preview.map((d, i) => ({ id: i + 1, startAt: d.toISOString(), status: "PENDING" })),
      },
      ...list,
    ]);
    setCreated(true);
  }

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-[var(--ink-900)] mb-1">Recurring Booking</h1>
        <p className="text-sm text-[var(--ink-600)]">Set up a weekly office-hours slot for the semester.</p>
      </div>

      <Card>
        <SectionHeader title="Set up a series" />
        <p className="text-[12.5px] text-[var(--ink-500)] bg-[var(--paper-50)] border border-[var(--paper-200)] rounded-lg px-3.5 py-2.5 mb-4 flex items-center gap-2">
          <CalendarClock className="w-3.5 h-3.5 shrink-0" strokeWidth={2} />
          Preview only — not wired to a real recurrence engine yet.
        </p>

        <form onSubmit={handleCreate} className="flex flex-col gap-4">
          <FormField label="Lecturer">
            <select
              value={lecturerId}
              onChange={(e) => setLecturerId(Number(e.target.value))}
              className="w-full rounded-xl border border-[var(--paper-200)] bg-white px-3.5 py-2.5 text-sm text-[var(--ink-900)] outline-none focus:ring-2 focus:ring-[var(--brand-300)]"
            >
              {lecturers.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name} — {l.department}
                </option>
              ))}
            </select>
          </FormField>

          <div className="flex flex-col gap-1.5">
            <span className="text-[12.5px] font-semibold text-[var(--ink-700)]">Day of week</span>
            <FilterTabs options={DAY_OPTIONS} value={dayOfWeek} onChange={setDayOfWeek} />
          </div>

          <div className="flex gap-4">
            <FormField label="Start time">
              <TextInput type="time" value={time} onChange={(e) => setTime(e.target.value)} />
            </FormField>
            <FormField label="Semester">
              <select
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                className="w-full rounded-xl border border-[var(--paper-200)] bg-white px-3.5 py-2.5 text-sm text-[var(--ink-900)] outline-none focus:ring-2 focus:ring-[var(--brand-300)]"
              >
                <option>Fall 2026</option>
                <option>Spring 2027</option>
              </select>
            </FormField>
          </div>

          <div>
            <span className="text-[12.5px] font-semibold text-[var(--ink-700)] block mb-1.5">Next occurrences</span>
            <div className="flex flex-wrap gap-1.5">
              {preview.map((d) => (
                <span
                  key={d.toISOString()}
                  className="px-2.5 py-1 rounded-full bg-[var(--brand-50)] text-[var(--brand-700)] text-[12px] font-semibold tabular-nums"
                >
                  {dateFormatter.format(d)}
                </span>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              className="px-4 py-2.5 rounded-xl bg-[var(--brand-500)] text-white text-sm font-bold hover:bg-[var(--brand-600)] transition-colors w-fit"
            >
              Create series
            </button>
            {created && <span className="text-[13px] text-[var(--success-700)] font-semibold">Series created</span>}
          </div>
        </form>
      </Card>

      <div>
        <SectionHeader title="Your series" />
        <div className="flex flex-col gap-3">
          {series.map((s) => (
            <SeriesCard key={s.id} series={s} onCancel={() => setPendingCancelId(s.id)} />
          ))}
        </div>
      </div>

      <ConfirmModal
        open={pendingCancelId !== null}
        icon={ShieldAlert}
        title="Cancel this series?"
        description="Future occurrences will be removed. Past sessions stay in your booking history."
        confirmLabel="Cancel series"
        cancelLabel="Never mind"
        onCancel={() => setPendingCancelId(null)}
        onConfirm={() => {
          setSeries((list) => list.map((s) => (s.id === pendingCancelId ? { ...s, status: "CANCELLED" } : s)));
          setPendingCancelId(null);
        }}
      />
    </div>
  );
}
