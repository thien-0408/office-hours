"use client";

import { Button } from "@/components/ui/button";
import type { BookableSlot } from "@/lib/office-hours/types";
import { useI18n } from "@/i18n/provider";
import { formatDate, formatTime } from "@/i18n/formatters";

function groupByDay(slots: BookableSlot[]): { dateKey: string; slots: BookableSlot[] }[] {
  const groups = new Map<string, BookableSlot[]>();
  for (const slot of slots) {
    const dateKey = slot.startAt.slice(0, 10);
    const bucket = groups.get(dateKey);
    if (bucket) bucket.push(slot);
    else groups.set(dateKey, [slot]);
  }
  return Array.from(groups.entries()).map(([dateKey, daySlots]) => ({ dateKey, slots: daySlots }));
}

// Restrained (DESIGN.md §1) — plain buttons in a day-column grid, no glass.
export function WeekSlotGrid({
  slots,
  onSelectSlot,
}: {
  slots: BookableSlot[];
  onSelectSlot: (slot: BookableSlot) => void;
}) {
  const { locale, t } = useI18n();
  const days = groupByDay(slots);

  if (days.length === 0) {
    return <p className="text-sm text-[var(--ink-500)] text-center py-8">{t("common.noSlotsWeek")}</p>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
      {days.map(({ dateKey, slots: daySlots }) => (
        <div key={dateKey} className="flex flex-col gap-2">
          <p className="text-xs font-bold uppercase tracking-wide text-[var(--ink-500)] px-1">
            {formatDate(new Date(dateKey), locale, { weekday: "short", month: "short", day: "numeric" })}
          </p>
          <div className="flex flex-col gap-1.5">
            {daySlots.map((slot) => {
              const disabled = !slot.available || slot.conflict;
              return (
                <Button variant="bare" size="bare"
                  key={slot.id}
                  type="button"
                  disabled={disabled}
                  title={slot.conflict ? t("common.conflictBooking") : undefined}
                  onClick={() => onSelectSlot(slot)}
                  className={`px-3 py-2 rounded-xl text-[13px] font-bold tabular-nums text-center transition-colors ${
                    disabled
                      ? "bg-[var(--paper-100)] text-[var(--ink-400)] cursor-not-allowed"
                      : "bg-[var(--brand-50)] text-[var(--brand-700)] hover:bg-[var(--brand-100)]"
                  }`}
                >
                  {formatTime(new Date(slot.startAt), locale)}
                </Button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
