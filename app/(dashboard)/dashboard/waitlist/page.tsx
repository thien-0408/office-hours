"use client";

import { useState } from "react";
import { Clock, ListPlus, ShieldAlert } from "lucide-react";
import { ConfirmModal } from "@/components/ConfirmModal";
import { useToast } from "@/components/ToastProvider";
import { Card } from "@/components/dashboard/Card";
import { FilterTabs } from "@/components/dashboard/FilterTabs";
import { StatTile } from "@/components/dashboard/StatTile";
import { WaitlistStatusBadge } from "@/components/dashboard/WaitlistStatusBadge";
import { getMockWaitlistEntries } from "@/lib/office-hours/mock-data";
import type { WaitlistEntry } from "@/lib/office-hours/types";
import { ACCENT_TOKENS } from "@/lib/ui/accent-palette";
import { HUE_TOKENS } from "@/lib/ui/status-hues";

type Filter = "ALL" | "WAITING" | "OFFERED";

const timeFormatter = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" });

function expiresInLabel(iso: string): string {
  const diffMin = Math.round((new Date(iso).getTime() - new Date().getTime()) / 60000);
  if (diffMin <= 0) return "expired";
  if (diffMin < 60) return `${diffMin}m left`;
  return `${Math.round(diffMin / 60)}h left`;
}

function WaitlistEntryCard({
  entry,
  onAccept,
  onDecline,
}: {
  entry: WaitlistEntry;
  onAccept: () => void;
  onDecline: () => void;
}) {
  return (
    <Card className="flex flex-col gap-2.5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-[var(--ink-900)]">{entry.lecturerName}</p>
          <p className="text-[12.5px] text-[var(--ink-500)]">
            {entry.department} · {entry.desiredSlotLabel}
          </p>
        </div>
        <WaitlistStatusBadge status={entry.status} />
      </div>

      {entry.status === "WAITING" && (
        <p className="text-[13px] text-[var(--ink-600)] tabular-nums">Position #{entry.position} in queue</p>
      )}

      {entry.status === "OFFERED" && entry.offeredStartAt && entry.offeredExpiresAt && (
        <>
          <p className="text-[13px] text-[var(--ink-700)] tabular-nums">
            Offered: {timeFormatter.format(new Date(entry.offeredStartAt))} ·{" "}
            <span className="font-semibold text-[var(--warning-700)]">{expiresInLabel(entry.offeredExpiresAt)}</span>
          </p>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onAccept}
              className="px-3.5 py-2 rounded-xl bg-[var(--brand-500)] text-white text-[13px] font-bold hover:bg-[var(--brand-600)] transition-colors"
            >
              Accept
            </button>
            <button
              type="button"
              onClick={onDecline}
              className="px-3.5 py-2 rounded-xl border border-[var(--danger-100)] text-[var(--danger-700)] text-[13px] font-bold hover:bg-[var(--danger-100)] transition-colors"
            >
              Decline
            </button>
          </div>
        </>
      )}
    </Card>
  );
}

export default function WaitlistPage() {
  const [entries, setEntries] = useState<WaitlistEntry[]>(() => getMockWaitlistEntries());
  const [filter, setFilter] = useState<Filter>("ALL");
  const [pendingDeclineId, setPendingDeclineId] = useState<number | null>(null);
  const toast = useToast();

  const waitingCount = entries.filter((e) => e.status === "WAITING").length;
  const offeredCount = entries.filter((e) => e.status === "OFFERED").length;
  const filtered = filter === "ALL" ? entries : entries.filter((e) => e.status === filter);

  function accept(id: number) {
    setEntries((list) => list.map((e) => (e.id === id ? { ...e, status: "FULFILLED" } : e)));
    toast.success("Offer accepted");
  }

  function decline(id: number) {
    setEntries((list) => list.map((e) => (e.id === id ? { ...e, status: "CANCELLED" } : e)));
  }

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <h1 className="text-2xl font-bold text-[var(--ink-900)]">My Waitlist</h1>

      <div className="grid grid-cols-2 gap-4">
        <StatTile icon={ListPlus} tone={ACCENT_TOKENS.mint} value={waitingCount} label="In queue" />
        <StatTile icon={Clock} tone={HUE_TOKENS.info} value={offeredCount} label="Offers waiting" />
      </div>

      <FilterTabs
        options={[
          { value: "ALL", label: "All" },
          { value: "WAITING", label: "Waiting" },
          { value: "OFFERED", label: "Offered" },
        ]}
        value={filter}
        onChange={setFilter}
      />

      {filtered.length === 0 ? (
        <Card className="text-center py-10">
          <p className="text-sm text-[var(--ink-500)]">Nothing here.</p>
        </Card>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((entry) => (
            <WaitlistEntryCard
              key={entry.id}
              entry={entry}
              onAccept={() => accept(entry.id)}
              onDecline={() => setPendingDeclineId(entry.id)}
            />
          ))}
        </div>
      )}

      <ConfirmModal
        open={pendingDeclineId !== null}
        icon={ShieldAlert}
        title="Decline this offer?"
        description="The slot will be offered to the next person in the queue."
        confirmLabel="Decline offer"
        cancelLabel="Never mind"
        onCancel={() => setPendingDeclineId(null)}
        onConfirm={() => {
          if (pendingDeclineId !== null) decline(pendingDeclineId);
          setPendingDeclineId(null);
          toast.show("neutral", "Offer declined");
        }}
      />
    </div>
  );
}
