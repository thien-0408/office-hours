import type { PublicOfficeHoursResponse, PublicSlot } from "./types";

// Stands in for GET /public/office-hours until the backend ships that endpoint
// (see docs/capstone-api-endpoints.md §10) — app/public/office-hours/page.tsx
// falls back to this whenever the real API call fails. `photoUrl` is a
// mock-only field (Unsplash portraits) — the real contract carries no lecturer
// PII beyond name/department, so it never appears in PublicSlot itself.
export interface MockPublicSlot extends PublicSlot {
  photoUrl: string;
}

export interface MockOfficeHoursResponse extends Omit<PublicOfficeHoursResponse, "content"> {
  content: MockPublicSlot[];
}

const MOCK_LECTURERS: { name: string; department: string; photoUrl: string }[] = [
  {
    name: "Dr. Amara Chen",
    department: "Computer Science",
    photoUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=160&h=160&fit=crop&q=80",
  },
  {
    name: "Prof. Daniel Reyes",
    department: "Computer Science",
    photoUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=160&h=160&fit=crop&q=80",
  },
  {
    name: "Dr. Priya Nair",
    department: "Mathematics",
    photoUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=160&h=160&fit=crop&q=80",
  },
  {
    name: "Prof. Michael Osei",
    department: "Physics",
    photoUrl: "https://images.unsplash.com/photo-1607990281513-2c110a25bd8c?w=160&h=160&fit=crop&q=80",
  },
  {
    name: "Dr. Laura Bianchi",
    department: "Economics",
    photoUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=160&h=160&fit=crop&q=80",
  },
  {
    name: "Prof. Samuel Okafor",
    department: "Mathematics",
    photoUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=160&h=160&fit=crop&q=80",
  },
];

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
