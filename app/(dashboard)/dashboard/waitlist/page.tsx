"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronDown, ShieldAlert } from "lucide-react";
import { ConfirmModal } from "@/components/ConfirmModal";
import { useToast } from "@/components/ToastProvider";
import { Card } from "@/components/dashboard/Card";
import { WaitlistStatusBadge } from "@/components/dashboard/WaitlistStatusBadge";
import { getMockWaitlistEntries } from "@/lib/office-hours/mock-data";
import type { WaitlistEntry } from "@/lib/office-hours/types";
import { formatDate, formatTime } from "@/i18n/formatters";
import { useI18n } from "@/i18n/provider";
import { Button } from "@/components/ui/button";
import { FilterTabs } from "@/components/dashboard/FilterTabs";

type Filter = "ALL" | "WAITING" | "OFFERED";

function secondsUntil(iso?: string): number {
  if (!iso) return 0;
  return Math.max(0, Math.floor((new Date(iso).getTime() - Date.now()) / 1000));
}

function formatCountdown(totalSeconds: number): string {
  const totalMinutes = Math.floor(totalSeconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}:${minutes.toString().padStart(2, "0")}`;
}

function WaitlistEntryCard({
  entry,
  onAccept,
  onDecline,
  expanded,
  onToggle,
}: {
  entry: WaitlistEntry;
  onAccept: () => void;
  onDecline: () => void;
  expanded: boolean;
  onToggle: () => void;
}) {
  const { locale, t } = useI18n();
  const [remainingSeconds, setRemainingSeconds] = useState(() => secondsUntil(entry.offeredExpiresAt));

  useEffect(() => {
    if (entry.status !== "OFFERED" || !entry.offeredExpiresAt) return;
    const timer = window.setInterval(() => setRemainingSeconds(secondsUntil(entry.offeredExpiresAt)), 1000);
    return () => window.clearInterval(timer);
  }, [entry.offeredExpiresAt, entry.status]);

  if (entry.status === "OFFERED" && entry.offeredStartAt && entry.offeredExpiresAt) {
    return (
      <Card className="rounded-[15px] border-[var(--info-500)] p-[18px] shadow-[0_8px_24px_rgba(124,92,255,0.1)]">
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={expanded}
          aria-controls={`waitlist-entry-${entry.id}`}
          className="flex w-full items-start justify-between gap-3.5 text-left"
        >
          <div className="min-w-0">
            <WaitlistStatusBadge status={entry.status} labelOverride={t("waitlist.offerWaiting")} />
            <h3 className="mt-[11px] text-sm font-semibold tracking-[-0.02em] text-[var(--ink-900)]">{entry.lecturerName}</h3>
            <p className="mt-1 text-[11px] text-[var(--ink-500)]">
              {entry.department || t("waitlist.requestedSlot")} · {entry.desiredSlotLabel}
            </p>
          </div>
          <div className="flex shrink-0 items-start gap-3">
            <div className="grid justify-items-end gap-1.5 text-[11px] font-bold text-[var(--warning-700)]">
              <span>{t("waitlist.expiresIn")}</span>
              <strong className="text-lg tracking-[-0.04em] text-[var(--ink-900)] tabular-nums">
                {remainingSeconds > 0 ? formatCountdown(remainingSeconds) : t("waitlist.status.expired")}
              </strong>
            </div>
            <ChevronDown className={`mt-0.5 h-4 w-4 text-[var(--ink-400)] transition-transform ${expanded ? "rotate-180" : ""}`} aria-hidden="true" />
          </div>
        </button>

        {expanded && (
          <div id={`waitlist-entry-${entry.id}`}>
            <div className="my-4 flex flex-wrap gap-x-[18px] gap-y-2 border-y border-[var(--paper-100)] py-3 text-[11px] text-[var(--ink-700)]">
              <span>{formatDate(entry.offeredStartAt, locale, { weekday: "short", month: "long", day: "numeric" })}</span>
              <span>{formatTime(entry.offeredStartAt, locale)}</span>
              <span>{entry.department || t("waitlist.requestedSlot")}</span>
            </div>
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            type="button"
            onClick={onAccept}
            className="min-h-[38px] border border-[var(--brand-500)] font-extrabold shadow-[0_5px_14px_rgba(52,101,224,0.17)]"
          >
            {t("waitlist.acceptOffer")}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onDecline}
            className="min-h-[38px] font-extrabold text-[var(--ink-700)] hover:border-[var(--brand-300)] hover:bg-[var(--brand-50)] hover:text-[var(--brand-700)]"
          >
            {t("waitlist.decline")}
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="flex items-center justify-between gap-4 rounded-[15px] p-[15px_17px]">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        aria-controls={`waitlist-entry-${entry.id}`}
        className="flex w-full items-center justify-between gap-4 text-left"
      >
        <div className="min-w-0">
          <h3 className="text-sm font-semibold tracking-[-0.02em] text-[var(--ink-900)]">{entry.lecturerName}</h3>
          <p className="mt-1 text-[11px] text-[var(--ink-500)]">
            {entry.department || t("waitlist.requestedSlot")} · {entry.desiredSlotLabel}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          {entry.status === "WAITING" ? (
            <span className="whitespace-nowrap text-xs font-extrabold text-[var(--brand-700)]">
              {t("waitlist.position")} #{entry.position}
            </span>
          ) : (
            <WaitlistStatusBadge status={entry.status} />
          )}
          <ChevronDown className={`h-4 w-4 text-[var(--ink-400)] transition-transform ${expanded ? "rotate-180" : ""}`} aria-hidden="true" />
        </div>
      </button>
      {expanded && (
        <div id={`waitlist-entry-${entry.id}`}
        className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-[var(--paper-100)] pt-3 text-[11px] text-[var(--ink-600)]">
          <span>{t("waitlist.requestedSlot")}: {entry.desiredSlotLabel}</span>
          {entry.status === "WAITING" && <span>{t("waitlist.position")} #{entry.position}</span>}
        </div>
      )}
    </Card>
  );
}

export default function WaitlistPage() {
  const { t } = useI18n();
  const [entries, setEntries] = useState<WaitlistEntry[]>(() => getMockWaitlistEntries());
  const [expandedId, setExpandedId] = useState<number | null>(() => getMockWaitlistEntries().find((entry) => entry.status === "OFFERED")?.id ?? null);
  const [filter, setFilter] = useState<Filter>("ALL");
  const [pendingDeclineId, setPendingDeclineId] = useState<number | null>(null);
  const toast = useToast();

  const waitingCount = entries.filter((e) => e.status === "WAITING").length;
  const offeredCount = entries.filter((e) => e.status === "OFFERED").length;
  const filtered = filter === "ALL" ? entries : entries.filter((e) => e.status === filter);
  const filterOptions: { value: Filter; label: string }[] = [
    { value: "ALL", label: t("waitlist.all") },
    { value: "WAITING", label: t("waitlist.waiting") },
    { value: "OFFERED", label: t("waitlist.offered") },
  ];

  function accept(id: number) {
    setEntries((list) => list.map((e) => (e.id === id ? { ...e, status: "FULFILLED" } : e)));
    setExpandedId(null);
    toast.success(t("waitlist.offerAccepted"));
  }

  function decline(id: number) {
    setEntries((list) => list.map((e) => (e.id === id ? { ...e, status: "CANCELLED" } : e)));
    setExpandedId(null);
  }

  return (
    <div className="w-full max-w-[1060px]">
      <div className="mb-6 flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="mb-2 flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.16em] text-[var(--brand-700)]">
            <span className="h-0.5 w-[18px] rounded-full bg-[var(--brand-500)]" />
            {t("waitlist.eyebrow")}
          </p>
          <h1 className="text-[clamp(27px,3vw,36px)] font-bold leading-[1.08] tracking-[-0.055em] text-[var(--ink-900)]">
            {t("waitlist.title")}
          </h1>
          <p className="mt-2 max-w-[55ch] text-[13px] leading-[1.6] text-[var(--ink-500)]">{t("waitlist.description")}</p>
        </div>
        <Link
          href="/dashboard/lecturers"
          className="inline-flex min-h-[38px] shrink-0 items-center justify-center rounded-[10px] border border-[var(--paper-200)] bg-white px-3.5 py-2 text-xs font-extrabold text-[var(--ink-700)] transition-colors hover:border-[var(--brand-300)] hover:bg-[var(--brand-50)] hover:text-[var(--brand-700)]"
        >
          {t("waitlist.browseOpenSlots")}
        </Link>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-2.5">
        <div className="rounded-[13px] border border-[var(--paper-200)] bg-white px-4 py-3.5 shadow-[0_7px_22px_rgba(11,27,73,0.035)]">
          <span className="block text-[10px] font-bold text-[var(--ink-500)]">{t("waitlist.inQueue")}</span>
          <strong className="mt-1 block text-[22px] tracking-[-0.06em] text-[var(--ink-900)] tabular-nums">{waitingCount}</strong>
        </div>
        <div className="rounded-[13px] border border-[var(--paper-200)] bg-white px-4 py-3.5 shadow-[0_7px_22px_rgba(11,27,73,0.035)]">
          <span className="block text-[10px] font-bold text-[var(--ink-500)]">{t("waitlist.offersWaiting")}</span>
          <strong className="mt-1 block text-[22px] tracking-[-0.06em] text-[var(--info-700)] tabular-nums">{offeredCount}</strong>
        </div>
      </div>

      <FilterTabs variant="compact" className="mb-5" options={filterOptions} value={filter} onChange={setFilter} />

      {filtered.length === 0 ? (
        <Card className="p-[34px] text-center">
          <p className="text-sm text-[var(--ink-500)]">{t("waitlist.nothing")}</p>
        </Card>
      ) : (
        <div className="grid w-full gap-[11px]">
          {filtered.map((entry) => (
            <WaitlistEntryCard
              key={entry.id}
              entry={entry}
              onAccept={() => accept(entry.id)}
              onDecline={() => setPendingDeclineId(entry.id)}
              expanded={expandedId === entry.id}
              onToggle={() => setExpandedId((current) => (current === entry.id ? null : entry.id))}
            />
          ))}
        </div>
      )}

      <ConfirmModal
        open={pendingDeclineId !== null}
        icon={ShieldAlert}
        title={t("waitlist.declineQuestion")}
        description={t("waitlist.declineDescription")}
        confirmLabel={t("waitlist.declineOffer")}
        cancelLabel={t("bookings.neverMind")}
        onCancel={() => setPendingDeclineId(null)}
        onConfirm={() => {
          if (pendingDeclineId !== null) decline(pendingDeclineId);
          setPendingDeclineId(null);
          toast.show("neutral", t("waitlist.offerDeclined"));
        }}
      />
    </div>
  );
}
