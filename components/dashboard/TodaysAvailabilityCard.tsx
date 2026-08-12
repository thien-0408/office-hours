import Link from "next/link";
import { Clock } from "lucide-react";
import { Card } from "./Card";
import type { TodayAvailabilitySlot } from "@/lib/office-hours/types";

const timeFormatter = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" });

// Student dashboard's "what's open today, right now" widget — surfaced
// before the student starts browsing lecturer-by-lecturer. Unlike
// SlotsTodayList (single-lecturer, time-only pills), this spans every
// lecturer, so each row shows who and links straight to their slot picker.
export function TodaysAvailabilityCard({ slots }: { slots: TodayAvailabilitySlot[] }) {
  if (slots.length === 0) {
    return (
      <Card className="text-center py-6">
        <p className="text-[13px] text-[var(--ink-500)]">
          No open, conflict-free slots left today — try browsing the full week.
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-0 overflow-hidden">
      <div className="divide-y divide-[var(--paper-100)]">
        {slots.map((slot, i) => (
          <Link
            key={`${slot.lecturerId}-${slot.startAt}-${i}`}
            href={`/dashboard/lecturers/${slot.lecturerId}/slots`}
            className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-[var(--paper-50)] transition-colors"
          >
            <div className="min-w-0">
              <p className="text-[13.5px] font-semibold text-[var(--ink-900)] truncate">{slot.lecturerName}</p>
              {slot.department && <p className="text-[12px] text-[var(--ink-500)] truncate">{slot.department}</p>}
            </div>
            <span className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-bold tabular-nums bg-[var(--brand-50)] text-[var(--brand-700)] border border-[var(--brand-100)]">
              <Clock className="w-3 h-3" strokeWidth={2.5} />
              {timeFormatter.format(new Date(slot.startAt))}
            </span>
          </Link>
        ))}
      </div>
    </Card>
  );
}
