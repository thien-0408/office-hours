"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Radio } from "lucide-react";
import { Card } from "@/components/dashboard/Card";
import { FilterTabs } from "@/components/dashboard/FilterTabs";
import { NotificationItem } from "@/components/dashboard/NotificationItem";
import { getMockNotifications } from "@/lib/office-hours/mock-data";

type Filter = "ALL" | "UNREAD";

export default function NotificationsPage() {
  const router = useRouter();
  // Page owns a mutable copy so "mark read" can update it — seeded once via
  // the useState initializer, no effect involved.
  const [notifications, setNotifications] = useState(() => getMockNotifications());
  const [filter, setFilter] = useState<Filter>("ALL");

  const unreadCount = notifications.filter((n) => !n.read).length;
  const filtered = filter === "UNREAD" ? notifications.filter((n) => !n.read) : notifications;

  function markRead(id: number) {
    setNotifications((list) => list.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }

  function markAllRead() {
    setNotifications((list) => list.map((n) => ({ ...n, read: true })));
  }

  return (
    <div className="flex flex-col gap-5 max-w-2xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-2xl font-bold text-[var(--ink-900)]">Notifications</h1>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={markAllRead}
            className="text-sm font-semibold text-[var(--brand-500)] hover:underline w-fit"
          >
            Mark all read
          </button>
        )}
      </div>

      <div className="flex items-center justify-between gap-3">
        <FilterTabs
          options={[
            { value: "ALL", label: "All" },
            { value: "UNREAD", label: `Unread${unreadCount > 0 ? ` (${unreadCount})` : ""}` },
          ]}
          value={filter}
          onChange={setFilter}
        />
        {/* Real-time delivery is backend-dependent (GET /notifications/stream,
            SSE) — not wired up yet since there's no backend to connect to.
            This is a static affordance, not a live connection. */}
        <span
          className="inline-flex items-center gap-1.5 text-[12px] text-[var(--ink-400)]"
          title="Live updates connect once the backend ships SSE support"
        >
          <Radio className="w-3.5 h-3.5" strokeWidth={2} />
          Live updates soon
        </span>
      </div>

      <Card className="p-0 overflow-hidden">
        {filtered.length === 0 ? (
          <p className="text-sm text-[var(--ink-500)] text-center py-8">Nothing here.</p>
        ) : (
          filtered.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onClick={() => {
                markRead(notification.id);
                if (notification.bookingId) router.push(`/dashboard/bookings/${notification.bookingId}`);
                else if (notification.type === "WAITLIST_OFFERED") router.push("/dashboard/waitlist");
              }}
            />
          ))
        )}
      </Card>
    </div>
  );
}
