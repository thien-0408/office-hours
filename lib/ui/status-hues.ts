import type { BookingStatus, WaitlistStatus } from "@/lib/office-hours/types";

// docs/DESIGN.md §4 — the only hues allowed for status/semantic tinting across the
// dashboard (badges, icon chips, stat tiles, left-borders). Don't invent new ones
// per screen; extend BOOKING_STATUS_CONFIG below instead of adding a hue here.
export type Hue = "success" | "warning" | "danger" | "info" | "neutral" | "brand";

export const HUE_TOKENS: Record<Hue, { bg: string; text: string; dot: string }> = {
  success: { bg: "var(--success-100)", text: "var(--success-700)", dot: "var(--success-500)" },
  warning: { bg: "var(--warning-100)", text: "var(--warning-700)", dot: "var(--warning-500)" },
  danger: { bg: "var(--danger-100)", text: "var(--danger-700)", dot: "var(--danger-500)" },
  info: { bg: "var(--info-100)", text: "var(--info-700)", dot: "var(--info-500)" },
  neutral: { bg: "var(--paper-100)", text: "var(--ink-600)", dot: "var(--ink-400)" },
  brand: { bg: "var(--brand-100)", text: "var(--brand-700)", dot: "var(--brand-500)" },
};

// docs/DESIGN.md §4 — the single source of truth for bookings.status → hue/label.
// StatusBadge and any rail/list component that tints by status both read this.
export const BOOKING_STATUS_CONFIG: Record<BookingStatus, { label: string; hue: Hue }> = {
  PENDING: { label: "Pending", hue: "warning" },
  CONFIRMED: { label: "Confirmed", hue: "success" },
  DECLINED: { label: "Declined", hue: "danger" },
  CANCELLED: { label: "Cancelled", hue: "neutral" },
  COMPLETED: { label: "Completed", hue: "brand" },
  NO_SHOW: { label: "No-show", hue: "danger" },
};

// Waitlist analogue of BOOKING_STATUS_CONFIG — same hue set, no new colors.
export const WAITLIST_STATUS_CONFIG: Record<WaitlistStatus, { label: string; hue: Hue }> = {
  WAITING: { label: "Waiting", hue: "warning" },
  OFFERED: { label: "Offered", hue: "info" },
  FULFILLED: { label: "Fulfilled", hue: "success" },
  EXPIRED: { label: "Expired", hue: "neutral" },
  CANCELLED: { label: "Cancelled", hue: "neutral" },
};
