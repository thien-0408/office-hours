"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import type { Booking } from "@/lib/office-hours/types";
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
  const prefersReducedMotion = useReducedMotion();
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
    <AnimatePresence>
      {open && booking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            className="absolute inset-0 bg-[var(--ink-900)]/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            aria-hidden="true"
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            className="relative w-full max-w-md rounded-2xl bg-white border border-[var(--paper-200)] shadow-2xl p-6"
            initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 10 }}
            animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
            exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 10 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          >
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <h2 className="text-lg font-bold text-[var(--ink-900)]">Reschedule booking</h2>
                <p className="text-[13px] text-[var(--ink-500)] mt-0.5">
                  Sends a new request to {booking.lecturerName}; they&apos;ll need to confirm again.
                </p>
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

              {error && <p className="text-[13px] text-[var(--danger-700)] font-semibold">{error}</p>}

              <div className="flex items-center gap-2.5 pt-1">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 rounded-xl bg-[var(--brand-500)] text-white text-sm font-bold hover:bg-[var(--brand-600)] transition-colors"
                >
                  Send new request
                </button>
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2.5 rounded-xl border border-[var(--paper-200)] text-sm font-bold text-[var(--ink-700)] hover:bg-[var(--paper-50)] transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
