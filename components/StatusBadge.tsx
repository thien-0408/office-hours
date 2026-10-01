"use client";

import type { BookingStatus } from "@/lib/office-hours/types";
import { BOOKING_STATUS_CONFIG, HUE_TOKENS } from "@/lib/ui/status-hues";
import { useI18n } from "@/i18n/provider";

export function StatusBadge({ status }: { status: BookingStatus }) {
  const { label, hue } = BOOKING_STATUS_CONFIG[status];
  const { t } = useI18n();
  const tokens = HUE_TOKENS[hue];
  const key = (status === "NO_SHOW" ? "booking.status.noShow" : `booking.status.${status.toLowerCase()}`) as Parameters<typeof t>[0];

  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11.5px] font-semibold whitespace-nowrap"
      style={{ background: tokens.bg, color: tokens.text }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: tokens.dot }} />
      {t(key) || label}
    </span>
  );
}
