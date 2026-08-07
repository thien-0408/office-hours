import { CalendarCheck, CalendarX, Clock, ListPlus, type LucideIcon } from "lucide-react";
import type { NotificationType } from "@/lib/office-hours/types";
import { type Hue, HUE_TOKENS } from "./status-hues";

// Notification analogue of BOOKING_STATUS_CONFIG (status-hues.ts) — maps onto
// the same semantic hues rather than inventing new ones per DESIGN.md §4.
export const NOTIFICATION_TYPE_CONFIG: Record<NotificationType, { icon: LucideIcon; hue: Hue }> = {
  BOOKING_CONFIRMED: { icon: CalendarCheck, hue: "success" },
  BOOKING_DECLINED: { icon: CalendarX, hue: "danger" },
  BOOKING_CANCELLED: { icon: CalendarX, hue: "neutral" },
  WAITLIST_OFFERED: { icon: ListPlus, hue: "info" },
  REMINDER: { icon: Clock, hue: "brand" },
};

export function notificationTone(type: NotificationType) {
  const { hue } = NOTIFICATION_TYPE_CONFIG[type];
  return HUE_TOKENS[hue];
}
