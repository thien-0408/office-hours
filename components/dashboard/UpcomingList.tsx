import { BOOKING_STATUS_CONFIG, HUE_TOKENS } from "@/lib/ui/status-hues";
import type { Booking } from "@/lib/office-hours/types";
import { Card } from "./Card";

const timeFormatter = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" });

export function UpcomingList({ bookings }: { bookings: Booking[] }) {
  if (bookings.length === 0) {
    return (
      <Card className="text-center py-6">
        <p className="text-[13px] text-[var(--ink-500)]">Nothing on the calendar yet.</p>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-2.5">
      {bookings.map((booking) => {
        const tokens = HUE_TOKENS[BOOKING_STATUS_CONFIG[booking.status].hue];
        return (
          <div
            key={booking.id}
            className="flex items-center gap-3 rounded-xl border border-[var(--paper-200)] bg-white pl-3 pr-4 py-3"
            style={{ borderLeft: `3px solid ${tokens.dot}` }}
          >
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-semibold text-[var(--ink-900)] truncate">{booking.lecturerName}</p>
              <p className="text-[11.5px] text-[var(--ink-500)] truncate">{booking.department ?? "Office hours"}</p>
            </div>
            <span className="shrink-0 text-[11.5px] font-bold text-[var(--ink-700)] tabular-nums">
              {timeFormatter.format(new Date(booking.startAt))}
            </span>
          </div>
        );
      })}
    </div>
  );
}
