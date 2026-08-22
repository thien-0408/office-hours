import type {
  AdminScheduleEntry,
  AdminUserRow,
  AllocationEvent,
  AllocationPolicy,
  AllocationPolicyName,
  AvailabilityException,
  AvailabilityRule,
  BookableSlot,
  Booking,
  BookingTimelineEvent,
  EquityMetrics,
  Experiment,
  ExperimentPolicyResult,
  Notification,
  NotificationPrefs,
  PolicyComparisonRow,
  PublicOfficeHoursResponse,
  PublicSlot,
  RecurringSeries,
  ScheduleBlock,
  ScheduleImportHistoryEntry,
  Semester,
  SlotWaitlistGroup,
  SyntheticDemandRun,
  TodayAvailabilitySlot,
  WaitlistEntry,
} from "./types";
import { memojiSrc } from "@/lib/avatar";
import { allocate } from "@/lib/allocation/engine";
import type { AllocationCandidate } from "@/lib/allocation/types";
import { mulberry32, seededHash } from "@/lib/prng";

// Stands in for GET /public/office-hours until the backend ships that endpoint
// (see docs/capstone-api-endpoints.md §10) — app/public/office-hours/page.tsx
// falls back to this whenever the real API call fails. `photoUrl` is a
// mock-only field (Unsplash portraits) — the real contract carries no lecturer
// PII beyond name/department, so it never appears in PublicSlot itself.
export interface MockPublicSlot extends PublicSlot {
  photoUrl: string;
  id: number;
  lecturerId: number;
}

export interface MockOfficeHoursResponse extends Omit<PublicOfficeHoursResponse, "content"> {
  content: MockPublicSlot[];
}

export interface MockLecturer {
  id: number;
  slug: string;
  name: string;
  department: string;
  photoUrl: string;
  blurb: string;
}

const MOCK_LECTURERS: MockLecturer[] = [
  {
    id: 1,
    slug: "amara-chen",
    name: "Dr. Amara Chen",
    department: "Computer Science",
    photoUrl: memojiSrc(1),
    blurb: "Thesis proposals, capstone scope, algorithms coursework.",
  },
  {
    id: 2,
    slug: "daniel-reyes",
    name: "Prof. Daniel Reyes",
    department: "Computer Science",
    photoUrl: memojiSrc(2),
    blurb: "Algorithms homework help, systems design questions.",
  },
  {
    id: 3,
    slug: "priya-nair",
    name: "Dr. Priya Nair",
    department: "Mathematics",
    photoUrl: memojiSrc(3),
    blurb: "Linear algebra, discrete math, exam review sessions.",
  },
  {
    id: 4,
    slug: "michael-osei",
    name: "Prof. Michael Osei",
    department: "Physics",
    photoUrl: memojiSrc(4),
    blurb: "Lab report feedback, mechanics and thermodynamics.",
  },
  {
    id: 5,
    slug: "laura-bianchi",
    name: "Dr. Laura Bianchi",
    department: "Economics",
    photoUrl: memojiSrc(5),
    blurb: "Midterm regrades, macro/micro theory questions.",
  },
  {
    id: 6,
    slug: "samuel-okafor",
    name: "Prof. Samuel Okafor",
    department: "Mathematics",
    photoUrl: memojiSrc(6),
    blurb: "Statistics, probability, and proof-writing help.",
  },
];

// dayOfWeek: 1=Mon..5=Fri, matching buildMockSlots' Mon-Fri generation.
function weekdayOf(date: Date): number {
  const day = date.getDay();
  return day === 0 ? 7 : day;
}

// Remaining (not-yet-started) open slots this week, grouped by lecturer and
// weekday — backs both the "available only" and "by day" browse filters.
function computeUpcomingAvailabilityByLecturer(): Map<number, Set<number>> {
  const now = new Date();
  const map = new Map<number, Set<number>>();
  buildMockSlots().forEach((slot) => {
    if (new Date(slot.startAt) < now) return;
    const days = map.get(slot.lecturerId) ?? new Set<number>();
    days.add(weekdayOf(new Date(slot.startAt)));
    map.set(slot.lecturerId, days);
  });
  return map;
}

// Stands in for GET /lecturers — the authenticated "browse" list, filterable
// by department, free-text (matched against name + department), weekday
// availability, and "has any open slot left this week".
export function getMockLecturers(params?: {
  department?: string;
  q?: string;
  dayOfWeek?: number;
  availableOnly?: boolean;
}): MockLecturer[] {
  const department = params?.department?.trim().toLowerCase();
  const q = params?.q?.trim().toLowerCase();
  const dayOfWeek = params?.dayOfWeek;
  const availableOnly = params?.availableOnly;

  const availabilityByLecturer =
    dayOfWeek || availableOnly ? computeUpcomingAvailabilityByLecturer() : null;

  return MOCK_LECTURERS.filter((lecturer) => {
    if (department && lecturer.department.toLowerCase() !== department) return false;
    if (q && !`${lecturer.name} ${lecturer.department}`.toLowerCase().includes(q)) return false;
    if (availabilityByLecturer) {
      const days = availabilityByLecturer.get(lecturer.id) ?? new Set<number>();
      if (dayOfWeek && !days.has(dayOfWeek)) return false;
      if (availableOnly && days.size === 0) return false;
    }
    return true;
  });
}

export function getMockLecturerById(id: number): MockLecturer | undefined {
  return MOCK_LECTURERS.find((l) => l.id === id);
}

const SLOT_HOURS = [9, 10, 11, 13, 14, 15];

function mostRecentMonday(base: Date): Date {
  const d = new Date(base);
  const day = d.getDay(); // 0 = Sunday
  const diff = (day === 0 ? -6 : 1) - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function buildMockSlots(): MockPublicSlot[] {
  const monday = mostRecentMonday(new Date());
  const slots: MockPublicSlot[] = [];

  for (let dayOffset = 0; dayOffset < 5; dayOffset++) {
    const day = new Date(monday);
    day.setDate(day.getDate() + dayOffset);

    MOCK_LECTURERS.forEach((lecturer, lecturerIdx) => {
      SLOT_HOURS.forEach((hour, hourIdx) => {
        // Deterministic thinning so the grid looks like a partially-booked
        // real calendar rather than every lecturer being free every hour.
        const seed = (dayOffset * 7 + lecturerIdx * 3 + hourIdx) % 5;
        if (seed === 0) return;

        const startAt = new Date(day);
        startAt.setHours(hour, 0, 0, 0);
        const endAt = new Date(startAt);
        endAt.setMinutes(endAt.getMinutes() + 30);

        slots.push({
          id: dayOffset * 1000 + lecturerIdx * 100 + hourIdx,
          lecturerId: lecturer.id,
          lecturerName: lecturer.name,
          department: lecturer.department,
          photoUrl: lecturer.photoUrl,
          startAt: startAt.toISOString(),
          endAt: endAt.toISOString(),
        });
      });
    });
  }

  return slots.sort((a, b) => a.startAt.localeCompare(b.startAt));
}

export function getMockOfficeHours(params: {
  department?: string;
  page: number;
  size: number;
}): MockOfficeHoursResponse {
  const { department, page, size } = params;

  const filtered = buildMockSlots().filter(
    (slot) => !department || slot.department?.toLowerCase() === department.toLowerCase()
  );

  const totalElements = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalElements / size));
  const content = filtered.slice(page * size, page * size + size);

  return { content, totalElements, totalPages, page, size };
}

// Stands in for GET /bookings until the backend ships that endpoint — dashboard
// home (app/(dashboard)/dashboard/page.tsx) uses this to sketch the student view.
export function getMockStudentBookings(): Booking[] {
  const now = new Date();

  function at(dayOffset: number, hour: number): Date {
    const d = new Date(now);
    d.setDate(d.getDate() + dayOffset);
    d.setHours(hour, 0, 0, 0);
    return d;
  }

  function range(start: Date, minutes: number): { startAt: string; endAt: string } {
    const end = new Date(start);
    end.setMinutes(end.getMinutes() + minutes);
    return { startAt: start.toISOString(), endAt: end.toISOString() };
  }

  const studentName = "Minh Nguyen"; // matches the seeded "student@officehours.dev" mock account

  return [
    {
      id: 1,
      lecturerName: "Dr. Amara Chen",
      studentName,
      department: "Computer Science",
      topic: "Thesis proposal review",
      status: "CONFIRMED",
      ...range(at(1, 10), 30),
    },
    {
      id: 2,
      lecturerName: "Prof. Daniel Reyes",
      studentName,
      department: "Computer Science",
      topic: "Algorithms HW3 help",
      status: "PENDING",
      ...range(at(2, 14), 30),
    },
    {
      id: 3,
      lecturerName: "Dr. Priya Nair",
      studentName,
      department: "Mathematics",
      topic: null,
      status: "PENDING",
      ...range(at(4, 9), 30),
    },
    {
      id: 4,
      lecturerName: "Prof. Michael Osei",
      studentName,
      department: "Physics",
      topic: "Lab report feedback",
      status: "COMPLETED",
      ...range(at(-3, 11), 30),
    },
    {
      id: 5,
      lecturerName: "Dr. Laura Bianchi",
      studentName,
      department: "Economics",
      topic: "Midterm regrade",
      status: "DECLINED",
      ...range(at(-1, 15), 30),
    },
  ];
}

// Stands in for GET /bookings filtered to the lecturer's slots — dashboard home's
// LecturerDashboard uses this. lecturerName matches the seeded
// "lecturer@officehours.dev" mock account so it's consistent across the demo.
export function getMockLecturerBookings(): Booking[] {
  const now = new Date();
  const lecturerName = "Dr. Amara Chen";

  function at(dayOffset: number, hour: number): Date {
    const d = new Date(now);
    d.setDate(d.getDate() + dayOffset);
    d.setHours(hour, 0, 0, 0);
    return d;
  }

  function range(start: Date, minutes: number): { startAt: string; endAt: string } {
    const end = new Date(start);
    end.setMinutes(end.getMinutes() + minutes);
    return { startAt: start.toISOString(), endAt: end.toISOString() };
  }

  return [
    {
      id: 101,
      lecturerName,
      studentName: "Linh Pham",
      department: "Computer Science",
      topic: "Capstone scope review",
      status: "PENDING",
      ...range(at(0, 13), 30),
    },
    {
      id: 102,
      lecturerName,
      studentName: "Huy Tran",
      department: "Computer Science",
      topic: "Algorithms office hours",
      status: "PENDING",
      ...range(at(0, 15), 30),
    },
    {
      id: 103,
      lecturerName,
      studentName: "Anh Vu",
      department: "Computer Science",
      topic: null,
      status: "CONFIRMED",
      ...range(at(0, 10), 30),
    },
    {
      id: 104,
      lecturerName,
      studentName: "Bao Nguyen",
      department: "Computer Science",
      topic: "Thesis proposal",
      status: "CONFIRMED",
      ...range(at(1, 11), 30),
    },
    {
      id: 105,
      lecturerName,
      studentName: "Chi Le",
      department: "Computer Science",
      topic: "Midterm regrade",
      status: "NO_SHOW",
      ...range(at(-2, 14), 30),
    },
    {
      id: 106,
      lecturerName,
      studentName: "Duc Hoang",
      department: "Computer Science",
      topic: "Project feedback",
      status: "COMPLETED",
      ...range(at(-1, 9), 30),
    },
  ];
}

// Today's still-open slots for one lecturer — reuses the same generated week
// buildMockSlots() already produces for the public listing, just filtered down.
export function getMockLecturerSlotsToday(lecturerName: string): PublicSlot[] {
  const todayKey = new Date().toDateString();
  return buildMockSlots().filter(
    (slot) => slot.lecturerName === lecturerName && new Date(slot.startAt).toDateString() === todayKey
  );
}

// Today's remaining open slots across ALL lecturers, filtered against the
// student's own class schedule (self-imported per Pages.txt #32) so what's
// shown is actually bookable — conflict-free-for-this-student, not just
// "open." Same value prop GET /lecturers/{id}/slots documents
// (capstone-api-endpoints.md §5), surfaced proactively on the dashboard
// before the student starts browsing lecturer-by-lecturer.
export function getMockTodaysAvailableSlots(limit = 6): TodayAvailabilitySlot[] {
  const now = new Date();
  const todayKey = now.toDateString();
  const todayDow = weekdayOf(now);
  const myClasses = getMockStudentScheduleBlocks().filter((block) => block.dayOfWeek === todayDow);

  function overlapsAClass(startAt: string, endAt: string): boolean {
    const start = new Date(startAt);
    const end = new Date(endAt);
    return myClasses.some((block) => {
      const [startH, startM] = block.startTime.split(":").map(Number);
      const [endH, endM] = block.endTime.split(":").map(Number);
      const blockStart = new Date(start);
      blockStart.setHours(startH, startM, 0, 0);
      const blockEnd = new Date(start);
      blockEnd.setHours(endH, endM, 0, 0);
      return start < blockEnd && end > blockStart;
    });
  }

  return buildMockSlots()
    .filter((slot) => new Date(slot.startAt).toDateString() === todayKey)
    .filter((slot) => new Date(slot.startAt) > now) // already-started slots aren't bookable
    .filter((slot) => !overlapsAClass(slot.startAt, slot.endAt))
    .sort((a, b) => a.startAt.localeCompare(b.startAt))
    .slice(0, limit)
    .map((slot) => ({
      lecturerId: slot.lecturerId,
      lecturerName: slot.lecturerName,
      department: slot.department,
      startAt: slot.startAt,
      endAt: slot.endAt,
    }));
}

export interface SuggestedSlot {
  id: number;
  lecturerId: number;
  lecturerName: string;
  department: string;
  photoUrl: string;
  blurb: string;
  startAt: string;
  endAt: string;
  dayOfWeek: number;
  dayLabel: string;
  formattedTime: string;
  specialtyTag: string;
  isConflictFree: boolean;
}

const SPECIALTY_TAGS: Record<number, string> = {
  1: "Algorithms & Capstone",
  2: "Systems & Architecture",
  3: "Linear Algebra & Calculus",
  4: "Physics & Lab Reports",
  5: "Economic Theory",
  6: "Probability & Statistics",
};

const SHORT_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function getMockSuggestedLecturerSlots(): SuggestedSlot[] {
  const allSlots = buildMockSlots();
  const myClasses = getMockStudentScheduleBlocks();
  const now = new Date();

  function checkConflict(startIso: string, endIso: string, dow: number): boolean {
    const start = new Date(startIso);
    const end = new Date(endIso);
    const dayClasses = myClasses.filter((c) => c.dayOfWeek === dow);

    return dayClasses.some((block) => {
      const [sH, sM] = block.startTime.split(":").map(Number);
      const [eH, eM] = block.endTime.split(":").map(Number);
      const bStart = new Date(start);
      bStart.setHours(sH, sM, 0, 0);
      const bEnd = new Date(start);
      bEnd.setHours(eH, eM, 0, 0);
      return start < bEnd && end > bStart;
    });
  }

  // Format time e.g. "10:00 AM – 10:30 AM"
  const timeFmt = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" });

  const suggestions: SuggestedSlot[] = [];

  for (const slot of allSlots) {
    const slotDate = new Date(slot.startAt);
    const dow = slotDate.getDay() === 0 ? 7 : slotDate.getDay();
    const hasConflict = checkConflict(slot.startAt, slot.endAt, dow);
    if (hasConflict) continue; // Only suggest conflict-free slots

    const isSlotToday = slotDate.toDateString() === now.toDateString();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const isSlotTomorrow = slotDate.toDateString() === tomorrow.toDateString();

    let dayLabel = SHORT_DAYS[slotDate.getDay()];
    if (isSlotToday) dayLabel = "Today";
    else if (isSlotTomorrow) dayLabel = "Tomorrow";

    suggestions.push({
      id: slot.id,
      lecturerId: slot.lecturerId,
      lecturerName: slot.lecturerName,
      department: slot.department ?? "General Faculty",
      photoUrl: slot.photoUrl,
      blurb: MOCK_LECTURERS.find((l) => l.id === slot.lecturerId)?.blurb ?? "Office hours discussion.",
      startAt: slot.startAt,
      endAt: slot.endAt,
      dayOfWeek: dow,
      dayLabel,
      formattedTime: `${timeFmt.format(slotDate)} – ${timeFmt.format(new Date(slot.endAt))}`,
      specialtyTag: SPECIALTY_TAGS[slot.lecturerId] || "Academic Advising",
      isConflictFree: true,
    });
  }

  // Sort by earliest start time, and pick diverse top slots
  suggestions.sort((a, b) => a.startAt.localeCompare(b.startAt));

  return suggestions;
}

// Stands in for combining several /admin/analytics/* endpoints (capstone-api-
// endpoints.md §9) into the one overview row the admin dashboard needs.
export interface AdminOverviewStats {
  activeUsers: number;
  bookingsThisWeek: number;
  utilizationPct: number;
  noShowRatePct: number;
}

export function getMockAdminOverview(): AdminOverviewStats {
  return {
    activeUsers: 128,
    bookingsThisWeek: 47,
    utilizationPct: 68,
    noShowRatePct: 6,
  };
}

// Chart data for ActivityChart — one point per bar, `key` is what the
// "highlight this bar" prop matches against.
export interface ActivityPoint {
  key: string;
  label: string;
  value: number;
}

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// Deterministic per-weekday booking counts for the current week (weekends
// lighter) — dashboard home's student "Booking activity" chart.
export function getMockWeeklyActivity(): ActivityPoint[] {
  const monday = mostRecentMonday(new Date());
  return WEEKDAY_LABELS.map((label, i) => {
    const day = new Date(monday);
    day.setDate(day.getDate() + i);
    const base = i >= 5 ? 1 : 3;
    const variance = (i * 7) % 5;
    return { key: day.toDateString(), label, value: base + variance };
  });
}

// Bookings-per-lecturer for the current week — admin "Advisor load" chart.
export function getMockAdvisorLoad(): ActivityPoint[] {
  return MOCK_LECTURERS.map((lecturer, i) => ({
    key: lecturer.name,
    label: lecturer.name.replace(/^(Dr\.|Prof\.)\s*/, ""),
    value: 4 + ((i * 5) % 9),
  }));
}

// A few extra rows from lecturers other than "Dr. Amara Chen" so the admin's
// cross-lecturer view (My Bookings, perspective="admin") reads as real rather
// than just being the same seeded lecturer's queue again.
function getMockOtherLecturerBookings(): Booking[] {
  const now = new Date();
  function at(dayOffset: number, hour: number): Date {
    const d = new Date(now);
    d.setDate(d.getDate() + dayOffset);
    d.setHours(hour, 0, 0, 0);
    return d;
  }
  function range(start: Date, minutes: number): { startAt: string; endAt: string } {
    const end = new Date(start);
    end.setMinutes(end.getMinutes() + minutes);
    return { startAt: start.toISOString(), endAt: end.toISOString() };
  }

  return [
    {
      id: 201,
      lecturerName: "Prof. Daniel Reyes",
      studentName: "Minh Nguyen",
      department: "Computer Science",
      topic: "Algorithms HW3 help",
      status: "PENDING",
      ...range(at(2, 14), 30),
    },
    {
      id: 202,
      lecturerName: "Dr. Priya Nair",
      studentName: "Thao Bui",
      department: "Mathematics",
      topic: "Linear algebra review",
      status: "CONFIRMED",
      ...range(at(1, 9), 30),
    },
    {
      id: 203,
      lecturerName: "Prof. Michael Osei",
      studentName: "Khoa Dang",
      department: "Physics",
      topic: null,
      status: "COMPLETED",
      ...range(at(-2, 11), 30),
    },
  ];
}

// Stands in for GET /bookings across every lecturer — My Bookings' admin
// perspective and Booking Detail's lookup both read from this combined set.
export function getMockAllBookings(): Booking[] {
  return [...getMockStudentBookings(), ...getMockLecturerBookings(), ...getMockOtherLecturerBookings()];
}

export function getMockBookingById(id: number): Booking | undefined {
  return getMockAllBookings().find((b) => b.id === id);
}

// Timeline is derived from the booking's current status + startAt rather than
// hand-authored per id, so it always agrees with whatever booking it's called
// on. Real wiring point: GET /bookings/{id}/history once the backend ships it.
export function getMockBookingTimeline(booking: Booking): BookingTimelineEvent[] {
  const created = new Date(booking.startAt);
  created.setDate(created.getDate() - 3);
  const events: BookingTimelineEvent[] = [
    { id: 1, label: "Booking requested", at: created.toISOString() },
  ];

  const decided = new Date(booking.startAt);
  decided.setDate(decided.getDate() - 2);

  switch (booking.status) {
    case "PENDING":
      break;
    case "CONFIRMED":
      events.push({ id: 2, label: "Confirmed by lecturer", at: decided.toISOString(), status: "CONFIRMED" });
      break;
    case "DECLINED":
      events.push({ id: 2, label: "Declined by lecturer", at: decided.toISOString(), status: "DECLINED" });
      break;
    case "CANCELLED":
      events.push({ id: 2, label: "Cancelled", at: decided.toISOString(), status: "CANCELLED" });
      break;
    case "COMPLETED":
      events.push({ id: 2, label: "Confirmed by lecturer", at: decided.toISOString(), status: "CONFIRMED" });
      events.push({ id: 3, label: "Marked completed", at: booking.endAt, status: "COMPLETED" });
      break;
    case "NO_SHOW":
      events.push({ id: 2, label: "Confirmed by lecturer", at: decided.toISOString(), status: "CONFIRMED" });
      events.push({ id: 3, label: "Marked no-show", at: booking.endAt, status: "NO_SHOW" });
      break;
  }

  return events;
}

// Stands in for GET /notifications — a handful spanning types/read-states,
// createdAt relative to now. SSE live-updates (GET /notifications/stream) are
// backend-dependent and intentionally not mocked here — see the notifications
// page's inline TODO.
export function getMockNotifications(): Notification[] {
  const now = new Date();
  function hoursAgo(h: number): string {
    const d = new Date(now);
    d.setHours(d.getHours() - h);
    return d.toISOString();
  }

  return [
    {
      id: 1,
      type: "BOOKING_CONFIRMED",
      title: "Booking confirmed",
      body: "Dr. Amara Chen confirmed your thesis proposal review.",
      createdAt: hoursAgo(2),
      read: false,
      bookingId: 1,
    },
    {
      id: 2,
      type: "WAITLIST_OFFERED",
      title: "Slot offered from waitlist",
      body: "A 2:00 PM slot with Dr. Priya Nair just opened up for you.",
      createdAt: hoursAgo(5),
      read: false,
    },
    {
      id: 3,
      type: "REMINDER",
      title: "Upcoming booking tomorrow",
      body: "Algorithms HW3 help with Prof. Daniel Reyes at 2:00 PM.",
      createdAt: hoursAgo(20),
      read: false,
    },
    {
      id: 4,
      type: "BOOKING_DECLINED",
      title: "Booking declined",
      body: "Dr. Laura Bianchi declined your midterm regrade request.",
      createdAt: hoursAgo(30),
      read: true,
      bookingId: 5,
    },
    {
      id: 5,
      type: "BOOKING_CANCELLED",
      title: "Booking cancelled",
      body: "Your lab report feedback session was cancelled.",
      createdAt: hoursAgo(72),
      read: true,
    },
  ];
}

export function getMockNotificationPrefs(): NotificationPrefs {
  return {
    bookingConfirmed: true,
    bookingDeclined: true,
    waitlistOffer: true,
    reminders: false,
  };
}

// One lecturer's week grid for the slot picker (#11). `weekOffset` shifts the
// Monday (0 = this week, 1 = next week, …). `conflict` is a deterministic
// overlap check against the student's own bookings — not a real conflict
// engine; real wiring point is GET /lecturers/{id}/slots?conflictFilter=true.
export function getMockLecturerWeekSlots(lecturerId: number, weekOffset: number): BookableSlot[] {
  const lecturer = getMockLecturerById(lecturerId);
  if (!lecturer) return [];

  const monday = mostRecentMonday(new Date());
  monday.setDate(monday.getDate() + weekOffset * 7);

  const ownBookings = getMockStudentBookings().filter(
    (b) => b.status !== "DECLINED" && b.status !== "CANCELLED"
  );

  const slots: BookableSlot[] = [];
  for (let dayOffset = 0; dayOffset < 5; dayOffset++) {
    const day = new Date(monday);
    day.setDate(day.getDate() + dayOffset);

    SLOT_HOURS.forEach((hour, hourIdx) => {
      const startAt = new Date(day);
      startAt.setHours(hour, 0, 0, 0);
      const endAt = new Date(startAt);
      endAt.setMinutes(endAt.getMinutes() + 30);

      const seed = (weekOffset * 11 + dayOffset * 7 + lecturerId * 3 + hourIdx) % 5;
      const available = seed !== 0;

      const conflict = ownBookings.some((b) => startAt.toISOString() < b.endAt && b.startAt < endAt.toISOString());

      slots.push({
        id: weekOffset * 10000 + dayOffset * 1000 + lecturerId * 100 + hourIdx,
        lecturerId,
        startAt: startAt.toISOString(),
        endAt: endAt.toISOString(),
        available,
        conflict,
      });
    });
  }

  return slots;
}

// Stands in for GET /bookings/recurring — a couple of demo series, one still
// active and one already cancelled, so both list states render.
export function getMockRecurringSeries(): RecurringSeries[] {
  const now = new Date();
  function weeksAgo(w: number, hour: number): Date {
    const d = new Date(now);
    d.setDate(d.getDate() - w * 7);
    d.setHours(hour, 0, 0, 0);
    return d;
  }

  return [
    {
      id: 1,
      lecturerName: "Dr. Amara Chen",
      department: "Computer Science",
      dayOfWeek: 2, // Tuesday
      startTime: "10:00",
      endTime: "10:30",
      semester: "Fall 2026",
      status: "ACTIVE",
      occurrences: [3, 2, 1, 0].map((w, i) => ({
        id: i + 1,
        startAt: weeksAgo(w, 10).toISOString(),
        status: w === 0 ? "CONFIRMED" : "COMPLETED",
      })),
    },
    {
      id: 2,
      lecturerName: "Dr. Priya Nair",
      department: "Mathematics",
      dayOfWeek: 4, // Thursday
      startTime: "09:00",
      endTime: "09:30",
      semester: "Fall 2026",
      status: "CANCELLED",
      occurrences: [2, 1].map((w, i) => ({
        id: i + 1,
        startAt: weeksAgo(w, 9).toISOString(),
        status: "COMPLETED",
      })),
    },
  ];
}

// Stands in for GET /waitlist — a mix of statuses so the page's filter tabs
// and the accept/decline affordance both have something to show.
export function getMockWaitlistEntries(): WaitlistEntry[] {
  const now = new Date();
  function hoursFromNow(h: number): string {
    const d = new Date(now);
    d.setHours(d.getHours() + h);
    return d.toISOString();
  }

  return [
    {
      id: 1,
      lecturerName: "Dr. Amara Chen",
      department: "Computer Science",
      desiredSlotLabel: "Weekday mornings, 30 min",
      position: 2,
      status: "WAITING",
    },
    {
      id: 2,
      lecturerName: "Prof. Daniel Reyes",
      department: "Computer Science",
      desiredSlotLabel: "Tue/Thu afternoons, 30 min",
      position: 1,
      status: "OFFERED",
      offeredStartAt: hoursFromNow(20),
      offeredExpiresAt: hoursFromNow(2),
    },
    {
      id: 3,
      lecturerName: "Dr. Laura Bianchi",
      department: "Economics",
      desiredSlotLabel: "Fridays, 30 min",
      position: 4,
      status: "WAITING",
    },
  ];
}

// Stands in for GET /lecturers/me/availability-rules — the seeded lecturer's
// weekly recurring office-hours rules (Pages.txt #16).
export function getMockAvailabilityRules(): AvailabilityRule[] {
  return [
    {
      id: 1,
      dayOfWeek: 1,
      startTime: "09:00",
      endTime: "11:00",
      slotLengthMinutes: 30,
      effectiveFrom: "2026-08-01",
      effectiveTo: null,
      active: true,
    },
    {
      id: 2,
      dayOfWeek: 2,
      startTime: "13:00",
      endTime: "15:00",
      slotLengthMinutes: 30,
      effectiveFrom: "2026-08-01",
      effectiveTo: null,
      active: true,
    },
    {
      id: 3,
      dayOfWeek: 4,
      startTime: "10:00",
      endTime: "12:00",
      slotLengthMinutes: 15,
      effectiveFrom: "2026-08-01",
      effectiveTo: "2026-12-19",
      active: true,
    },
    {
      id: 4,
      dayOfWeek: 5,
      startTime: "09:00",
      endTime: "10:00",
      slotLengthMinutes: 30,
      effectiveFrom: "2026-08-01",
      effectiveTo: null,
      active: false,
    },
  ];
}

// Stands in for GET /lecturers/me/availability-exceptions — one-off BLOCK/ADD
// entries layered on top of the weekly rules above (Pages.txt #17).
export function getMockAvailabilityExceptions(): AvailabilityException[] {
  const now = new Date();
  function daysFromNow(d: number): string {
    const date = new Date(now);
    date.setDate(date.getDate() + d);
    return date.toISOString().slice(0, 10);
  }

  return [
    {
      id: 1,
      date: daysFromNow(3),
      type: "BLOCK",
      startTime: "09:00",
      endTime: "11:00",
      reason: "Faculty meeting",
    },
    {
      id: 2,
      date: daysFromNow(6),
      type: "ADD",
      startTime: "15:00",
      endTime: "16:00",
      reason: "Extra hours before midterm",
    },
    {
      id: 3,
      date: daysFromNow(10),
      type: "BLOCK",
      startTime: "13:00",
      endTime: "15:00",
      reason: null,
    },
  ];
}

const MOCK_DAY_DATES: Record<number, string> = {
  1: "13/07",
  2: "14/07",
  3: "15/07",
  4: "16/07",
  5: "17/07",
  6: "18/07",
  7: "19/07",
};

// Stands in for GET /users/me/schedule-entries (lecturer) — self-imported/
// manual teaching schedule (Pages.txt #18). Previously admin-only; now the
// lecturer's own AAO self-import populates this (capstone-api-endpoints.md §4).
export function getMockScheduleBlocks(): ScheduleBlock[] {
  const raw: ScheduleBlock[] = [
    {
      id: 1,
      title: "Thiết kế trải nghiệm người dùng (CSW 437)",
      subjectCode: "CSW 437",
      subjectName: "Thiết kế trải nghiệm người dùng",
      group: "E1",
      room: "213.B08 - Phòng học vừa",
      lecturerName: "Dr. Amara Chen",
      locationType: "ROOM",
      dayOfWeek: 1,
      startTime: "09:30",
      endTime: "11:30",
      colorHue: "coral",
      source: "IMPORTED",
    },
    {
      id: 2,
      title: "CS 301 — Algorithms",
      subjectCode: "CS 301",
      subjectName: "Algorithms",
      group: "02",
      room: "302.B08 - Giảng đường",
      lecturerName: "Dr. Amara Chen",
      locationType: "ROOM",
      dayOfWeek: 1,
      startTime: "11:30",
      endTime: "13:00",
      colorHue: "mint",
      source: "IMPORTED",
    },
    {
      id: 3,
      title: "Phát triển ứng dụng di động (CSW 430)",
      subjectCode: "CSW 430",
      subjectName: "Phát triển ứng dụng di động",
      group: "01",
      room: "ONLINE 3 - Virtual Room",
      lecturerName: "Dr. Amara Chen",
      locationType: "ONLINE",
      dayOfWeek: 1,
      startTime: "16:30",
      endTime: "18:30",
      colorHue: "brand",
      source: "IMPORTED",
    },
    {
      id: 4,
      title: "CS 410 — Capstone Seminar",
      subjectCode: "CS 410",
      subjectName: "Capstone Seminar",
      group: "01",
      room: "105.B08 - Phòng seminar",
      lecturerName: "Dr. Amara Chen",
      locationType: "ROOM",
      dayOfWeek: 2,
      startTime: "09:00",
      endTime: "10:30",
      colorHue: "rose",
      source: "IMPORTED",
    },
    {
      id: 5,
      title: "Kỹ năng lập trình chuyên nghiệp (CSE 422)",
      subjectCode: "CSE 422",
      subjectName: "Kỹ năng lập trình chuyên nghiệp",
      group: "E",
      room: "221.B08 - Phòng học nhỏ",
      lecturerName: "Dr. Amara Chen",
      locationType: "ROOM",
      dayOfWeek: 2,
      startTime: "16:30",
      endTime: "18:30",
      colorHue: "info",
      source: "IMPORTED",
    },
    {
      id: 6,
      title: "Thiết kế trải nghiệm người dùng (CSW 437)",
      subjectCode: "CSW 437",
      subjectName: "Thiết kế trải nghiệm người dùng",
      group: "E1",
      room: "213.B08 - Phòng học vừa",
      lecturerName: "Dr. Amara Chen",
      locationType: "ROOM",
      dayOfWeek: 3,
      startTime: "09:30",
      endTime: "11:30",
      colorHue: "coral",
      source: "IMPORTED",
    },
    {
      id: 7,
      title: "CS 301 — Algorithms",
      subjectCode: "CS 301",
      subjectName: "Algorithms",
      group: "02",
      room: "302.B08 - Giảng đường",
      lecturerName: "Dr. Amara Chen",
      locationType: "ROOM",
      dayOfWeek: 3,
      startTime: "11:30",
      endTime: "13:00",
      colorHue: "mint",
      source: "IMPORTED",
    },
    {
      id: 8,
      title: "Phát triển ứng dụng di động (CSW 430)",
      subjectCode: "CSW 430",
      subjectName: "Phát triển ứng dụng di động",
      group: "01",
      room: "ONLINE 3 - Virtual Room",
      lecturerName: "Dr. Amara Chen",
      locationType: "ONLINE",
      dayOfWeek: 3,
      startTime: "16:30",
      endTime: "18:30",
      colorHue: "brand",
      source: "IMPORTED",
    },
    {
      id: 9,
      title: "Phát triển ứng dụng di động (CSW 430) (LAB)",
      subjectCode: "CSW 430",
      subjectName: "Phát triển ứng dụng di động",
      group: "01",
      room: "LAB405.B08 - Lab máy tính",
      lecturerName: "Dr. Amara Chen",
      locationType: "LAB",
      dayOfWeek: 4,
      startTime: "07:30",
      endTime: "11:30",
      colorHue: "brand",
      source: "IMPORTED",
    },
    {
      id: 10,
      title: "Department Academic Committee",
      subjectName: "Department Academic Committee",
      room: "Boardroom B02 - Tòa nhà B",
      locationType: "ROOM",
      dayOfWeek: 4,
      startTime: "14:00",
      endTime: "15:00",
      source: "MANUAL",
      notes: "Curriculum review & allocation planning meeting",
    },
    {
      id: 11,
      title: "Kỹ năng lập trình chuyên nghiệp (CSE 422)",
      subjectCode: "CSE 422",
      subjectName: "Kỹ năng lập trình chuyên nghiệp",
      group: "E",
      room: "221.B08 - Phòng học nhỏ",
      lecturerName: "Dr. Amara Chen",
      locationType: "ROOM",
      dayOfWeek: 4,
      startTime: "16:30",
      endTime: "18:30",
      colorHue: "info",
      source: "IMPORTED",
    },
    {
      id: 12,
      title: "Thesis Committee Defense — B. Nguyen",
      subjectName: "Thesis Committee Defense",
      room: "Meeting Room 402 - Tòa nhà A",
      locationType: "ROOM",
      dayOfWeek: 5,
      startTime: "13:00",
      endTime: "14:00",
      source: "MANUAL",
      notes: "Undergraduate capstone final evaluation panel",
    },
    {
      id: 13,
      title: "Kỹ năng lập trình chuyên nghiệp (CSE 422) (LAB)",
      subjectCode: "CSE 422",
      subjectName: "Kỹ năng lập trình chuyên nghiệp",
      group: "E",
      room: "LAB403.B08 - Lab máy tính",
      lecturerName: "Dr. Amara Chen",
      locationType: "LAB",
      dayOfWeek: 6,
      startTime: "07:30",
      endTime: "11:30",
      colorHue: "info",
      source: "IMPORTED",
    },
    {
      id: 14,
      title: "Thiết kế trải nghiệm người dùng (CSW 437) (Studio)",
      subjectCode: "CSW 437",
      subjectName: "Thiết kế trải nghiệm người dùng",
      group: "E1",
      room: "LAB405.B08 - Lab máy tính",
      lecturerName: "Dr. Amara Chen",
      locationType: "LAB",
      dayOfWeek: 6,
      startTime: "12:30",
      endTime: "16:30",
      colorHue: "coral",
      source: "IMPORTED",
    },
  ];
  return raw.map((b) => ({ ...b, date: b.date ?? MOCK_DAY_DATES[b.dayOfWeek] }));
}

// Stands in for GET /users/me/schedule-entries (student) — self-imported
// class timetable (Pages.txt #32, net-new), feeding the conflict filter on
// GET /lecturers/{id}/slots.
export function getMockStudentScheduleBlocks(): ScheduleBlock[] {
  const raw: ScheduleBlock[] = [
    {
      id: 1,
      title: "Thiết kế trải nghiệm người dùng (CSW 437)",
      subjectCode: "CSW 437",
      subjectName: "Thiết kế trải nghiệm người dùng",
      group: "E1",
      room: "213.B08 - Phòng học vừa",
      lecturerName: "Anirban Mitra",
      locationType: "ROOM",
      dayOfWeek: 1,
      startTime: "09:30",
      endTime: "11:30",
      colorHue: "coral",
      source: "IMPORTED",
    },
    {
      id: 2,
      title: "Phát triển ứng dụng di động (CSW 430)",
      subjectCode: "CSW 430",
      subjectName: "Phát triển ứng dụng di động",
      group: "01",
      room: "ONLINE 3",
      lecturerName: "Trần Văn Tài",
      locationType: "ONLINE",
      dayOfWeek: 1,
      startTime: "16:30",
      endTime: "18:30",
      colorHue: "brand",
      source: "IMPORTED",
    },
    {
      id: 3,
      title: "Kỹ năng lập trình chuyên nghiệp (CSE 422)",
      subjectCode: "CSE 422",
      subjectName: "Kỹ năng lập trình chuyên nghiệp",
      group: "E",
      room: "221.B08",
      lecturerName: "Rohit Kumar Kasera",
      locationType: "ROOM",
      dayOfWeek: 2,
      startTime: "16:30",
      endTime: "18:30",
      colorHue: "info",
      source: "IMPORTED",
    },
    {
      id: 4,
      title: "Phát triển ứng dụng di động (CSW 430) (LAB)",
      subjectCode: "CSW 430",
      subjectName: "Phát triển ứng dụng di động",
      group: "01",
      room: "LAB405.B08 - Lab máy tính",
      lecturerName: "Nguyễn Hoàng Lý",
      locationType: "LAB",
      dayOfWeek: 4,
      startTime: "07:30",
      endTime: "11:30",
      colorHue: "brand",
      source: "IMPORTED",
    },
    {
      id: 5,
      title: "Kỹ năng lập trình chuyên nghiệp (CSE 422) (LAB)",
      subjectCode: "CSE 422",
      subjectName: "Kỹ năng lập trình chuyên nghiệp",
      group: "E",
      room: "LAB403.B08 - Lab máy tính",
      lecturerName: "Rohit Kumar Kasera",
      locationType: "LAB",
      dayOfWeek: 6,
      startTime: "07:30",
      endTime: "11:30",
      colorHue: "info",
      source: "IMPORTED",
    },
  ];
  return raw.map((b) => ({ ...b, date: b.date ?? MOCK_DAY_DATES[b.dayOfWeek] }));
}

// Stands in for GET /users/me/schedule-imports — self-service import history
// (student or lecturer). No seed rows: self-service is net-new, so a fresh
// account has nothing imported yet until they upload their own AAO export.
export function getMockMyScheduleImportHistory(): ScheduleImportHistoryEntry[] {
  return [];
}

// Stands in for GET /lecturers/me/slot-waitlist — per-slot queue transparency
// (Pages.txt #20), read-only. Requested-at timestamps derived relative to now
// so the demo stays stable across reloads without a real backend.
export function getMockSlotWaitlistGroups(): SlotWaitlistGroup[] {
  const now = new Date();
  function daysAgo(d: number): string {
    const date = new Date(now);
    date.setDate(date.getDate() - d);
    return date.toISOString();
  }

  return [
    {
      id: 1,
      slotLabel: "Mondays, 9:00–9:30 AM",
      queue: [
        { studentName: "Linh Pham", position: 1, requestedAt: daysAgo(4) },
        { studentName: "Huy Tran", position: 2, requestedAt: daysAgo(2) },
        { studentName: "Anh Vu", position: 3, requestedAt: daysAgo(1) },
      ],
    },
    {
      id: 2,
      slotLabel: "Tuesdays, 1:00–1:30 PM",
      queue: [{ studentName: "Bao Nguyen", position: 1, requestedAt: daysAgo(3) }],
    },
  ];
}

// Stands in for GET /admin/users — a platform-wide account list (Pages.txt
// #22), separate from mock-accounts.ts's 3 login-only seed accounts. Includes
// rows matching those 3 seeded accounts so the data reads as consistent with
// what you can actually log in as.
export function getMockAdminUsers(): AdminUserRow[] {
  return [
    { id: 1001, fullName: "Minh Nguyen", email: "student@officehours.dev", role: "STUDENT", department: "Computer Science", active: true },
    { id: 2001, fullName: "Dr. Amara Chen", email: "lecturer@officehours.dev", role: "LECTURER", department: "Computer Science", active: true },
    { id: 3001, fullName: "Huong Tran", email: "admin@officehours.dev", role: "ADMIN", department: null, active: true },
    { id: 1002, fullName: "Linh Pham", email: "linh.pham@student.eiu.edu.vn", role: "STUDENT", department: "Computer Science", active: true },
    { id: 1003, fullName: "Huy Tran", email: "huy.tran@student.eiu.edu.vn", role: "STUDENT", department: "Mathematics", active: true },
    { id: 1004, fullName: "Anh Vu", email: "anh.vu@student.eiu.edu.vn", role: "STUDENT", department: "Physics", active: false },
    { id: 2002, fullName: "Prof. Daniel Reyes", email: "daniel.reyes@eiu.edu.vn", role: "LECTURER", department: "Computer Science", active: true },
    { id: 2003, fullName: "Dr. Priya Nair", email: "priya.nair@eiu.edu.vn", role: "LECTURER", department: "Mathematics", active: true },
    { id: 2004, fullName: "Prof. Michael Osei", email: "michael.osei@eiu.edu.vn", role: "LECTURER", department: "Physics", active: true },
    { id: 2005, fullName: "Dr. Laura Bianchi", email: "laura.bianchi@eiu.edu.vn", role: "LECTURER", department: "Economics", active: false },
    { id: 3002, fullName: "Khoa Dang", email: "khoa.dang@eiu.edu.vn", role: "ADMIN", department: null, active: true },
  ];
}

// Stands in for GET /admin/semesters — CRUD + activate (Pages.txt #23).
// Exactly one row is active; enforced by the page's "Activate" action, not
// here (this is just the seed).
export function getMockSemesters(): Semester[] {
  return [
    { id: 1, name: "Spring 2026", startDate: "2026-01-12", endDate: "2026-05-15", active: false },
    { id: 2, name: "Summer 2026", startDate: "2026-05-25", endDate: "2026-07-31", active: false },
    { id: 3, name: "Fall 2026", startDate: "2026-08-24", endDate: "2026-12-19", active: true },
    { id: 4, name: "Spring 2027", startDate: "2027-01-11", endDate: "2027-05-14", active: false },
  ];
}

// Stands in for GET /admin/schedule-entries — the admin-wide analogue of
// getMockScheduleBlocks() (Phase 10's lecturer-scoped /dashboard/schedule),
// spanning multiple lecturers so Manual Entry/Import previews have real rows
// to list and delete.
export function getMockAdminScheduleEntries(): AdminScheduleEntry[] {
  return [
    { id: 1, ownerName: "Dr. Amara Chen", ownerRole: "LECTURER", title: "CS 301 — Algorithms", dayOfWeek: 1, startTime: "11:30", endTime: "13:00", source: "IMPORTED" },
    { id: 2, ownerName: "Dr. Amara Chen", ownerRole: "LECTURER", title: "CS 301 — Algorithms", dayOfWeek: 3, startTime: "11:30", endTime: "13:00", source: "IMPORTED" },
    { id: 3, ownerName: "Dr. Amara Chen", ownerRole: "LECTURER", title: "CS 410 — Capstone Seminar", dayOfWeek: 2, startTime: "09:00", endTime: "10:30", source: "IMPORTED" },
    { id: 4, ownerName: "Prof. Daniel Reyes", ownerRole: "LECTURER", title: "CS 220 — Data Structures", dayOfWeek: 2, startTime: "13:30", endTime: "15:00", source: "IMPORTED" },
    { id: 5, ownerName: "Dr. Priya Nair", ownerRole: "LECTURER", title: "MATH 210 — Linear Algebra", dayOfWeek: 4, startTime: "08:00", endTime: "09:30", source: "IMPORTED" },
    { id: 6, ownerName: "Dr. Amara Chen", ownerRole: "LECTURER", title: "Department committee", dayOfWeek: 4, startTime: "14:00", endTime: "15:00", source: "MANUAL" },
    { id: 7, ownerName: "Linh Pham", ownerRole: "STUDENT", title: "CS 301 — Algorithms", lecturerName: "Dr. Amara Chen", dayOfWeek: 1, startTime: "11:30", endTime: "13:00", source: "IMPORTED" },
    { id: 8, ownerName: "Huy Tran", ownerRole: "STUDENT", title: "MATH 210 — Linear Algebra", lecturerName: "Dr. Priya Nair", dayOfWeek: 4, startTime: "08:00", endTime: "09:30", source: "IMPORTED" },
  ];
}

// Stands in for GET /admin/schedule-imports — past PDF import "jobs" (Pages.txt
// #24's import history table). No real backend job to poll, so this is just
// the seed history; the Import tab appends session-added rows on top.
export function getMockScheduleImportHistory(): ScheduleImportHistoryEntry[] {
  const now = new Date();
  function daysAgo(d: number): string {
    const date = new Date(now);
    date.setDate(date.getDate() - d);
    return date.toISOString();
  }

  return [
    { id: 1, fileName: "cs-department-fall2026.pdf", importedAt: daysAgo(12), rowCount: 24, status: "SUCCESS" },
    { id: 2, fileName: "math-department-fall2026.pdf", importedAt: daysAgo(9), rowCount: 18, status: "SUCCESS" },
    { id: 3, fileName: "physics-department-fall2026.pdf", importedAt: daysAgo(2), rowCount: 0, status: "FAILED" },
  ];
}

// Stands in for GET /allocation-policies (Pages.txt #27). Matches
// capstone-db-schema.md §4.2 — HYBRID is active, matching the "tuned HYBRID
// weighting" example in capstone-api-endpoints.md §7.
export function getMockAllocationPolicies(): AllocationPolicy[] {
  return [
    { id: 1, name: "FCFS", config: {}, active: false },
    { id: 2, name: "NEED", config: { needWeight: 1 }, active: false },
    { id: 3, name: "ROUND_ROBIN", config: {}, active: false },
    { id: 4, name: "HYBRID", config: { needWeight: 0.5, waitTimeWeight: 0.3, fairnessWeight: 0.2 }, active: true },
  ];
}

// Stands in for GET /allocation-events (Pages.txt #28). Every candidate
// considered gets a row (capstone-db-schema.md §4.3's design note), not just
// winners — several SKIPPED rows share a slot/seed with their SELECTED
// sibling. Two OVERRIDDEN rows seed Manual Override's (#29) audit trail.
export function getMockAllocationEvents(): AllocationEvent[] {
  const now = new Date();
  function hoursAgo(h: number): string {
    const d = new Date(now);
    d.setHours(d.getHours() - h);
    return d.toISOString();
  }

  return [
    { id: 1, slotLabel: "Dr. Amara Chen — Tue 10:00", studentName: "Linh Pham", decision: "SELECTED", policyName: "HYBRID", computedScore: 0.87, randomSeed: 4821, overriddenByName: null, overrideReason: null, allocatedAt: hoursAgo(2) },
    { id: 2, slotLabel: "Dr. Amara Chen — Tue 10:00", studentName: "Huy Tran", decision: "SKIPPED", policyName: "HYBRID", computedScore: 0.61, randomSeed: 4821, overriddenByName: null, overrideReason: null, allocatedAt: hoursAgo(2) },
    { id: 3, slotLabel: "Dr. Amara Chen — Tue 10:00", studentName: "Anh Vu", decision: "SKIPPED", policyName: "HYBRID", computedScore: 0.44, randomSeed: 4821, overriddenByName: null, overrideReason: null, allocatedAt: hoursAgo(2) },
    { id: 4, slotLabel: "Prof. Daniel Reyes — Wed 14:00", studentName: "Bao Nguyen", decision: "SELECTED", policyName: "HYBRID", computedScore: 0.79, randomSeed: 5190, overriddenByName: null, overrideReason: null, allocatedAt: hoursAgo(9) },
    { id: 5, slotLabel: "Prof. Daniel Reyes — Wed 14:00", studentName: "Chi Le", decision: "SKIPPED", policyName: "HYBRID", computedScore: 0.52, randomSeed: 5190, overriddenByName: null, overrideReason: null, allocatedAt: hoursAgo(9) },
    { id: 6, slotLabel: "Dr. Priya Nair — Thu 09:00", studentName: "Duc Hoang", decision: "SELECTED", policyName: "HYBRID", computedScore: 0.91, randomSeed: 2207, overriddenByName: null, overrideReason: null, allocatedAt: hoursAgo(20) },
    { id: 7, slotLabel: "Dr. Priya Nair — Thu 09:00", studentName: "Thao Bui", decision: "SKIPPED", policyName: "HYBRID", computedScore: 0.68, randomSeed: 2207, overriddenByName: null, overrideReason: null, allocatedAt: hoursAgo(20) },
    { id: 8, slotLabel: "Dr. Priya Nair — Thu 09:00", studentName: "Khoa Dang", decision: "SKIPPED", policyName: "HYBRID", computedScore: 0.33, randomSeed: 2207, overriddenByName: null, overrideReason: null, allocatedAt: hoursAgo(20) },
    { id: 9, slotLabel: "Prof. Michael Osei — Fri 11:00", studentName: "Minh Nguyen", decision: "OVERRIDDEN", policyName: null, computedScore: null, randomSeed: null, overriddenByName: "Huong Tran", overrideReason: "Deadline conflict — student has a thesis defense during the originally offered slot.", allocatedAt: hoursAgo(30) },
    { id: 10, slotLabel: "Dr. Laura Bianchi — Mon 15:00", studentName: "Linh Pham", decision: "SELECTED", policyName: "NEED", computedScore: 0.72, randomSeed: 9931, overriddenByName: null, overrideReason: null, allocatedAt: hoursAgo(48) },
    { id: 11, slotLabel: "Dr. Laura Bianchi — Mon 15:00", studentName: "Anh Vu", decision: "SKIPPED", policyName: "NEED", computedScore: 0.41, randomSeed: 9931, overriddenByName: null, overrideReason: null, allocatedAt: hoursAgo(48) },
    { id: 12, slotLabel: "Prof. Samuel Okafor — Wed 13:00", studentName: "Huy Tran", decision: "OVERRIDDEN", policyName: null, computedScore: null, randomSeed: null, overriddenByName: "Huong Tran", overrideReason: "Manual reassignment after a data-entry error flagged by the lecturer.", allocatedAt: hoursAgo(60) },
  ];
}

// Stands in for GET /admin/analytics/no-show-rate — derived from
// getMockAllBookings() (Phase 8) rather than hand-authored, so it always
// agrees with whatever booking data exists. Reuses ActivityPoint (below) so
// ActivityChart needs no new props to render it.
export function getMockNoShowRateByLecturer(): ActivityPoint[] {
  const byLecturer = new Map<string, { completed: number; noShow: number }>();
  for (const b of getMockAllBookings()) {
    if (b.status !== "COMPLETED" && b.status !== "NO_SHOW") continue;
    const entry = byLecturer.get(b.lecturerName) ?? { completed: 0, noShow: 0 };
    if (b.status === "NO_SHOW") entry.noShow += 1;
    else entry.completed += 1;
    byLecturer.set(b.lecturerName, entry);
  }

  return Array.from(byLecturer.entries())
    .filter(([, { completed, noShow }]) => completed + noShow > 0)
    .map(([lecturerName, { completed, noShow }]) => ({
      key: lecturerName,
      label: lecturerName.replace(/^(Dr\.|Prof\.)\s*/, ""),
      value: Math.round((noShow / (completed + noShow)) * 100),
    }));
}

// Standard mean-absolute-difference Gini formula (1-indexed, ascending
// input): (2 * sum(i * x_i) - (n+1) * sum(x_i)) / (n * sum(x_i)). Shared by
// getMockEquityMetrics and getMockPolicyComparison so headline numbers are
// always computed, never hand-picked to match a chart.
export function giniCoefficient(values: number[]): number {
  const n = values.length;
  if (n === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const total = sorted.reduce((sum, v) => sum + v, 0);
  if (total === 0) return 0;
  const weightedSum = sorted.reduce((sum, v, i) => sum + (i + 1) * v, 0);
  return (2 * weightedSum) / (n * total) - (n + 1) / n;
}

// Stands in for GET /admin/analytics/equity (Pages.txt #30) — a synthetic,
// deliberately skewed slots-per-student / lecturer-access-per-student
// distribution (most students get few, a handful get many), so the Lorenz
// curve shows real inequality rather than a flat diagonal. Both the Gini
// numbers and the curve derive from the same arrays, so they can't disagree.
export function getMockEquityMetrics(): EquityMetrics {
  const n = 20;

  const slotsPerStudent = Array.from({ length: n }, (_, i) => {
    const rank = i / (n - 1);
    return Math.max(1, Math.round(1 + rank * rank * 11));
  }).sort((a, b) => a - b);

  const lecturerAccessPerStudent = Array.from({ length: n }, (_, i) => {
    const rank = i / (n - 1);
    return Math.max(1, Math.round(1 + rank * rank * 3));
  }).sort((a, b) => a - b);

  const total = slotsPerStudent.reduce((sum, v) => sum + v, 0);
  let cumulativeSlots = 0;
  const lorenzCurve = [{ cumulativeStudentsPct: 0, cumulativeSlotsPct: 0 }];
  slotsPerStudent.forEach((v, i) => {
    cumulativeSlots += v;
    lorenzCurve.push({
      cumulativeStudentsPct: Math.round(((i + 1) / n) * 100),
      cumulativeSlotsPct: Math.round((cumulativeSlots / total) * 100),
    });
  });

  return {
    giniSlotsPerStudent: Math.round(giniCoefficient(slotsPerStudent) * 100) / 100,
    giniLecturerAccess: Math.round(giniCoefficient(lecturerAccessPerStudent) * 100) / 100,
    lorenzCurve,
  };
}

// Canonical demand shape + seed for the Analytics "Policy Comparison" view
// (as opposed to Research Tools, where the admin picks their own demand
// run/seed) — fixed so this section always shows the same numbers across
// visits, matching how a dashboard summary (vs. an experiment console)
// should behave.
const POLICY_COMPARISON_DEMAND: SyntheticDemandRun = {
  id: 0,
  seed: 1337,
  popularitySkew: 1.2,
  arrivalPattern: "POISSON",
  numStudents: 200,
  numLecturers: 15,
  generatedAt: "",
};
const POLICY_COMPARISON_SEED = 1337;

// Stands in for GET /admin/analytics/policy-comparison (Pages.txt #30) — one
// row per getMockAllocationPolicies() entry, now DERIVED from
// simulatePolicy() (the same real allocate()-driven simulation Research
// Tools uses, see computeExperimentResults() below) rather than hand-picked
// constants — so a "fairer" policy here means the real scoring formulas
// actually produced a fairer distribution, not that someone typed a smaller
// number.
export function getMockPolicyComparison(): PolicyComparisonRow[] {
  const allPolicies: AllocationPolicyName[] = ["FCFS", "NEED", "ROUND_ROBIN", "HYBRID"];
  return allPolicies.map((policyName) => {
    const result = simulatePolicy(POLICY_COMPARISON_DEMAND, policyName, seededHash(POLICY_COMPARISON_SEED, policyName));
    return {
      policyName,
      giniSlotsPerStudent: result.giniSlotsPerStudent,
      giniLecturerAccess: result.giniLecturerAccess,
      utilizationPct: result.slotUtilizationPct,
      avgWaitMinutes: Math.round(result.avgWaitTimeSeconds / 60),
    };
  });
}

// ---- Research Tools (Pages.txt #31) -----------------------------------------
// Mirrors capstone-api-endpoints.md §7.1 (POST /research/synthetic-demand,
// POST/GET /research/experiments) — a mock console for the §11.4 fairness
// study, not a real allocation simulation. Deterministic: the same seed
// always produces the same numbers (demonstrates NFR-3 reproducibility),
// derived from getMockPolicyComparison()'s baselines rather than a second,
// disagreeing set of illustrative constants.

export function getMockSyntheticDemandRuns(): SyntheticDemandRun[] {
  return [
    { id: 1, seed: 4821, popularitySkew: 1.4, arrivalPattern: "BURST_BEFORE_DEADLINE", numStudents: 180, numLecturers: 12, generatedAt: "2026-07-28T09:00:00.000Z" },
    { id: 2, seed: 2207, popularitySkew: 0.6, arrivalPattern: "POISSON", numStudents: 320, numLecturers: 18, generatedAt: "2026-08-02T14:30:00.000Z" },
    { id: 3, seed: 9931, popularitySkew: 2.1, arrivalPattern: "UNIFORM", numStudents: 10000, numLecturers: 800, generatedAt: "2026-08-05T11:15:00.000Z" },
  ];
}

// Bounded, deterministic micro-simulation that replays `demandRun`'s
// population through `policyName`'s REAL allocate() logic
// (lib/allocation/engine.ts) across many simulated slot free-up events, then
// computes the four headline metrics from what actually happened — not
// hand-picked constants (that was the old behavior; see git history). Event
// count and population are capped (SIM_* below) regardless of
// demandRun.numStudents/numLecturers so even the 10,000-student/800-lecturer
// seed run (getMockSyntheticDemandRuns()'s 3rd entry) computes client-side
// in well under a frame. This trades population realism for tractability —
// appropriate for a frontend demo standing in for the real server-side
// generator plan.md §11.4 describes, and it's still a genuine agent-based
// simulation (real supply/demand contention, real policy scoring, real
// Gini), not a jittered lookup table.
const SIM_EVENTS = 240;
const SIM_STUDENTS = 60;
const SIM_LECTURERS = 12;
const SIM_DECLINE_CHANCE = 0.12; // modeled offer-decline rate, applied post-selection

function configForSimulation(policyName: AllocationPolicyName): Record<string, number> {
  return getMockAllocationPolicies().find((p) => p.name === policyName)?.config ?? {};
}

function simulatePolicy(demandRun: SyntheticDemandRun, policyName: AllocationPolicyName, seed: number): ExperimentPolicyResult {
  const rand = mulberry32(seed);
  const config = configForSimulation(policyName);
  const now = new Date();

  // Per-student popularity affinity in (0,1], skewed by demandRun.popularitySkew:
  // higher skew -> affinities cluster closer to 1, i.e. demand concentrates on
  // fewer "popular" lecturers/slots — the same shape §11.4 describes as
  // "configurable popularity skew."
  const affinity = Array.from({ length: SIM_STUDENTS }, () => Math.pow(rand(), 1 / Math.max(demandRun.popularitySkew, 0.1)));
  const daysSinceThisLecturer: number[][] = Array.from({ length: SIM_STUDENTS }, () =>
    Array.from({ length: SIM_LECTURERS }, () => Math.round(rand() * 90))
  );
  const daysSinceAnyLecturer = Array.from({ length: SIM_STUDENTS }, () => Math.round(rand() * 90));
  const windowAccessCount = new Array(SIM_STUDENTS).fill(0);

  const slotsWon = new Array(SIM_STUDENTS).fill(0);
  const lecturerAccess: Set<number>[] = Array.from({ length: SIM_STUDENTS }, () => new Set());
  const waitMinutesLog: number[] = [];
  let filledEvents = 0;
  let offeredCount = 0;
  let declinedCount = 0;

  for (let eventIndex = 0; eventIndex < SIM_EVENTS; eventIndex++) {
    const lecturerId = Math.floor(rand() * SIM_LECTURERS);

    // Candidate pool: each student joins with probability proportional to
    // their affinity (popular slots draw bigger pools); low-affinity draws
    // can produce an empty pool, representing a genuinely low-demand slot —
    // that's what keeps slotUtilizationPct meaningfully below 100%.
    const candidates: AllocationCandidate[] = [];
    for (let studentId = 0; studentId < SIM_STUDENTS; studentId++) {
      if (rand() < affinity[studentId] * 0.35) {
        const waitMinutes = Math.round(rand() * 180);
        candidates.push({
          waitlistEntryId: eventIndex * SIM_STUDENTS + studentId,
          studentId,
          requestedAt: new Date(now.getTime() - waitMinutes * 60_000).toISOString(),
          daysSinceLastMeetingThisLecturer: daysSinceThisLecturer[studentId][lecturerId],
          daysSinceLastMeetingAnyLecturer: daysSinceAnyLecturer[studentId],
          recentAccessCount: windowAccessCount[studentId],
        });
      }
    }
    if (candidates.length === 0) continue; // no demand this event — slot goes unfilled

    const result = allocate(candidates, policyName, config, seededHash(seed, eventIndex), now);
    if (!result.winner) continue; // e.g. ROUND_ROBIN: every candidate in the pool was over cap

    offeredCount++;
    const declined = mulberry32(seededHash(seed, `decline-${eventIndex}`))() < SIM_DECLINE_CHANCE;
    if (declined) {
      declinedCount++;
      continue; // simplification: no backup-candidate re-offer within one simulated event
    }

    filledEvents++;
    const winnerId = result.winner.studentId;
    slotsWon[winnerId]++;
    lecturerAccess[winnerId].add(lecturerId);
    windowAccessCount[winnerId]++;
    daysSinceThisLecturer[winnerId][lecturerId] = 0;
    daysSinceAnyLecturer[winnerId] = 0;
    for (let s = 0; s < SIM_STUDENTS; s++) {
      if (s === winnerId) continue;
      daysSinceThisLecturer[s][lecturerId] += 1;
      daysSinceAnyLecturer[s] += 1;
    }
    const winnerCandidate = candidates.find((c) => c.studentId === winnerId);
    if (winnerCandidate) waitMinutesLog.push((now.getTime() - new Date(winnerCandidate.requestedAt).getTime()) / 60_000);

    // Reset the round-robin window periodically so a cap doesn't lock the
    // same students out for the entire 240-event run.
    if ((eventIndex + 1) % 20 === 0) windowAccessCount.fill(0);
  }

  const giniSlotsPerStudent = Math.round(giniCoefficient(slotsWon) * 100) / 100;
  const giniLecturerAccess = Math.round(giniCoefficient(lecturerAccess.map((s) => s.size)) * 100) / 100;
  const nonZero = slotsWon.filter((v) => v > 0);
  const maxMinRatio = nonZero.length > 0 ? Math.round((Math.max(...nonZero) / Math.min(...nonZero)) * 100) / 100 : 1;
  const pctStudentsWithSlot = Math.round((nonZero.length / SIM_STUDENTS) * 1000) / 10;
  const slotUtilizationPct = Math.round((filledEvents / SIM_EVENTS) * 100);
  const avgWaitMinutes = waitMinutesLog.length > 0 ? waitMinutesLog.reduce((a, b) => a + b, 0) / waitMinutesLog.length : 0;
  const avgWaitTimeSeconds = Math.round(avgWaitMinutes * 60);
  const varianceMinutes =
    waitMinutesLog.length > 0
      ? waitMinutesLog.reduce((sum, m) => sum + (m - avgWaitMinutes) ** 2, 0) / waitMinutesLog.length
      : 0;
  const waitTimeVariance = Math.round(varianceMinutes * 3600); // minutes^2 -> seconds^2
  const offerRejectionRatePct = offeredCount > 0 ? Math.round((declinedCount / offeredCount) * 1000) / 10 : 0;
  const avgTimeToFillSeconds = Math.round(avgWaitTimeSeconds * 0.4);

  return {
    policyName,
    giniSlotsPerStudent,
    giniLecturerAccess,
    maxMinRatio,
    pctStudentsWithSlot,
    slotUtilizationPct,
    avgTimeToFillSeconds,
    offerRejectionRatePct,
    avgWaitTimeSeconds,
    waitTimeVariance,
  };
}

// Deterministic, seeded — the same (demandRun, policyNames, seed) triple
// always returns identical results (NFR-3), since every random draw inside
// simulatePolicy() derives from `seed` via seededHash(), never a shared
// mutable PRNG stream shared across policies.
export function computeExperimentResults(
  demandRun: SyntheticDemandRun,
  policyNames: AllocationPolicyName[],
  seed: number
): ExperimentPolicyResult[] {
  return policyNames.map((policyName) => simulatePolicy(demandRun, policyName, seededHash(seed, policyName)));
}

export function getMockExperiments(): Experiment[] {
  const runs = getMockSyntheticDemandRuns();
  const allPolicies: AllocationPolicyName[] = ["FCFS", "NEED", "ROUND_ROBIN", "HYBRID"];
  return [
    {
      id: 1,
      demandRunId: runs[0].id,
      seed: 4821,
      policyNames: allPolicies,
      results: computeExperimentResults(runs[0], allPolicies, 4821),
      runAt: "2026-07-28T09:12:00.000Z",
    },
    {
      id: 2,
      demandRunId: runs[1].id,
      seed: 2207,
      policyNames: ["FCFS", "HYBRID"],
      results: computeExperimentResults(runs[1], ["FCFS", "HYBRID"], 2207),
      runAt: "2026-08-02T14:41:00.000Z",
    },
  ];
}
