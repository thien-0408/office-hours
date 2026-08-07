import type { BookableSlot } from "@/lib/office-hours/types";

const dayFormatter = new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric" });
const timeFormatter = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" });

function groupByDay(slots: BookableSlot[]): { dateKey: string; slots: BookableSlot[] }[] {
  const groups = new Map<string, BookableSlot[]>();
  for (const slot of slots) {
    const dateKey = slot.startAt.slice(0, 10);
    const bucket = groups.get(dateKey);
    if (bucket) bucket.push(slot);
    else groups.set(dateKey, [slot]);
  }
  return Array.from(groups.entries()).map(([dateKey, daySlots]) => ({ dateKey, slots: daySlots }));
}

// Restrained (DESIGN.md §1) — plain buttons in a day-column grid, no glass.
export function WeekSlotGrid({
  slots,
  onSelectSlot,
}: {
  slots: BookableSlot[];
  onSelectSlot: (slot: BookableSlot) => void;
}) {
  const days = groupByDay(slots);

  if (days.length === 0) {
    return <p className="text-sm text-[var(--ink-500)] text-center py-8">No slots this week.</p>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
      {days.map(({ dateKey, slots: daySlots }) => (
        <div key={dateKey} className="flex flex-col gap-2">
          <p className="text-xs font-bold uppercase tracking-wide text-[var(--ink-500)] px-1">
            {dayFormatter.format(new Date(dateKey))}
          </p>
          <div className="flex flex-col gap-1.5">
            {daySlots.map((slot) => {
              const disabled = !slot.available || slot.conflict;
              return (
                <button
                  key={slot.id}
                  type="button"
                  disabled={disabled}
                  title={slot.conflict ? "Conflicts with one of your bookings" : undefined}
                  onClick={() => onSelectSlot(slot)}
                  className={`px-3 py-2 rounded-xl text-[13px] font-bold tabular-nums text-center transition-colors ${
                    disabled
                      ? "bg-[var(--paper-100)] text-[var(--ink-400)] cursor-not-allowed"
                      : "bg-[var(--brand-50)] text-[var(--brand-700)] hover:bg-[var(--brand-100)]"
                  }`}
                >
                  {timeFormatter.format(new Date(slot.startAt))}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
