import type { BookingTimelineEvent } from "@/lib/office-hours/types";
import { HUE_TOKENS } from "@/lib/ui/status-hues";

const dateTimeFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

// Vertical dots-on-a-line timeline, each event tinted by its status hue (or
// neutral for the initial "requested" event, which has no status of its own).
export function BookingTimeline({ events }: { events: BookingTimelineEvent[] }) {
  return (
    <ol className="flex flex-col">
      {events.map((event, i) => {
        const tone = event.status ? HUE_TOKENS[statusHue(event.status)] : HUE_TOKENS.neutral;
        const isLast = i === events.length - 1;
        return (
          <li key={event.id} className="flex gap-3">
            <span className="flex flex-col items-center">
              <span className="w-2.5 h-2.5 rounded-full shrink-0 mt-1" style={{ background: tone.dot }} />
              {!isLast && <span className="w-px flex-1 bg-[var(--paper-200)]" />}
            </span>
            <span className={`pb-5 ${isLast ? "" : ""}`}>
              <span className="block text-sm font-semibold text-[var(--ink-900)]">{event.label}</span>
              <span className="block text-[12.5px] text-[var(--ink-500)] tabular-nums">
                {dateTimeFormatter.format(new Date(event.at))}
              </span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function statusHue(status: NonNullable<BookingTimelineEvent["status"]>) {
  switch (status) {
    case "CONFIRMED":
    case "COMPLETED":
      return "success" as const;
    case "DECLINED":
    case "NO_SHOW":
      return "danger" as const;
    case "CANCELLED":
      return "neutral" as const;
    case "PENDING":
    default:
      return "warning" as const;
  }
}
