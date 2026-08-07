"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Card } from "./Card";

// Self-contained week-strip — no external calendar lib yet. react-day-picker is
// deferred (docs/DASHBOARD-UPGRADE.md Phase 3+) to the slot picker, which needs
// real date-range logic; this widget only needs "pick a nearby day."
const monthFormatter = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" });
const weekdayFormatter = new Intl.DateTimeFormat("en-US", { weekday: "short" });

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function isSameDay(a: Date, b: Date): boolean {
  return a.toDateString() === b.toDateString();
}

export function MiniCalendar() {
  const today = new Date();
  const [anchor, setAnchor] = useState(today);
  const [selected, setSelected] = useState(today);

  const days = [-2, -1, 0, 1, 2].map((offset) => addDays(anchor, offset));

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={() => setAnchor((d) => addDays(d, -5))}
          className="flex items-center justify-center w-7 h-7 rounded-full text-[var(--ink-500)] hover:bg-[var(--brand-50)] hover:text-[var(--brand-700)] transition-colors"
          aria-label="Previous days"
        >
          <ChevronLeft className="w-4 h-4" strokeWidth={2} />
        </button>
        <p className="text-sm font-bold text-[var(--ink-900)]">{monthFormatter.format(anchor)}</p>
        <button
          type="button"
          onClick={() => setAnchor((d) => addDays(d, 5))}
          className="flex items-center justify-center w-7 h-7 rounded-full text-[var(--ink-500)] hover:bg-[var(--brand-50)] hover:text-[var(--brand-700)] transition-colors"
          aria-label="Next days"
        >
          <ChevronRight className="w-4 h-4" strokeWidth={2} />
        </button>
      </div>

      <div className="grid grid-cols-5 gap-1.5 text-center">
        {days.map((day) => {
          const selectedDay = isSameDay(day, selected);
          const isToday = isSameDay(day, today);
          return (
            <button
              key={day.toISOString()}
              type="button"
              onClick={() => setSelected(day)}
              className={`flex flex-col items-center gap-1 py-2 rounded-xl text-xs font-semibold transition-colors ${
                selectedDay
                  ? "bg-[var(--rose-500)] text-white"
                  : isToday
                    ? "ring-1 ring-inset ring-[var(--rose-500)] text-[var(--rose-700)]"
                    : "text-[var(--ink-600)] hover:bg-[var(--paper-100)]"
              }`}
            >
              <span className="text-[10px] uppercase opacity-80">{weekdayFormatter.format(day)}</span>
              <span className="tabular-nums">{day.getDate()}</span>
            </button>
          );
        })}
      </div>
    </Card>
  );
}
