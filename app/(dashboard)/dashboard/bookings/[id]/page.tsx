"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Building2, Calendar, Clock, ShieldAlert, User } from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import { BookingTimeline } from "@/components/dashboard/BookingTimeline";
import { Card } from "@/components/dashboard/Card";
import { MetaRow } from "@/components/dashboard/MetaRow";
import { SectionHeader } from "@/components/dashboard/SectionHeader";
import { ConfirmModal } from "@/components/ConfirmModal";
import { useAuth } from "@/lib/auth/auth-context";
import { getMockBookingById, getMockBookingTimeline } from "@/lib/office-hours/mock-data";
import type { Booking } from "@/lib/office-hours/types";

const dateFormatter = new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric" });
const timeFormatter = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" });

type PendingAction = "CANCEL" | "DECLINE" | "NO_SHOW" | null;

export default function BookingDetailPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const { user } = useAuth();

  // Store-previous-value pattern (established in DashboardShell / AuthLayout)
  // so the local mutable copy re-seeds if the route's id changes, without a
  // setState-in-useEffect.
  const [prevId, setPrevId] = useState(id);
  const [booking, setBooking] = useState<Booking | undefined>(() => getMockBookingById(id));
  if (id !== prevId) {
    setPrevId(id);
    setBooking(getMockBookingById(id));
  }

  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  const [meetingNotes, setMeetingNotes] = useState("");
  const [attended, setAttended] = useState(true);
  const [recordSaved, setRecordSaved] = useState(false);

  const timeline = useMemo(() => (booking ? getMockBookingTimeline(booking) : []), [booking]);

  if (!user) return null;

  if (!booking) {
    return (
      <Card className="text-center py-10">
        <p className="text-sm text-[var(--ink-500)] mb-4">Booking not found.</p>
        <Link href="/dashboard/bookings" className="text-sm font-semibold text-[var(--brand-500)] no-underline hover:underline">
          Back to bookings
        </Link>
      </Card>
    );
  }

  const isPast = new Date(booking.endAt).getTime() < new Date().getTime();

  function applyStatus(status: Booking["status"]) {
    setBooking((b) => (b ? { ...b, status } : b));
    setPendingAction(null);
  }

  function confirmActionCopy(action: PendingAction): { title: string; description: string } {
    switch (action) {
      case "CANCEL":
        return { title: "Cancel this booking?", description: "The other party will be notified. This can't be undone." };
      case "DECLINE":
        return { title: "Decline this booking?", description: "The student will be notified and the slot freed up." };
      case "NO_SHOW":
        return { title: "Mark as no-show?", description: "This affects the lecturer's no-show rate on the analytics dashboard." };
      default:
        return { title: "", description: "" };
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/dashboard/bookings"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--ink-600)] no-underline hover:text-[var(--brand-600)] w-fit"
      >
        <ArrowLeft className="w-4 h-4" strokeWidth={2} />
        Back to bookings
      </Link>

      <Card>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
          <div>
            <h1 className="text-xl font-bold text-[var(--ink-900)] mb-1">
              {booking.topic ?? "Office hours booking"}
            </h1>
            <div className="flex flex-wrap gap-x-4 gap-y-1.5">
              <MetaRow icon={User}>
                {user.role === "LECTURER" ? booking.studentName : booking.lecturerName}
              </MetaRow>
              <MetaRow icon={Building2}>{booking.department ?? "—"}</MetaRow>
            </div>
          </div>
          <StatusBadge status={booking.status} />
        </div>

        <div className="flex flex-wrap gap-x-5 gap-y-2 pt-4 border-t border-[var(--paper-200)]">
          <MetaRow icon={Calendar}>{dateFormatter.format(new Date(booking.startAt))}</MetaRow>
          <MetaRow icon={Clock}>
            {timeFormatter.format(new Date(booking.startAt))} – {timeFormatter.format(new Date(booking.endAt))}
          </MetaRow>
        </div>
      </Card>

      {(booking.status === "PENDING" || booking.status === "CONFIRMED") && (
        <Card>
          <SectionHeader title="Actions" />
          <div className="flex flex-wrap gap-2.5">
            {user.role === "STUDENT" && (
              <>
                <button
                  type="button"
                  onClick={() => setPendingAction("CANCEL")}
                  className="px-4 py-2 rounded-xl border border-[var(--danger-100)] text-[var(--danger-700)] text-sm font-bold hover:bg-[var(--danger-100)] transition-colors"
                >
                  Cancel booking
                </button>
                <button
                  type="button"
                  disabled
                  title="Coming soon"
                  className="px-4 py-2 rounded-xl border border-[var(--paper-200)] text-[var(--ink-400)] text-sm font-bold cursor-not-allowed"
                >
                  Reschedule
                </button>
              </>
            )}

            {user.role === "LECTURER" && booking.status === "PENDING" && (
              <>
                <button
                  type="button"
                  onClick={() => applyStatus("CONFIRMED")}
                  className="px-4 py-2 rounded-xl bg-[var(--brand-500)] text-white text-sm font-bold hover:bg-[var(--brand-600)] transition-colors"
                >
                  Confirm
                </button>
                <button
                  type="button"
                  onClick={() => setPendingAction("DECLINE")}
                  className="px-4 py-2 rounded-xl border border-[var(--danger-100)] text-[var(--danger-700)] text-sm font-bold hover:bg-[var(--danger-100)] transition-colors"
                >
                  Decline
                </button>
              </>
            )}

            {user.role === "LECTURER" && booking.status === "CONFIRMED" && isPast && (
              <>
                <button
                  type="button"
                  onClick={() => applyStatus("COMPLETED")}
                  className="px-4 py-2 rounded-xl bg-[var(--brand-500)] text-white text-sm font-bold hover:bg-[var(--brand-600)] transition-colors"
                >
                  Mark completed
                </button>
                <button
                  type="button"
                  onClick={() => setPendingAction("NO_SHOW")}
                  className="px-4 py-2 rounded-xl border border-[var(--danger-100)] text-[var(--danger-700)] text-sm font-bold hover:bg-[var(--danger-100)] transition-colors"
                >
                  Mark no-show
                </button>
              </>
            )}
          </div>
        </Card>
      )}

      {user.role === "LECTURER" && booking.status === "COMPLETED" && (
        <Card>
          <SectionHeader title="Meeting record" />
          <label className="flex items-center gap-2 text-sm text-[var(--ink-700)] mb-3">
            <input
              type="checkbox"
              checked={attended}
              onChange={(e) => setAttended(e.target.checked)}
              className="w-4 h-4 accent-[var(--brand-500)]"
            />
            Student attended
          </label>
          <textarea
            value={meetingNotes}
            onChange={(e) => {
              setMeetingNotes(e.target.value);
              setRecordSaved(false);
            }}
            placeholder="Notes from the session…"
            rows={3}
            className="w-full rounded-xl border border-[var(--paper-200)] bg-white px-3.5 py-2.5 text-sm text-[var(--ink-900)] outline-none focus:ring-2 focus:ring-[var(--brand-300)] resize-none"
          />
          <div className="flex items-center gap-3 mt-3">
            <button
              type="button"
              onClick={() => setRecordSaved(true)}
              className="px-4 py-2 rounded-xl bg-[var(--brand-500)] text-white text-sm font-bold hover:bg-[var(--brand-600)] transition-colors"
            >
              Save record
            </button>
            {recordSaved && <span className="text-[13px] text-[var(--success-700)] font-semibold">Saved</span>}
          </div>
        </Card>
      )}

      <Card>
        <SectionHeader title="Timeline" />
        <BookingTimeline events={timeline} />
      </Card>

      <ConfirmModal
        open={pendingAction !== null}
        icon={ShieldAlert}
        title={confirmActionCopy(pendingAction).title}
        description={confirmActionCopy(pendingAction).description}
        confirmLabel="Yes, continue"
        cancelLabel="Never mind"
        onCancel={() => setPendingAction(null)}
        onConfirm={() => {
          if (pendingAction === "CANCEL") applyStatus("CANCELLED");
          if (pendingAction === "DECLINE") applyStatus("DECLINED");
          if (pendingAction === "NO_SHOW") applyStatus("NO_SHOW");
        }}
      />
    </div>
  );
}
