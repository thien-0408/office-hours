"use client";

import { useState } from "react";
import { Scale } from "lucide-react";
import { CalendarDots, CheckCircle, ClockCountdown, HourglassMedium, TrendUp, UsersThree, WarningCircle } from "@phosphor-icons/react";
import { useAuth } from "@/lib/auth/auth-context";
import {
  getMockAdminOverview,
  getMockAdvisorLoad,
  getMockLecturerBookings,
  getMockLecturerSlotsToday,
  getMockWaitlistEntries,
  getMockStudentBookings,
  getMockWeeklyActivity,
} from "@/lib/office-hours/mock-data";
import { ACCENT_TOKENS } from "@/lib/ui/accent-palette";
import { HUE_TOKENS } from "@/lib/ui/status-hues";
import { ActivityChart } from "@/components/dashboard/ActivityChart";
import { BookingsTable } from "@/components/dashboard/BookingsTable";
import { DashboardColumns } from "@/components/dashboard/DashboardColumns";
import { FeaturedActionCard } from "@/components/dashboard/FeaturedActionCard";
import { MiniCalendar } from "@/components/dashboard/MiniCalendar";
import { NextUpCard } from "@/components/dashboard/NextUpCard";
import { ProfileCard } from "@/components/dashboard/ProfileCard";
import { SectionHeader } from "@/components/dashboard/SectionHeader";
import { RescheduleModal } from "@/components/dashboard/RescheduleModal";
import { SlotsTodayList } from "@/components/dashboard/SlotsTodayList";
import { StaggerGroup, StaggerItem } from "@/components/dashboard/StaggerGroup";
import { StatTile } from "@/components/dashboard/StatTile";
import { TaskList, type Task } from "@/components/dashboard/TaskList";
import { UpcomingList } from "@/components/dashboard/UpcomingList";
import type { AuthUser } from "@/lib/auth/types";
import type { Booking } from "@/lib/office-hours/types";
import { useI18n } from "@/i18n/provider";

function greeting(t: (key: import("@/i18n").MessageKey) => string): string {
  const hour = new Date().getHours();
  if (hour < 12) return t("dashboard.morning");
  if (hour < 18) return t("dashboard.afternoon");
  return t("dashboard.evening");
}

function isToday(iso: string): boolean {
  return new Date(iso).toDateString() === new Date().toDateString();
}

function subtitleFor(role: AuthUser["role"], t: (key: import("@/i18n").MessageKey) => string): string {
  switch (role) {
    case "STUDENT":
      return t("dashboard.studentSubtitle");
    case "LECTURER":
      return t("dashboard.lecturerSubtitle");
    case "ADMIN":
      return t("dashboard.adminSubtitle");
  }
}

function roleLabelFor(role: AuthUser["role"], t: (key: import("@/i18n").MessageKey) => string): string {
  switch (role) {
    case "STUDENT":
      return t("dashboard.studentWorkspace");
    case "LECTURER":
      return t("dashboard.lecturerWorkspace");
    case "ADMIN":
      return t("dashboard.adminWorkspace");
  }
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { t } = useI18n();
  if (!user) return null; // (dashboard)/layout.tsx redirects before this ever renders unauthenticated

  const firstName = user.fullName.split(" ")[0];

  return (
    <div className="flex flex-col gap-7">
      <header className="flex flex-col gap-3 border-b border-[var(--paper-200)] pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--ink-400)]">
              {t("dashboard.overview")}
            </span>
            <span className="h-1 w-1 rounded-full bg-[var(--paper-300)]" />
            <span className="text-[11px] font-medium text-[var(--ink-500)]">
              {roleLabelFor(user.role, t)}
            </span>
          </div>

          <h1 className="text-2xl font-semibold tracking-[-0.02em] text-[var(--ink-900)] sm:text-[28px]">
            {greeting(t)}, {firstName}
          </h1>
          <p className="mt-1.5 text-sm leading-6 text-[var(--ink-500)]">{subtitleFor(user.role, t)}</p>
        </div>

        <div className="hidden items-center gap-2 text-[11px] font-medium text-[var(--ink-400)] sm:flex">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--mint-500)]" />
          {t("dashboard.upToDate")}
        </div>
      </header>

      {user.role === "STUDENT" && <StudentDashboard user={user} />}
      {user.role === "LECTURER" && <LecturerDashboard user={user} />}
      {user.role === "ADMIN" && <AdminDashboard user={user} />}
    </div>
  );
}

function StudentDashboard({ user }: { user: AuthUser }) {
  const { t } = useI18n();
  const [bookings, setBookings] = useState<Booking[]>(() => getMockStudentBookings());
  const [filterDay, setFilterDay] = useState<Date | null>(null);
  const [rescheduling, setRescheduling] = useState<Booking | null>(null);

  const upcoming = bookings
    .filter((b) => b.status === "PENDING" || b.status === "CONFIRMED")
    .sort((a, b) => a.startAt.localeCompare(b.startAt));
  const [nextUp, ...later] = upcoming;
  const pendingCount = bookings.filter((b) => b.status === "PENDING").length;
  const completedCount = bookings.filter((b) => b.status === "COMPLETED").length;
  const waitlistCount = getMockWaitlistEntries().filter((w) => w.status === "WAITING" || w.status === "OFFERED").length;
  const weeklyActivity = getMockWeeklyActivity();

  function handleReschedule(input: { newSlotId: number; startAt: string; endAt: string }) {
    if (!rescheduling) return;
    const id = rescheduling.id;
    setBookings((prev) =>
      prev.map((b) => (b.id === id ? { ...b, slotId: input.newSlotId, startAt: input.startAt, endAt: input.endAt, status: "PENDING" } : b)),
    );
    setRescheduling(null);
  }

  return (
    <DashboardColumns
      rail={
        <StaggerGroup className="flex flex-col gap-5">
          <StaggerItem>
            <ProfileCard user={user} />
          </StaggerItem>
          <StaggerItem>
            <MiniCalendar
              markedDates={upcoming.map((b) => new Date(b.startAt))}
              selected={filterDay}
              onSelect={setFilterDay}
            />
          </StaggerItem>
          <StaggerItem>
            <SectionHeader title={filterDay ? t("dashboard.upcoming") : t("dashboard.moreComingUp")} />
            <UpcomingList
              bookings={filterDay ? upcoming : later}
              filterDay={filterDay}
              onClearFilter={() => setFilterDay(null)}
            />
          </StaggerItem>
          <StaggerItem>
            <SectionHeader title={t("dashboard.toDo")} />
            <TaskList />
          </StaggerItem>
        </StaggerGroup>
      }
    >
      <StaggerGroup className="flex flex-col gap-5">
        <StaggerItem>
          <NextUpCard booking={nextUp ?? null} onReschedule={setRescheduling} />
        </StaggerItem>

        <StaggerItem className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatTile icon={CalendarDots} tone={ACCENT_TOKENS.rose} value={upcoming.length} label={t("dashboard.upcomingBookings")} />
          <StatTile icon={ClockCountdown} tone={HUE_TOKENS.warning} value={pendingCount} label={t("dashboard.pendingConfirmation")} />
          <StatTile icon={HourglassMedium} tone={HUE_TOKENS.info} value={waitlistCount} label={t("dashboard.waitlistStat")} />
          <StatTile icon={CheckCircle} tone={HUE_TOKENS.brand} value={completedCount} label={t("dashboard.completedStat")} />
        </StaggerItem>

        <StaggerItem>
          <ActivityChart
            title={t("dashboard.bookingActivity")}
            data={weeklyActivity}
            accent="rose"
            variant="weeklyOverview"
            valueLabel={t("chart.bookings")}
            formatValue={(value) => `${value} ${t(value === 1 ? "chart.booking" : "chart.bookings")}`}
          />
        </StaggerItem>

        <StaggerItem>
          <SectionHeader title={t("dashboard.yourBookings")} href="/dashboard/bookings" />
          <BookingsTable bookings={bookings} perspective="student" />
        </StaggerItem>
      </StaggerGroup>

      <RescheduleModal
        open={rescheduling !== null}
        booking={rescheduling}
        onClose={() => setRescheduling(null)}
        onConfirm={handleReschedule}
      />
    </DashboardColumns>
  );
}

const LECTURER_TASKS: Task[] = [
  { id: "1", label: "Review 2 pending booking requests", done: false },
  { id: "2", label: "Add an availability exception for Friday", done: false },
  { id: "3", label: "Mark yesterday's 2pm session complete", done: true },
];

function LecturerDashboard({ user }: { user: AuthUser }) {
  const bookings = getMockLecturerBookings();
  const toReview = bookings.filter((b) => b.status === "PENDING");
  const confirmedToday = bookings.filter((b) => b.status === "CONFIRMED" && isToday(b.startAt)).length;
  const closedCount = bookings.filter((b) => b.status === "COMPLETED" || b.status === "NO_SHOW").length;
  const noShowCount = bookings.filter((b) => b.status === "NO_SHOW").length;
  const noShowRate = closedCount === 0 ? 0 : Math.round((noShowCount / closedCount) * 100);
  const slotsToday = getMockLecturerSlotsToday("Dr. Amara Chen");

  return (
    <DashboardColumns
      rail={
        <StaggerGroup className="flex flex-col gap-5">
          <StaggerItem>
            <ProfileCard user={user} />
          </StaggerItem>
          <StaggerItem>
            <MiniCalendar />
          </StaggerItem>
          <StaggerItem>
            <SectionHeader title="Today's open slots" />
            <SlotsTodayList slots={slotsToday} />
          </StaggerItem>
          <StaggerItem>
            <SectionHeader title="To do" />
            <TaskList tasks={LECTURER_TASKS} />
          </StaggerItem>
        </StaggerGroup>
      }
    >
      <StaggerGroup className="flex flex-col gap-5">
        <StaggerItem className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <StatTile icon={ClockCountdown} tone={HUE_TOKENS.warning} value={toReview.length} label="Bookings to review" />
          <StatTile icon={CalendarDots} tone={HUE_TOKENS.success} value={confirmedToday} label="Confirmed today" />
          <StatTile icon={WarningCircle} tone={HUE_TOKENS.danger} value={`${noShowRate}%`} label="No-show rate" />
        </StaggerItem>

        <StaggerItem>
          <FeaturedActionCard
            icon={ClockCountdown}
            title="Bookings to review"
            description={`${toReview.length} student${toReview.length === 1 ? "" : "s"} waiting on a confirm or decline.`}
            href="/dashboard/bookings"
            actionLabel="Review requests"
          />
        </StaggerItem>

        <StaggerItem>
          <SectionHeader title="Bookings to review" href="/dashboard/bookings" />
          <BookingsTable bookings={toReview} perspective="lecturer" />
        </StaggerItem>
      </StaggerGroup>
    </DashboardColumns>
  );
}

const ADMIN_TASKS: Task[] = [
  { id: "1", label: "Review 3 flagged allocation overrides", done: false },
  { id: "2", label: "Import the Fall semester schedule CSV", done: false },
  { id: "3", label: "Activate Spring 2027 semester", done: true },
];

function AdminDashboard({ user }: { user: AuthUser }) {
  const stats = getMockAdminOverview();
  const recentBookings = getMockLecturerBookings();
  const advisorLoad = getMockAdvisorLoad();

  return (
    <DashboardColumns
      rail={
        <StaggerGroup className="flex flex-col gap-5">
          <StaggerItem>
            <ProfileCard user={user} />
          </StaggerItem>
          <StaggerItem>
            <MiniCalendar />
          </StaggerItem>
          <StaggerItem>
            <SectionHeader title="To do" />
            <TaskList tasks={ADMIN_TASKS} />
          </StaggerItem>
        </StaggerGroup>
      }
    >
      <StaggerGroup className="flex flex-col gap-5">
        <StaggerItem className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <StatTile icon={UsersThree} tone={ACCENT_TOKENS.coral} value={stats.activeUsers} label="Active users" />
          <StatTile icon={CalendarDots} tone={ACCENT_TOKENS.rose} value={stats.bookingsThisWeek} label="Bookings this week" />
          <StatTile icon={TrendUp} tone={ACCENT_TOKENS.mint} value={`${stats.utilizationPct}%`} label="Slot utilization" />
        </StaggerItem>

        <StaggerItem>
          <FeaturedActionCard
            icon={Scale}
            title="Equity & allocation analytics"
            description="Compare fairness across allocation policies once the research pipeline is live."
            href="/dashboard/admin/analytics"
            actionLabel="View analytics"
          />
        </StaggerItem>

        <StaggerItem>
          <ActivityChart title="Advisor load this week" data={advisorLoad} accent="coral" />
        </StaggerItem>

        <StaggerItem>
          <SectionHeader title="Recent bookings across lecturers" />
          <BookingsTable bookings={recentBookings} perspective="admin" />
        </StaggerItem>
      </StaggerGroup>
    </DashboardColumns>
  );
}
