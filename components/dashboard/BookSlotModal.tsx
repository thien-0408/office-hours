"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Calendar, Clock, User } from "lucide-react";
import type { BookableSlot, BookingParticipant } from "@/lib/office-hours/types";
import { FormField, TextInput } from "./FormField";
import { MetaRow } from "./MetaRow";
import { ParticipantManager } from "./ParticipantManager";

const dateFormatter = new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric" });
const timeFormatter = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" });

// Restrained white surface, not glass — ConfirmModal is the one sanctioned
// glass component (DESIGN.md §1) and it's for confirmations, not data entry.
export function BookSlotModal({
  open,
  slot,
  lecturerName,
  onClose,
  onConfirm,
}: {
  open: boolean;
  slot: BookableSlot | null;
  lecturerName: string;
  onClose: () => void;
  onConfirm: (topic: string, participants: BookingParticipant[]) => void;
}) {
  const prefersReducedMotion = useReducedMotion();
  const [topic, setTopic] = useState("");
  const [participants, setParticipants] = useState<BookingParticipant[]>([]);
  const [submitted, setSubmitted] = useState(false);

  function handleClose() {
    onClose();
    setTopic("");
    setParticipants([]);
    setSubmitted(false);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onConfirm(topic, participants);
    setSubmitted(true);
  }

  return (
    <AnimatePresence>
      {open && slot && (
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
            {submitted ? (
              <div className="text-center py-4">
                <h2 className="text-lg font-bold text-[var(--ink-900)] mb-1.5">Request sent</h2>
                <p className="text-sm text-[var(--ink-600)] mb-6">
                  Pending confirmation from {lecturerName}. You&apos;ll be notified once they respond.
                </p>
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-5 py-2.5 rounded-xl bg-[var(--brand-500)] text-white text-sm font-bold hover:bg-[var(--brand-600)] transition-colors"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <h2 className="text-lg font-bold text-[var(--ink-900)]">Book a slot</h2>

                <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-[var(--paper-50)] border border-[var(--paper-200)]">
                  <MetaRow icon={User}>{lecturerName}</MetaRow>
                  <MetaRow icon={Calendar}>{dateFormatter.format(new Date(slot.startAt))}</MetaRow>
                  <MetaRow icon={Clock}>
                    {timeFormatter.format(new Date(slot.startAt))} – {timeFormatter.format(new Date(slot.endAt))}
                  </MetaRow>
                </div>

                <FormField label="Topic (optional)">
                  <TextInput
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="What do you want to discuss?"
                  />
                </FormField>

                <div className="flex flex-col gap-1.5">
                  <span className="text-[12.5px] font-semibold text-[var(--ink-700)]">
                    Group participants (optional)
                  </span>
                  <ParticipantManager participants={participants} onChange={setParticipants} />
                </div>

                <div className="flex items-center gap-2.5 pt-1">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2.5 rounded-xl bg-[var(--brand-500)] text-white text-sm font-bold hover:bg-[var(--brand-600)] transition-colors"
                  >
                    Request booking
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
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
