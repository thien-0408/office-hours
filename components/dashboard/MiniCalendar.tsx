"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Card } from "./Card";
import { useI18n } from "@/i18n/provider";
import { formatDate } from "@/i18n/formatters";
import { Button } from "@/components/ui/button";

// Self-contained week-strip — no external calendar lib yet. react-day-picker is
// deferred (docs/DASHBOARD-UPGRADE.md Phase 3+) to the slot picker, which needs
// real date-range logic; this widget only needs "pick a nearby day."
function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function isSameDay(a: Date, b: Date): boolean {
  return a.toDateString() === b.toDateString();
}

// Optional `markedDates` draws a dot under days that have a booking. Passing
// `selected` + `onSelect` makes the widget controlled (null = nothing selected,
// so the dashboard can use a click as a day filter); omit both for the
// original self-contained behavior used by the lecturer/admin rails.
export function MiniCalendar({
  markedDates = [],
  selected: controlledSelected,
  onSelect,
}: {
  markedDates?: Date[];
  selected?: Date | null;
  onSelect?: (day: Date | null) => void;
}) {
  const { locale, t } = useI18n();
  const today = new Date();
  const [anchor, setAnchor] = useState(today);
  const [localSelected, setLocalSelected] = useState<Date | null>(today);
  const controlled = onSelect !== undefined;
  const selected = controlled ? (controlledSelected ?? null) : localSelected;

  const days = [-2, -1, 0, 1, 2].map((offset) => addDays(anchor, offset));

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4">
        <Button variant="ghost-brand" size="icon-sm"
          type="button"
          onClick={() => setAnchor((d) => addDays(d, -5))}
          aria-label={t("common.previousDays")}
        >
          <ChevronLeft className="w-4 h-4" strokeWidth={2} />
        </Button>
        <p className="text-sm font-bold text-[var(--ink-900)]">{formatDate(anchor, locale, { month: "long", year: "numeric" })}</p>
        <Button variant="ghost-brand" size="icon-sm"
          type="button"
          onClick={() => setAnchor((d) => addDays(d, 5))}
          aria-label={t("common.nextDays")}
        >
          <ChevronRight className="w-4 h-4" strokeWidth={2} />
        </Button>
      </div>

      <div className="grid grid-cols-5 gap-1.5 text-center">
        {days.map((day) => {
          const selectedDay = selected !== null && isSameDay(day, selected);
          const hasBooking = markedDates.some((d) => isSameDay(d, day));
          const isToday = isSameDay(day, today);
          return (
            <Button variant="bare" size="bare"
              key={day.toISOString()}
              type="button"
              onClick={() => {
                if (!controlled) setLocalSelected(day);
                else onSelect(selected !== null && isSameDay(day, selected) ? null : day);
              }}
              aria-pressed={selectedDay}
              className={`flex flex-col items-center gap-1 py-2 rounded-xl text-xs font-semibold transition-colors ${
                selectedDay
                  ? "bg-[var(--rose-500)] text-white"
                  : isToday
                    ? "ring-1 ring-inset ring-[var(--rose-500)] text-[var(--rose-700)]"
                    : "text-[var(--ink-600)] hover:bg-[var(--paper-100)]"
              }`}
            >
              <span className="text-[10px] uppercase opacity-80">{formatDate(day, locale, { weekday: "short" })}</span>
              <span className="tabular-nums">{day.getDate()}</span>
              <span
                className={`h-1 w-1 rounded-full ${hasBooking ? (selectedDay ? "bg-white" : "bg-[var(--rose-500)]") : "bg-transparent"}`}
                aria-hidden
              />
            </Button>
          );
        })}
      </div>
    </Card>
  );
}
