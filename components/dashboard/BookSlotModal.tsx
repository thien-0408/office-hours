"use client";

import { useState } from "react";
import { Calendar, Clock, User } from "lucide-react";
import type { BookableSlot, BookingParticipant } from "@/lib/office-hours/types";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
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
    <Dialog open={open && slot !== null} onOpenChange={(next) => !next && handleClose()}>
      <DialogContent showCloseButton={false}
      className="sm:max-w-md">
        {slot && submitted ? (
          <div className="py-4 text-center">
            <DialogTitle className="mb-1.5 text-lg font-bold text-[var(--ink-900)]">Request sent</DialogTitle>
            <DialogDescription className="mb-6 text-sm text-[var(--ink-600)]">
              Pending confirmation from {lecturerName}. You&apos;ll be notified once they respond.
            </DialogDescription>
            <Button size="lg" onClick={handleClose}>
              Done
            </Button>
          </div>
        ) : slot ? (
          <form onSubmit={handleSubmit}
          className="flex flex-col gap-4">
            <DialogTitle className="text-lg font-bold text-[var(--ink-900)]">Book a slot</DialogTitle>

            <div className="flex flex-col gap-1.5 rounded-xl border border-[var(--paper-200)] bg-[var(--paper-50)] p-3">
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
              <span className="text-[12.5px] font-semibold text-[var(--ink-700)]">Group participants (optional)</span>
              <ParticipantManager participants={participants} onChange={setParticipants} />
            </div>

            <div className="flex items-center gap-2.5 pt-1">
              <Button type="submit" size="lg" className="flex-1">
                Request booking
              </Button>
              <Button type="button" size="lg" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
            </div>
          </form>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
