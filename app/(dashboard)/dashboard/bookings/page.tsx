"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth/auth-context";
import {
  getMockAllBookings,
  getMockLecturerBookings,
  getMockStudentBookings,
} from "@/lib/office-hours/mock-data";
import type { Booking, BookingStatus } from "@/lib/office-hours/types";
import { BOOKING_STATUS_CONFIG } from "@/lib/ui/status-hues";
import { BookingsTable } from "@/components/dashboard/BookingsTable";
import { FilterTabs } from "@/components/dashboard/FilterTabs";

type StatusFilter = "ALL" | BookingStatus;

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "ALL", label: "All" },
  ...(Object.keys(BOOKING_STATUS_CONFIG) as BookingStatus[]).map((status) => ({
    value: status,
    label: BOOKING_STATUS_CONFIG[status].label,
  })),
];

function dataForRole(role: "STUDENT" | "LECTURER" | "ADMIN"): {
  bookings: Booking[];
  perspective: "student" | "lecturer" | "admin";
  heading: string;
} {
  switch (role) {
    case "STUDENT":
      return { bookings: getMockStudentBookings(), perspective: "student", heading: "My Bookings" };
    case "LECTURER":
      return { bookings: getMockLecturerBookings(), perspective: "lecturer", heading: "Bookings to Review" };
    case "ADMIN":
      return { bookings: getMockAllBookings(), perspective: "admin", heading: "All Bookings" };
  }
}

export default function BookingsPage() {
  const { user } = useAuth();
  // Lecturers land on a to-review-oriented view by default — this is a plain
  // useState initializer (evaluated once per mount), not an effect syncing
  // from a prop, so it doesn't trip react-hooks/set-state-in-effect.
  const [filter, setFilter] = useState<StatusFilter>(() => (user?.role === "LECTURER" ? "PENDING" : "ALL"));

  if (!user) return null;

  const { bookings, perspective, heading } = dataForRole(user.role);
  const filtered = filter === "ALL" ? bookings : bookings.filter((b) => b.status === filter);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-2xl font-bold text-[var(--ink-900)]">{heading}</h1>
        <div className="flex items-center gap-4">
          {user.role === "STUDENT" && (
            <Link
              href="/dashboard/bookings/recurring"
              className="text-sm font-semibold text-[var(--brand-500)] no-underline hover:underline whitespace-nowrap"
            >
              Set up recurring
            </Link>
          )}
          <FilterTabs options={STATUS_OPTIONS} value={filter} onChange={setFilter} />
        </div>
      </div>

      <BookingsTable
        bookings={filtered}
        perspective={perspective}
        getRowHref={(b) => `/dashboard/bookings/${b.id}`}
      />
    </div>
  );
}
