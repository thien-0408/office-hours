"use client";

import { useState } from "react";
import { UserMinus } from "lucide-react";
import type { BookingParticipant } from "@/lib/office-hours/types";
import { ConfirmModal } from "@/components/ConfirmModal";
import { FormField, TextInput } from "./FormField";

// Group-booking participants aren't wired to a real bookings-participants
// model yet — the actual schema isn't known from this repo. This is a UI/
// interaction demo: purely local state, no persistence.
export function ParticipantManager({
  participants,
  onChange,
}: {
  participants: BookingParticipant[];
  onChange: (participants: BookingParticipant[]) => void;
}) {
  const [email, setEmail] = useState("");
  const [pendingRemoveId, setPendingRemoveId] = useState<number | null>(null);

  function addParticipant() {
    const trimmed = email.trim();
    if (!trimmed) return;
    const name = trimmed.split("@")[0].replace(/[._]/g, " ");
    const nextId = participants.length === 0 ? 1 : Math.max(...participants.map((p) => p.id)) + 1;
    onChange([...participants, { id: nextId, name, email: trimmed }]);
    setEmail("");
  }

  return (
    <div className="flex flex-col gap-3">
      {participants.length > 0 && (
        <ul className="flex flex-col gap-1.5">
          {participants.map((p) => (
            <li
              key={p.id}
              className="flex items-center justify-between gap-3 px-3 py-2 rounded-xl bg-[var(--paper-50)] border border-[var(--paper-200)]"
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[var(--ink-900)] truncate capitalize">{p.name}</p>
                <p className="text-[12px] text-[var(--ink-500)] truncate">{p.email}</p>
              </div>
              <button
                type="button"
                onClick={() => setPendingRemoveId(p.id)}
                className="flex items-center justify-center w-7 h-7 rounded-full text-[var(--ink-400)] hover:bg-[var(--danger-100)] hover:text-[var(--danger-700)] transition-colors shrink-0"
                aria-label={`Remove ${p.name}`}
              >
                <UserMinus className="w-4 h-4" strokeWidth={2} />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex items-end gap-2">
        <FormField label="Add participant (email)">
          <TextInput
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="classmate@school.edu"
          />
        </FormField>
        <button
          type="button"
          onClick={addParticipant}
          className="px-3.5 py-2.5 rounded-xl border border-[var(--paper-200)] text-sm font-bold text-[var(--brand-700)] hover:bg-[var(--brand-50)] transition-colors"
        >
          Add
        </button>
      </div>

      <ConfirmModal
        open={pendingRemoveId !== null}
        title="Remove participant?"
        description="They'll no longer be included in this group booking."
        confirmLabel="Remove"
        cancelLabel="Cancel"
        onCancel={() => setPendingRemoveId(null)}
        onConfirm={() => {
          onChange(participants.filter((p) => p.id !== pendingRemoveId));
          setPendingRemoveId(null);
        }}
      />
    </div>
  );
}
