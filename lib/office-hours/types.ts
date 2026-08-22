import type { UserRole } from "@/lib/auth/types";

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

// Student dashboard's "Available today" widget — like PublicSlot but scoped
// to the authenticated dashboard (carries lecturerId so each row can link
// straight to that lecturer's slot picker). The public unauthenticated view
// deliberately doesn't expose this (capstone-api-endpoints.md §10 — no PII
// beyond name/department), but a numeric lecturerId isn't PII and an
// authenticated student needs it to navigate.
export interface TodayAvailabilitySlot {
  lecturerId: number;
  lecturerName: string;
  department: string | null;
  startAt: string; // ISO-8601
  endAt: string; // ISO-8601
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

// Weekly recurring availability rule (Pages.txt #16). dayOfWeek follows the
// same 1-5 Mon-Fri convention as RecurringBookingClient's DAY_OPTIONS.
export interface AvailabilityRule {
  id: number;
  dayOfWeek: number; // 1 = Monday .. 5 = Friday
  startTime: string; // "09:00"
  endTime: string; // "12:00"
  slotLengthMinutes: number;
  effectiveFrom: string; // ISO date, "2026-08-01"
  effectiveTo: string | null;
  active: boolean;
}

// One-off calendar exception layered on top of the weekly rules (Pages.txt
// #17) — BLOCK removes a normally-available window, ADD opens an extra one.
export type ExceptionType = "BLOCK" | "ADD";

export interface AvailabilityException {
  id: number;
  date: string; // ISO date
  type: ExceptionType;
  startTime: string;
  endTime: string;
  reason: string | null;
}

export interface ScheduleBlock {
  id: number;
  title: string;
  dayOfWeek: number; // 1 = Monday .. 7 = Sunday
  date?: string; // "13/07" or "13/07/2026" — calendar date scanned from PDF column header
  startTime: string;
  endTime: string;
  source: "IMPORTED" | "MANUAL";
  subjectCode?: string;
  subjectName?: string;
  group?: string;
  room?: string;
  lecturerName?: string;
  locationType?: "LAB" | "ROOM" | "ONLINE" | "OTHER";
  colorHue?: "brand" | "coral" | "rose" | "mint" | "info" | "warning";
  notes?: string;
}

// Per-slot waitlist queue transparency for a lecturer (Pages.txt #20) — read
// only, no allocation actions (Manual Override, #29, is Admin scope).
export interface SlotWaitlistQueueEntry {
  studentName: string;
  position: number;
  requestedAt: string; // ISO-8601
}

export interface SlotWaitlistGroup {
  id: number;
  slotLabel: string; // e.g. "Tuesdays, 10:00-10:30"
  queue: SlotWaitlistQueueEntry[];
}

// Admin User management (Pages.txt #22) — a platform-wide account row, not to
// be confused with the seeded MOCK_ACCOUNTS (lib/auth/mock-accounts.ts) used
// for login itself.
export interface AdminUserRow {
  id: number;
  fullName: string;
  email: string;
  role: UserRole;
  department: string | null;
  active: boolean;
}

// Semester management (Pages.txt #23) — CRUD + activate; exactly one row is
// active at a time, enforced when an admin activates another one.
export interface Semester {
  id: number;
  name: string; // "Fall 2026"
  startDate: string; // ISO date
  endDate: string; // ISO date
  active: boolean;
}

// Admin-scoped variant of ScheduleBlock (above) — same shape plus who the
// busy block belongs to, since admin's Schedule Import/Manual Entry (#24/#25)
// is a support fallback for *any* user (FR-5a), not just lecturers. Distinct
// from the inherited optional `lecturerName` (the instructor teaching that
// specific class, relevant when ownerRole is STUDENT) — ownerName is whose
// timetable this entry blocks time on.
export interface AdminScheduleEntry extends ScheduleBlock {
  ownerName: string;
  ownerRole: "STUDENT" | "LECTURER";
}

// One row parsed out of an EIU timetable PDF via lib/timetable/parse-pdf.ts —
// field names/shape mirror the validated TimeTableScanner.txt tool's JSON
// output 1:1, so the port is a straight translation, not a redesign.
export interface ParsedTimetableRow {
  day: string; // "Thứ 2".."Chủ Nhật" as scanned; mapped to dayOfWeek on import
  date: string | null; // "03/08" — the calendar date scanned off that day's column header, informational only (entries import as a recurring weekly pattern, not a one-off date)
  startTime: string;
  endTime: string;
  subjectCode: string;
  subjectName: string;
  group: string;
  room: string;
  lecturerName: string;
}

export interface ScheduleImportHistoryEntry {
  id: number;
  fileName: string;
  importedAt: string; // ISO-8601
  rowCount: number;
  status: "SUCCESS" | "FAILED";
}

// Allocation Policies manager (Pages.txt #27) — mirrors
// capstone-db-schema.md §4.2's allocation_policies: name is a fixed set,
// config carries tunable weights (empty for FCFS/ROUND_ROBIN), exactly one
// active at a time.
export type AllocationPolicyName = "FCFS" | "NEED" | "ROUND_ROBIN" | "HYBRID";

export interface AllocationPolicy {
  id: number;
  name: AllocationPolicyName;
  config: Record<string, number>;
  active: boolean;
}

// Allocation Events audit log (Pages.txt #28) + Manual Override (#29, a
// decision: "OVERRIDDEN" row). Mirrors capstone-db-schema.md §4.3's mutually
// exclusive field groups: SELECTED/SKIPPED carry policyName/computedScore/
// randomSeed; OVERRIDDEN instead carries overriddenByName/overrideReason.
export type AllocationDecision = "SELECTED" | "SKIPPED" | "OVERRIDDEN";

export interface AllocationEvent {
  id: number;
  slotLabel: string; // e.g. "Dr. Amara Chen — Tue 10:00"
  studentName: string;
  decision: AllocationDecision;
  policyName: AllocationPolicyName | null; // null only when OVERRIDDEN
  computedScore: number | null; // null only when OVERRIDDEN
  randomSeed: number | null; // null only when OVERRIDDEN
  overriddenByName: string | null; // set only when OVERRIDDEN
  overrideReason: string | null; // set only when OVERRIDDEN
  allocatedAt: string; // ISO-8601
}

// Equity section of the Analytics dashboard (Pages.txt #30) — Gini
// coefficients plus the Lorenz-curve points that back them, so the headline
// numbers and the chart always agree (both derive from the same distribution).
export interface EquityMetrics {
  giniSlotsPerStudent: number;
  giniLecturerAccess: number;
  lorenzCurve: { cumulativeStudentsPct: number; cumulativeSlotsPct: number }[];
}

// Policy-comparison section of the Analytics dashboard (Pages.txt #30) — one
// row per AllocationPolicy, four independently-scaled metrics (kept as small
// multiples, never one dual-axis chart).
export interface PolicyComparisonRow {
  policyName: AllocationPolicyName;
  giniSlotsPerStudent: number;
  giniLecturerAccess: number;
  utilizationPct: number;
  avgWaitMinutes: number;
}

// Research Tools (Pages.txt #31) — mirrors capstone-db-schema.md §4.4's
// synthetic_demand_runs table. `dataset jsonb` (the generated demand stream
// itself) is intentionally not modeled here: it's an opaque blob/pointer the
// UI never renders directly, only references by demandRunId.
export type ArrivalPattern = "POISSON" | "BURST_BEFORE_DEADLINE" | "UNIFORM";

export interface SyntheticDemandRun {
  id: number;
  seed: number;
  popularitySkew: number;
  arrivalPattern: ArrivalPattern;
  numStudents: number;
  numLecturers: number;
  generatedAt: string; // ISO-8601
}

// One policy's row in the `experiments` table (capstone-db-schema.md §4.4) —
// every field maps 1:1 to a DB column.
export interface ExperimentPolicyResult {
  policyName: AllocationPolicyName;
  giniSlotsPerStudent: number;
  giniLecturerAccess: number;
  maxMinRatio: number;
  pctStudentsWithSlot: number; // % of the simulated population that won >= 1 slot — plan.md §11.3's 4th fairness metric, previously missing from this type/the DB schema
  slotUtilizationPct: number;
  avgTimeToFillSeconds: number;
  offerRejectionRatePct: number;
  avgWaitTimeSeconds: number;
  waitTimeVariance: number;
}

// The DB's `experiments` table is one row per (demand_run, policy); this
// groups those rows because POST /research/experiments (capstone-api-
// endpoints.md §7.1) takes policyIds[] and GET /{id} returns metrics per
// policy in one response.
export interface Experiment {
  id: number;
  demandRunId: number;
  seed: number;
  policyNames: AllocationPolicyName[];
  results: ExperimentPolicyResult[];
  runAt: string; // ISO-8601
}
