"use client";

import { useState } from "react";
import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";
import {
  getMockAllBookings,
  getMockLecturerBookings,
  getMockStudentBookings,
} from "@/lib/office-hours/mock-data";
import type { Booking, BookingStatus } from "@/lib/office-hours/types";
import { BOOKING_STATUS_CONFIG } from "@/lib/ui/status-hues";
import { BookingsTable } from "@/components/dashboard/BookingsTable";
import { ConfirmModal } from "@/components/ConfirmModal";
import { FilterTabs } from "@/components/dashboard/FilterTabs";
import { useToast } from "@/components/ToastProvider";
import { useI18n } from "@/i18n/provider";
import type { MessageKey } from "@/i18n";
import { Button } from "@/components/ui/button";

type StatusFilter = "ALL" | BookingStatus;

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "ALL", label: "All" },
  ...(Object.keys(BOOKING_STATUS_CONFIG) as BookingStatus[]).map((status) => ({
    value: status,
    label: BOOKING_STATUS_CONFIG[status].label,
  })),
];

function dataForRole(role: "STUDENT" | "LECTURER" | "ADMIN", t: (key: MessageKey) => string): {
  bookings: Booking[];
  perspective: "student" | "lecturer" | "admin";
  heading: string;
} {
  switch (role) {
    case "STUDENT":
      return { bookings: getMockStudentBookings(), perspective: "student", heading: t("nav.myBookings") };
    case "LECTURER":
      return { bookings: getMockLecturerBookings(), perspective: "lecturer", heading: t("nav.bookingsToReview") };
    case "ADMIN":
      return { bookings: getMockAllBookings(), perspective: "admin", heading: t("bookings.all") };
  }
}

const CANCELLABLE_STATUSES: BookingStatus[] = ["PENDING", "CONFIRMED"];

export default function BookingsPage() {
  const { user } = useAuth();
  const { t } = useI18n();
  const toast = useToast();
  // Lecturers land on a to-review-oriented view by default — this is a plain
  // useState initializer (evaluated once per mount), not an effect syncing
  // from a prop, so it doesn't trip react-hooks/set-state-in-effect.
  const [filter, setFilter] = useState<StatusFilter>(() => (user?.role === "LECTURER" ? "PENDING" : "ALL"));

  // Store-previous-value pattern (see the booking detail page) so the local
  // mutable copy re-seeds if the signed-in role changes, without a
  // setState-in-useEffect.
  const [prevRole, setPrevRole] = useState(user?.role);
  const [bookings, setBookings] = useState<Booking[]>(() => (user ? dataForRole(user.role, t).bookings : []));
  if (user && user.role !== prevRole) {
    setPrevRole(user.role);
    setBookings(dataForRole(user.role, t).bookings);
  }

  const [cancelTarget, setCancelTarget] = useState<Booking | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [bulkDeclineOpen, setBulkDeclineOpen] = useState(false);

  if (!user) return null;

  const { perspective, heading } = dataForRole(user.role, t);
  const statusOptions: { value: StatusFilter; label: string }[] = [
    { value: "ALL", label: t("waitlist.all") },
    ...(Object.keys(BOOKING_STATUS_CONFIG) as BookingStatus[]).map((status) => ({
      value: status,
      label: t((status === "NO_SHOW" ? "booking.status.noShow" : `booking.status.${status.toLowerCase()}`) as Parameters<typeof t>[0]),
    })),
  ];
  const filtered = filter === "ALL" ? bookings : bookings.filter((b) => b.status === filter);
  const isLecturer = user.role === "LECTURER";

  function toggleSelect(id: number) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function bulkSetStatus(status: BookingStatus) {
    setBookings((prev) => prev.map((b) => (selectedIds.has(b.id) ? { ...b, status } : b)));
    const count = selectedIds.size;
    setSelectedIds(new Set());
    const message = `${count} booking${count === 1 ? "" : "s"} ${status === "CONFIRMED" ? "confirmed" : "declined"}`;
    if (status === "CONFIRMED") toast.success(message);
    else toast.error(message);
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-2xl font-bold text-[var(--ink-900)]">{heading}</h1>
        <div className="flex items-center gap-4">
          {user.role === "STUDENT" && (
            <Link
              href="/dashboard/bookings/recurring"
              className="text-sm font-semibold text-[var(--brand-500)] no-underline hover:underline whitespace-nowrap"
            >
              {t("bookings.recurring")}
            </Link>
          )}
          <FilterTabs options={statusOptions} value={filter} onChange={setFilter} />
        </div>
      </div>

      {isLecturer && selectedIds.size > 0 && (
        <div className="flex items-center gap-3 rounded-xl border border-[var(--brand-200)] bg-[var(--brand-50)] px-4 py-2.5">
          <span className="text-sm font-semibold text-[var(--brand-700)]">
            {t("bookings.selected", { count: selectedIds.size })}
          </span>
          <div className="flex items-center gap-2 ml-auto">
            <Button
              type="button"
              onClick={() => bulkSetStatus("CONFIRMED")}
            >
              {t("bookings.confirmSelected")}
            </Button>
            <button
              type="button"
              onClick={() => setBulkDeclineOpen(true)}
              className="px-3.5 py-1.5 rounded-lg border border-[var(--danger-100)] text-[var(--danger-700)] text-[13px] font-bold hover:bg-[var(--danger-100)] transition-colors"
            >
              {t("bookings.declineSelected")}
            </button>
            <button
              type="button"
              onClick={() => setSelectedIds(new Set())}
              className="px-3.5 py-1.5 rounded-lg text-[13px] font-semibold text-[var(--ink-600)] hover:bg-[var(--paper-100)] transition-colors"
            >
              {t("common.clear")}
            </button>
          </div>
        </div>
      )}

      <BookingsTable
        bookings={filtered}
        perspective={perspective}
        getRowHref={(b) => `/dashboard/bookings/${b.id}`}
        isCancellable={(b) => CANCELLABLE_STATUSES.includes(b.status)}
        onCancelBooking={setCancelTarget}
        isSelectable={isLecturer ? (b) => b.status === "PENDING" : undefined}
        selectedIds={isLecturer ? selectedIds : undefined}
        onToggleSelect={isLecturer ? toggleSelect : undefined}
        onToggleSelectAll={isLecturer ? (ids) => setSelectedIds(new Set(ids)) : undefined}
      />

      <ConfirmModal
        open={cancelTarget !== null}
        icon={ShieldAlert}
        title={t("bookings.cancelQuestion")}
        description={t("bookings.cancelDescription")}
        confirmLabel={t("bookings.yesCancel")}
        cancelLabel={t("bookings.neverMind")}
        onCancel={() => setCancelTarget(null)}
        onConfirm={() => {
          setBookings((prev) =>
            prev.map((b) => (b.id === cancelTarget?.id ? { ...b, status: "CANCELLED" as BookingStatus } : b))
          );
          setCancelTarget(null);
          toast.show("neutral", t("bookings.cancelled"));
        }}
      />

      <ConfirmModal
        open={bulkDeclineOpen}
        icon={ShieldAlert}
        title={t("bookings.declineQuestion", { count: selectedIds.size, suffix: selectedIds.size === 1 ? "" : "s" })}
        description={t("bookings.declineDescription")}
        confirmLabel={t("bookings.yesDecline")}
        cancelLabel={t("bookings.neverMind")}
        onCancel={() => setBulkDeclineOpen(false)}
        onConfirm={() => {
          bulkSetStatus("DECLINED");
          setBulkDeclineOpen(false);
        }}
      />
    </div>
  );
}
