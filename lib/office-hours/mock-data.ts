import type {
  BookableSlot,
  Booking,
  BookingTimelineEvent,
  Notification,
  NotificationPrefs,
  PublicOfficeHoursResponse,
  PublicSlot,
  RecurringSeries,
  WaitlistEntry,
} from "./types";

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
    photoUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=160&h=160&fit=crop&q=80",
    blurb: "Thesis proposals, capstone scope, algorithms coursework.",
  },
  {
    id: 2,
    slug: "daniel-reyes",
    name: "Prof. Daniel Reyes",
    department: "Computer Science",
    photoUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=160&h=160&fit=crop&q=80",
    blurb: "Algorithms homework help, systems design questions.",
  },
  {
    id: 3,
    slug: "priya-nair",
    name: "Dr. Priya Nair",
    department: "Mathematics",
    photoUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=160&h=160&fit=crop&q=80",
    blurb: "Linear algebra, discrete math, exam review sessions.",
  },
  {
    id: 4,
    slug: "michael-osei",
    name: "Prof. Michael Osei",
    department: "Physics",
    photoUrl: "https://images.unsplash.com/photo-1607990281513-2c110a25bd8c?w=160&h=160&fit=crop&q=80",
    blurb: "Lab report feedback, mechanics and thermodynamics.",
  },
  {
    id: 5,
    slug: "laura-bianchi",
    name: "Dr. Laura Bianchi",
    department: "Economics",
    photoUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=160&h=160&fit=crop&q=80",
    blurb: "Midterm regrades, macro/micro theory questions.",
  },
  {
    id: 6,
    slug: "samuel-okafor",
    name: "Prof. Samuel Okafor",
    department: "Mathematics",
    photoUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=160&h=160&fit=crop&q=80",
    blurb: "Statistics, probability, and proof-writing help.",
  },
];

// Stands in for GET /lecturers — the authenticated "browse" list, filterable
// by department and free-text (matched against name + department).
export function getMockLecturers(params?: { department?: string; q?: string }): MockLecturer[] {
  const department = params?.department?.trim().toLowerCase();
  const q = params?.q?.trim().toLowerCase();

  return MOCK_LECTURERS.filter((lecturer) => {
    if (department && lecturer.department.toLowerCase() !== department) return false;
    if (q && !`${lecturer.name} ${lecturer.department}`.toLowerCase().includes(q)) return false;
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
