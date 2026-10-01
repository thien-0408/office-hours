"use client";

import Link from "next/link";
import { X } from "lucide-react";
import { BOOKING_STATUS_CONFIG, HUE_TOKENS } from "@/lib/ui/status-hues";
import type { Booking } from "@/lib/office-hours/types";
import { Card } from "./Card";
import { useI18n } from "@/i18n/provider";
import { formatDate, formatTime } from "@/i18n/formatters";

function startOfDay(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

// Groups by calendar day (bookings are assumed sorted by the caller).
function groupByDay(bookings: Booking[]): { key: number; date: Date; items: Booking[] }[] {
  const groups = new Map<number, { key: number; date: Date; items: Booking[] }>();
  for (const b of bookings) {
    const date = new Date(b.startAt);
    const key = startOfDay(date);
    const group = groups.get(key) ?? { key, date, items: [] };
    group.items.push(b);
    groups.set(key, group);
  }
  return [...groups.values()];
}

export function UpcomingList({
  bookings,
  filterDay = null,
  onClearFilter,
}: {
  bookings: Booking[];
  filterDay?: Date | null;
  onClearFilter?: () => void;
}) {
  const { locale, t } = useI18n();

  function dayLabel(date: Date): string {
    const diffDays = Math.round((startOfDay(date) - startOfDay(new Date())) / 86_400_000);
    if (diffDays === 0) return t("dashboard.today");
    if (diffDays === 1) return t("dashboard.tomorrow");
    return formatDate(date, locale, { weekday: "short", day: "numeric", month: "short" });
  }

  const visible = filterDay ? bookings.filter((b) => startOfDay(new Date(b.startAt)) === startOfDay(filterDay)) : bookings;

  const filterChip = filterDay && (
    <div className="mb-2.5 flex items-center justify-between gap-2 rounded-xl bg-[var(--rose-100)] px-3 py-1.5 text-[12px] font-semibold text-[var(--rose-700)]">
      <span>{t("dashboard.filteringBy", { day: dayLabel(filterDay) })}</span>
      <button type="button" onClick={onClearFilter}
      className="inline-flex items-center gap-1 hover:underline">
        {t("dashboard.clearDayFilter")}
        <X className="h-3 w-3" strokeWidth={2.5} />
      </button>
    </div>
  );

  if (visible.length === 0) {
    return (
      <>
        {filterChip}
        <Card className="py-6 text-center">
          <p className="text-[13px] text-[var(--ink-500)]">
            {filterDay ? t("dashboard.noSessionsOnDay") : t("common.noCalendarItems")}
          </p>
          {!filterDay && (
            <Link href="/dashboard/lecturers" className="mt-2 inline-block text-[13px] font-semibold text-[var(--brand-600)] hover:underline">
              {t("dashboard.findSlot")}
            </Link>
          )}
        </Card>
      </>
    );
  }

  return (
    <>
      {filterChip}
      <div className="flex flex-col gap-4">
        {groupByDay(visible).map((group) => (
          <div key={group.key}>
            <p className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--ink-500)]">{dayLabel(group.date)}</p>
            <div className="flex flex-col gap-2">
              {group.items.map((booking) => {
                const tokens = HUE_TOKENS[BOOKING_STATUS_CONFIG[booking.status].hue];
                return (
                  <Link
                    key={booking.id}
                    href={`/dashboard/bookings/${booking.id}`}
                    className="flex items-center gap-3 rounded-xl border border-[var(--paper-200)] bg-white py-2.5 pl-2.5 pr-3 transition-colors hover:border-[var(--brand-300)]"
                  >
                    <span className="w-16 shrink-0 rounded-lg bg-[var(--paper-100)] py-1.5 text-center text-[11.5px] font-bold tabular-nums text-[var(--ink-700)]">
                      {formatTime(new Date(booking.startAt), locale)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13px] font-semibold text-[var(--ink-900)]">{booking.lecturerName}</p>
                      <p className="truncate text-[11.5px] text-[var(--ink-500)]">{booking.topic ?? booking.department ?? t("common.officeHours")}</p>
                    </div>
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ background: tokens.dot }}
                      title={BOOKING_STATUS_CONFIG[booking.status].label}
                    />
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
