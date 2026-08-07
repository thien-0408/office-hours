import type { PublicSlot } from "@/lib/office-hours/types";
import { Card } from "./Card";

const timeFormatter = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" });

export function SlotsTodayList({ slots }: { slots: PublicSlot[] }) {
  if (slots.length === 0) {
    return (
      <Card className="text-center py-6">
        <p className="text-[13px] text-[var(--ink-500)]">No open slots left today.</p>
      </Card>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {slots.map((slot, i) => (
        <span
          key={`${slot.startAt}-${i}`}
          className="px-3 py-1.5 rounded-full text-[12.5px] font-bold tabular-nums bg-[var(--brand-50)] text-[var(--brand-700)] border border-[var(--brand-100)]"
        >
          {timeFormatter.format(new Date(slot.startAt))}
        </span>
      ))}
    </div>
  );
}
