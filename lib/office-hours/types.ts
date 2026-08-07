export interface PublicSlot {
  lecturerName: string;
  department: string | null;
  startAt: string; // ISO-8601
  endAt: string; // ISO-8601
}

// Pagination shape per capstone-api-endpoints.md §0 Conventions.
export interface PublicOfficeHoursResponse {
  content: PublicSlot[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
}

// Matches bookings.status enum, capstone-db-schema.md §3.2.
export type BookingStatus =
  | "PENDING"
  | "CONFIRMED"
  | "DECLINED"
  | "CANCELLED"
  | "COMPLETED"
  | "NO_SHOW";

// Both names are carried (rather than just "the other party") because the real
// BOOKINGS entity has both lecturer_id and student_id (capstone-db-schema.md
// §3.2) — a lecturer's queue and an admin's cross-lecturer view both need the
// name the student-facing views don't. BookingsTable's `perspective` prop picks
// which one(s) to render.
export interface BookingParticipant {
  id: number;
  name: string;
  email: string;
}

export interface Booking {
  id: number;
  lecturerName: string;
  studentName: string;
  department: string | null;
  topic: string | null;
  startAt: string; // ISO-8601
  endAt: string; // ISO-8601
  status: BookingStatus;
  participants?: BookingParticipant[];
}

// One entry in a booking's status history, rendered by BookingTimeline on the
// Booking Detail page. Derived from a booking's current status + startAt
// rather than hand-authored per id, so it always agrees with the booking.
export interface BookingTimelineEvent {
  id: number;
  label: string;
  at: string; // ISO-8601
  status?: BookingStatus;
}

export type NotificationType =
  | "BOOKING_CONFIRMED"
  | "BOOKING_DECLINED"
  | "BOOKING_CANCELLED"
  | "WAITLIST_OFFERED"
  | "REMINDER";

export interface Notification {
  id: number;
  type: NotificationType;
  title: string;
  body: string;
  createdAt: string; // ISO-8601
  read: boolean;
  bookingId?: number;
}

export interface NotificationPrefs {
  bookingConfirmed: boolean;
  bookingDeclined: boolean;
  waitlistOffer: boolean;
  reminders: boolean;
}

// A slot picker's week grid — thinner than PublicSlot/MockPublicSlot since it's
// scoped to one lecturer and carries booking-eligibility flags the public
// browse view doesn't need.
export interface BookableSlot {
  id: number;
  lecturerId: number;
  startAt: string; // ISO-8601
  endAt: string; // ISO-8601
  available: boolean; // false = already booked by someone else
  conflict: boolean; // true = overlaps one of the student's own bookings
}

export type RecurringStatus = "ACTIVE" | "ENDED" | "CANCELLED";

export interface RecurringOccurrence {
  id: number;
  startAt: string; // ISO-8601
  status: BookingStatus;
}

export interface RecurringSeries {
  id: number;
  lecturerName: string;
  department: string | null;
  dayOfWeek: number; // 0 = Sunday .. 6 = Saturday
  startTime: string; // "14:00"
  endTime: string; // "14:30"
  semester: string;
  status: RecurringStatus;
  occurrences: RecurringOccurrence[];
}

export type WaitlistStatus = "WAITING" | "OFFERED" | "FULFILLED" | "EXPIRED" | "CANCELLED";

export interface WaitlistEntry {
  id: number;
  lecturerName: string;
  department: string | null;
  desiredSlotLabel: string; // e.g. "Tue afternoons, 30 min"
  position: number;
  status: WaitlistStatus;
  offeredStartAt?: string; // ISO-8601, set only when status === "OFFERED"
  offeredExpiresAt?: string; // ISO-8601, set only when status === "OFFERED"
}
