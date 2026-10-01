"use client";

import { useMemo, useState } from "react";
import type { BookableSlot, Booking } from "@/lib/office-hours/types";
import { getMockLecturerWeekSlots } from "@/lib/office-hours/mock-data";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { useI18n } from "@/i18n/provider";
import { formatDate, formatTime } from "@/i18n/formatters";

// Reschedule picks an existing, conflict-free slot of the same lecturer — it maps to
// POST /bookings/{id}/reschedule { newSlotId } (docs/capstone-api-endpoints.md §5), not to
// free-form date/time entry. Real wiring point for the slot list: GET /lecturers/{id}/slots.
const WEEKS_AHEAD = 2;

function dayKey(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

export function RescheduleModal({
  open,
  booking,
  onClose,
  onConfirm,
}: {
  open: boolean;
  booking: Booking | null;
  onClose: () => void;
  onConfirm: (input: { newSlotId: number; startAt: string; endAt: string }) => void;
}) {
  const { locale } = useI18n();
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const days = useMemo(() => {
    if (!booking) return [];
    const now = new Date().toISOString();
    const slots: BookableSlot[] = [];
    for (let week = 0; week < WEEKS_AHEAD; week++) {
      slots.push(...getMockLecturerWeekSlots(booking.lecturerId, week));
    }
    const open = slots.filter((s) => s.available && !s.conflict && s.startAt > now && s.id !== booking.slotId);
    const groups = new Map<string, BookableSlot[]>();
    for (const slot of open) {
      const key = dayKey(slot.startAt);
      groups.set(key, [...(groups.get(key) ?? []), slot]);
    }
    return [...groups.values()];
  }, [booking]);

  function handleClose() {
    onClose();
    setSelectedId(null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const chosen = days.flat().find((s) => s.id === selectedId);
    if (!chosen) return;
    onConfirm({ newSlotId: chosen.id, startAt: chosen.startAt, endAt: chosen.endAt });
    handleClose();
  }

  return (
    <Dialog open={open && booking !== null} onOpenChange={(next) => !next && handleClose()}>
      <DialogContent showCloseButton={false} className="sm:max-w-lg">
        {booking && (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <DialogTitle className="text-lg font-bold text-[var(--ink-900)]">Reschedule booking</DialogTitle>
              <DialogDescription className="mt-0.5 text-[13px] text-[var(--ink-500)]">
                Pick another open slot with {booking.lecturerName}; they&apos;ll need to confirm again.
              </DialogDescription>
            </div>

            {days.length === 0 ? (
              <p className="rounded-xl bg-[var(--paper-50)] px-3.5 py-4 text-center text-[13px] text-[var(--ink-500)]">
                No other conflict-free slots in the next {WEEKS_AHEAD} weeks.
              </p>
            ) : (
              <div className="flex max-h-[320px] flex-col gap-3 overflow-y-auto pr-1">
                {days.map((slots) => (
                  <div key={dayKey(slots[0].startAt)}>
                    <p className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--ink-500)]">
                      {formatDate(slots[0].startAt, locale, { weekday: "short", day: "numeric", month: "short" })}
                    </p>
                    <div className="flex flex-wrap gap-1.5" role="radiogroup">
                      {slots.map((slot) => {
                        const active = slot.id === selectedId;
                        return (
                          <Button
                            key={slot.id}
                            type="button"
                            size="sm"
                            variant={active ? "default" : "outline"}
                            role="radio"
                            aria-checked={active}
                            onClick={() => setSelectedId(slot.id)}
                            className="tabular-nums"
                          >
                            {formatTime(slot.startAt, locale)}
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center gap-2.5 pt-1">
              <Button type="submit" size="lg" className="flex-1" disabled={selectedId === null}>
                Send new request
              </Button>
              <Button type="button" size="lg" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
