"use client";

import { useState } from "react";
import type { Booking } from "@/lib/office-hours/types";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { FormField, TextInput } from "./FormField";

function toDateInputValue(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function toTimeInputValue(iso: string) {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

// Restrained white surface, matching BookSlotModal — this is data entry, not
// a confirmation, so it doesn't use the glass ConfirmModal treatment.
export function RescheduleModal({
  open,
  booking,
  onClose,
  onConfirm,
}: {
  open: boolean;
  booking: Booking | null;
  onClose: () => void;
  onConfirm: (input: { startAt: string; endAt: string; topic: string }) => void;
}) {
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [topic, setTopic] = useState("");
  const [error, setError] = useState("");

  function seed(b: Booking) {
    setDate(toDateInputValue(b.startAt));
    setStartTime(toTimeInputValue(b.startAt));
    setEndTime(toTimeInputValue(b.endAt));
    setTopic(b.topic ?? "");
    setError("");
  }

  // Re-seed whenever a new booking is targeted, without a setState-in-effect —
  // same store-previous-value pattern used on the booking detail page.
  const [seededForId, setSeededForId] = useState<number | null>(null);
  if (booking && booking.id !== seededForId) {
    setSeededForId(booking.id);
    seed(booking);
  }

  function handleClose() {
    onClose();
    setSeededForId(null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!date || !startTime || !endTime) {
      setError("Pick a date and time.");
      return;
    }
    const startAt = new Date(`${date}T${startTime}`);
    const endAt = new Date(`${date}T${endTime}`);
    if (endAt.getTime() <= startAt.getTime()) {
      setError("End time must be after start time.");
      return;
    }
    onConfirm({ startAt: startAt.toISOString(), endAt: endAt.toISOString(), topic });
    handleClose();
  }

  return (
    <Dialog open={open && booking !== null} onOpenChange={(next) => !next && handleClose()}>
      <DialogContent showCloseButton={false}
      className="sm:max-w-md">
        {booking && (
          <form onSubmit={handleSubmit}
          className="flex flex-col gap-4">
            <div>
              <DialogTitle className="text-lg font-bold text-[var(--ink-900)]">Reschedule booking</DialogTitle>
              <DialogDescription className="mt-0.5 text-[13px] text-[var(--ink-500)]">
                Sends a new request to {booking.lecturerName}; they&apos;ll need to confirm again.
              </DialogDescription>
            </div>

            <FormField label="Date">
              <TextInput type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
            </FormField>

            <div className="grid grid-cols-2 gap-3">
              <FormField label="Start time">
                <TextInput type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} required />
              </FormField>
              <FormField label="End time">
                <TextInput type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} required />
              </FormField>
            </div>

            <FormField label="Topic (optional)">
              <TextInput
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="What do you want to discuss?"
              />
            </FormField>

            {error && <p className="text-[13px] font-semibold text-[var(--danger-700)]">{error}</p>}

            <div className="flex items-center gap-2.5 pt-1">
              <Button type="submit" size="lg" className="flex-1">
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
