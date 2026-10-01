"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarClock, ChevronRight, MessageSquarePlus, Search } from "lucide-react";
import type { Booking } from "@/lib/office-hours/types";
import { StatusBadge } from "@/components/StatusBadge";
import { useI18n } from "@/i18n/provider";
import { formatDate, formatTime } from "@/i18n/formatters";
import type { MessageKey } from "@/i18n";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card } from "./Card";

type T = (key: MessageKey, values?: Record<string, string | number>) => string;

// Re-renders every minute so the countdown stays honest without a per-second tick.
export function useNow(intervalMs = 60_000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

export function countdownLabel(startAt: string, now: number, t: T): string {
  const diffMin = Math.max(0, Math.floor((new Date(startAt).getTime() - now) / 60_000));
  if (diffMin < 1) return t("dashboard.startsNow");
  if (diffMin < 60) return t("dashboard.inMinutes", { m: diffMin });
  if (diffMin < 60 * 24) return t("dashboard.inHoursMinutes", { h: Math.floor(diffMin / 60), m: diffMin % 60 });
  return t("dashboard.inDaysHours", { d: Math.floor(diffMin / 1440), h: Math.floor((diffMin % 1440) / 60) });
}

export function NextUpCard({ booking, onReschedule }: { booking: Booking | null; onReschedule?: (booking: Booking) => void }) {
  const { locale, t } = useI18n();
  const now = useNow();

  if (!booking) {
    return (
      <Card className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--ink-400)]">{t("dashboard.nextUp")}</p>
          <p className="mt-1 text-base font-semibold text-[var(--ink-900)]">{t("dashboard.noUpcomingTitle")}</p>
          <p className="text-[13px] text-[var(--ink-500)]">{t("dashboard.noUpcomingDescription")}</p>
        </div>
        <Link
          href="/dashboard/lecturers"
          className={buttonVariants()}
        >
          <Search className="h-4 w-4" strokeWidth={2} />
          {t("dashboard.findSlot")}
        </Link>
      </Card>
    );
  }

  const start = new Date(booking.startAt);
  return (
    <Card className="relative overflow-hidden p-0">
      <span className="absolute inset-y-0 left-0 w-1 bg-[var(--rose-500)]" aria-hidden />
      <div className="flex flex-col gap-4 p-5 pl-6 sm:flex-row sm:items-center">
        <div className="flex w-full shrink-0 flex-row items-center gap-3 rounded-2xl bg-[var(--rose-600)] px-4 py-3 text-white shadow-[0_8px_18px_-8px_var(--rose-600)] sm:w-28 sm:flex-col sm:gap-0 sm:text-center">
          <span className="text-[10px] font-bold uppercase tracking-[0.14em]">{formatDate(start, locale, { weekday: "short" })}</span>
          <span className="text-3xl font-bold leading-none tabular-nums sm:my-1">{start.getDate()}</span>
          <span className="text-[12px] font-semibold tabular-nums">{formatTime(start, locale)}</span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--rose-700)]">{t("dashboard.nextUp")}</span>
            <span className="inline-flex items-center gap-1 text-[12px] font-semibold tabular-nums text-[var(--ink-600)]">
              <CalendarClock className="h-3.5 w-3.5" strokeWidth={2} />
              {countdownLabel(booking.startAt, now, t)}
            </span>
          </div>
          <h3 className="mt-1 truncate text-lg font-semibold tracking-[-0.01em] text-[var(--ink-900)]">{booking.lecturerName}</h3>
          <p className="truncate text-[13px] text-[var(--ink-500)]">
            {booking.department ?? t("common.officeHours")} · {booking.topic ?? t("dashboard.noTopic")}
          </p>
          <div className="mt-2.5">
            <StatusBadge status={booking.status} />
          </div>
        </div>

        <div className="flex shrink-0 flex-row gap-2 sm:flex-col">
          <Link
            href={`/dashboard/bookings/${booking.id}`}
            className={buttonVariants({ className: "flex-1" })}
          >
            {booking.topic ? (
              <>
                {t("dashboard.viewDetails")}
                <ChevronRight className="h-4 w-4" strokeWidth={2} />
              </>
            ) : (
              <>
                <MessageSquarePlus className="h-4 w-4" strokeWidth={2} />
                {t("dashboard.addTopic")}
              </>
            )}
          </Link>
          {onReschedule && (
            <Button variant="outline" className="flex-1" onClick={() => onReschedule(booking)}>
              {t("dashboard.reschedule")}
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
