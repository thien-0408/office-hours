"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpDown } from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import type { Booking } from "@/lib/office-hours/types";
import { Card } from "./Card";

type Perspective = "student" | "lecturer" | "admin";
type SortKey = "name" | "startAt" | "status";

const dateFormatter = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" });
const timeFormatter = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" });

function SortButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide transition-colors ${
        active ? "text-[var(--brand-700)]" : "text-[var(--ink-500)] hover:text-[var(--brand-700)]"
      }`}
    >
      {label}
      <ArrowUpDown className="w-3 h-3" strokeWidth={2} />
    </button>
  );
}

// `perspective` picks which side of the booking is the "who" column: a student
// wants to see the lecturer, a lecturer wants to see the student, an admin
// (cross-lecturer view) wants both. See the comment on Booking in types.ts.
export function BookingsTable({
  bookings,
  perspective = "student",
  getRowHref,
  isCancellable,
  onCancelBooking,
  isSelectable,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
}: {
  bookings: Booking[];
  perspective?: Perspective;
  getRowHref?: (booking: Booking) => string;
  isCancellable?: (booking: Booking) => boolean;
  onCancelBooking?: (booking: Booking) => void;
  isSelectable?: (booking: Booking) => boolean;
  selectedIds?: Set<number>;
  onToggleSelect?: (id: number) => void;
  onToggleSelectAll?: (ids: number[]) => void;
}) {
  const [sortKey, setSortKey] = useState<SortKey>("startAt");
  const [ascending, setAscending] = useState(true);

  const primaryField = perspective === "lecturer" ? "studentName" : "lecturerName";
  const nameColumnLabel = perspective === "admin" ? "Lecturer / Student" : perspective === "lecturer" ? "Student" : "Lecturer";

  const sorted = useMemo(() => {
    const copy = [...bookings];
    copy.sort((a, b) => {
      let cmp: number;
      if (sortKey === "name") {
        cmp = a[primaryField].localeCompare(b[primaryField]);
      } else if (sortKey === "startAt") {
        cmp = a.startAt.localeCompare(b.startAt);
      } else {
        cmp = a.status.localeCompare(b.status);
      }
      return ascending ? cmp : -cmp;
    });
    return copy;
  }, [bookings, sortKey, ascending, primaryField]);

  function handleSort(key: SortKey) {
    if (key === sortKey) {
      setAscending((v) => !v);
    } else {
      setSortKey(key);
      setAscending(true);
    }
  }

  if (bookings.length === 0) {
    return (
      <Card className="text-center py-8">
        <p className="text-sm text-[var(--ink-500)]">No bookings yet.</p>
      </Card>
    );
  }

  const selectableIds = sorted.filter((b) => !isSelectable || isSelectable(b)).map((b) => b.id);
  const allSelected = selectableIds.length > 0 && selectableIds.every((id) => selectedIds?.has(id));

  return (
    <Card className="p-0 overflow-hidden overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[var(--paper-200)]">
            {onToggleSelectAll && (
              <th className="px-5 py-3 w-10">
                <input
                  type="checkbox"
                  aria-label="Select all"
                  checked={allSelected}
                  onChange={() => onToggleSelectAll(allSelected ? [] : selectableIds)}
                  className="w-4 h-4 accent-[var(--brand-500)]"
                />
              </th>
            )}
            <th className="text-left px-5 py-3">
              <SortButton label={nameColumnLabel} active={sortKey === "name"} onClick={() => handleSort("name")} />
            </th>
            <th className="text-left px-5 py-3 hidden sm:table-cell">Topic</th>
            <th className="text-left px-5 py-3">
              <SortButton label="Date & time" active={sortKey === "startAt"} onClick={() => handleSort("startAt")} />
            </th>
            <th className="text-left px-5 py-3">
              <SortButton label="Status" active={sortKey === "status"} onClick={() => handleSort("status")} />
            </th>
            {onCancelBooking && <th className="px-5 py-3" />}
          </tr>
        </thead>
        <tbody>
          {sorted.map((booking) => {
            const nameCell =
              perspective === "admin" ? (
                <>
                  <p className="font-semibold text-[var(--ink-900)]">{booking.lecturerName}</p>
                  <p className="text-[12px] text-[var(--ink-500)]">with {booking.studentName}</p>
                </>
              ) : (
                <>
                  <p className="font-semibold text-[var(--ink-900)]">{booking[primaryField]}</p>
                  <p className="text-[12px] text-[var(--ink-500)]">{booking.department}</p>
                </>
              );

            return (
            <tr
              key={booking.id}
              className="border-b border-[var(--paper-100)] last:border-0 hover:bg-[var(--paper-50)] transition-colors"
            >
              {onToggleSelectAll && (
                <td className="px-5 py-3.5">
                  {(!isSelectable || isSelectable(booking)) && (
                    <input
                      type="checkbox"
                      aria-label={`Select booking with ${booking[primaryField]}`}
                      checked={selectedIds?.has(booking.id) ?? false}
                      onChange={() => onToggleSelect?.(booking.id)}
                      className="w-4 h-4 accent-[var(--brand-500)]"
                    />
                  )}
                </td>
              )}
              <td className="px-5 py-3.5">
                {getRowHref ? (
                  <Link href={getRowHref(booking)} className="block no-underline hover:no-underline">
                    {nameCell}
                  </Link>
                ) : (
                  nameCell
                )}
              </td>
              <td className="px-5 py-3.5 text-[var(--ink-600)] hidden sm:table-cell truncate max-w-[220px]">
                {booking.topic ?? "—"}
              </td>
              <td className="px-5 py-3.5 tabular-nums text-[var(--ink-700)] whitespace-nowrap">
                {dateFormatter.format(new Date(booking.startAt))} ·{" "}
                {timeFormatter.format(new Date(booking.startAt))}
              </td>
              <td className="px-5 py-3.5">
                <StatusBadge status={booking.status} />
              </td>
              {onCancelBooking && (
                <td className="px-5 py-3.5 text-right">
                  {(!isCancellable || isCancellable(booking)) && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onCancelBooking(booking);
                      }}
                      className="text-[13px] font-bold text-[var(--danger-700)] hover:underline"
                    >
                      Cancel
                    </button>
                  )}
                </td>
              )}
            </tr>
            );
          })}
        </tbody>
      </table>
    </Card>
  );
}
