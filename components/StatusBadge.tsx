"use client";

import type { BookingStatus } from "@/lib/office-hours/types";
import { BOOKING_STATUS_CONFIG, HUE_TOKENS } from "@/lib/ui/status-hues";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/i18n/provider";

export function StatusBadge({ status }: { status: BookingStatus }) {
  const { label, hue } = BOOKING_STATUS_CONFIG[status];
  const { t } = useI18n();
  const key = (status === "NO_SHOW" ? "booking.status.noShow" : `booking.status.${status.toLowerCase()}`) as Parameters<typeof t>[0];

  return (
    <Badge variant={hue}>
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: HUE_TOKENS[hue].dot }} />
      {t(key) || label}
    </Badge>
  );
}
