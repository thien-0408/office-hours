import type { BookingStatus } from "@/lib/office-hours/types";
import { BOOKING_STATUS_CONFIG, HUE_TOKENS } from "@/lib/ui/status-hues";

export function StatusBadge({ status }: { status: BookingStatus }) {
  const { label, hue } = BOOKING_STATUS_CONFIG[status];
  const tokens = HUE_TOKENS[hue];

  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11.5px] font-semibold whitespace-nowrap"
      style={{ background: tokens.bg, color: tokens.text }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: tokens.dot }} />
      {label}
    </span>
  );
}
