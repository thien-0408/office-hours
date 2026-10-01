"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { StatusBadge } from "@/components/StatusBadge";
import type { Booking } from "@/lib/office-hours/types";
import { Card } from "./Card";
import { useI18n } from "@/i18n/provider";
import { formatDate, formatTime } from "@/i18n/formatters";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SortButton } from "./SortButton";
import { Checkbox } from "@/components/ui/checkbox";

type Perspective = "student" | "lecturer" | "admin";
type SortKey = "name" | "startAt" | "status";

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
  const { locale, t } = useI18n();
  const [sortKey, setSortKey] = useState<SortKey>("startAt");
  const [ascending, setAscending] = useState(true);

  const primaryField = perspective === "lecturer" ? "studentName" : "lecturerName";
  const nameColumnLabel = perspective === "admin" ? `${t("nav.roleLecturer")} / ${t("nav.roleStudent")}` : perspective === "lecturer" ? t("nav.roleStudent") : t("nav.roleLecturer");

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
        <p className="text-sm text-[var(--ink-500)]">{t("booking.noBookings")}</p>
      </Card>
    );
  }

  const selectableIds = sorted.filter((b) => !isSelectable || isSelectable(b)).map((b) => b.id);
  const allSelected = selectableIds.length > 0 && selectableIds.every((id) => selectedIds?.has(id));

  return (
    <Card className="p-0 overflow-hidden overflow-x-auto">
      <Table className="w-full text-sm">
        <TableHeader>
          <TableRow className="border-b border-[var(--paper-200)]">
            {onToggleSelectAll && (
              <TableHead className="px-5 py-3 w-10">
                <Checkbox checked={allSelected} onCheckedChange={() => onToggleSelectAll(allSelected ? [] : selectableIds)} />
              </TableHead>
            )}
            <TableHead className="text-left px-5 py-3">
              <SortButton label={nameColumnLabel} active={sortKey === "name"} onClick={() => handleSort("name")} />
            </TableHead>
            <TableHead className="text-left px-5 py-3 hidden sm:table-cell">{t("booking.topic")}</TableHead>
            <TableHead className="text-left px-5 py-3">
              <SortButton label={t("booking.dateTime")} active={sortKey === "startAt"} onClick={() => handleSort("startAt")} />
            </TableHead>
            <TableHead className="text-left px-5 py-3">
              <SortButton label={t("booking.statusLabel")} active={sortKey === "status"} onClick={() => handleSort("status")} />
            </TableHead>
            {onCancelBooking && <TableHead className="px-5 py-3" />}
          </TableRow>
        </TableHeader>
        <TableBody>
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
            <TableRow
              key={booking.id}
              className="border-b border-[var(--paper-100)] last:border-0 hover:bg-[var(--paper-50)] transition-colors"
            >
              {onToggleSelectAll && (
                <TableCell className="px-5 py-3.5">
                  {(!isSelectable || isSelectable(booking)) && (
                    <Checkbox checked={selectedIds?.has(booking.id) ?? false} onCheckedChange={() => onToggleSelect?.(booking.id)} />
                  )}
                </TableCell>
              )}
              <TableCell className="px-5 py-3.5">
                {getRowHref ? (
                  <Link href={getRowHref(booking)} className="block no-underline hover:no-underline">
                    {nameCell}
                  </Link>
                ) : (
                  nameCell
                )}
              </TableCell>
              <TableCell className="px-5 py-3.5 text-[var(--ink-600)] hidden sm:table-cell truncate max-w-[220px]">
                {booking.topic ?? "—"}
              </TableCell>
              <TableCell className="px-5 py-3.5 tabular-nums text-[var(--ink-700)] whitespace-nowrap">
                {formatDate(new Date(booking.startAt), locale, { month: "short", day: "numeric" })} ·{" "}
                {formatTime(new Date(booking.startAt), locale)}
              </TableCell>
              <TableCell className="px-5 py-3.5">
                <StatusBadge status={booking.status} />
              </TableCell>
              {onCancelBooking && (
                <TableCell className="px-5 py-3.5 text-right">
                  {(!isCancellable || isCancellable(booking)) && (
                    <Button variant="link-danger"
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onCancelBooking(booking);
                      }}
                    >
                      {t("booking.cancel")}
                    </Button>
                  )}
                </TableCell>
              )}
            </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Card>
  );
}
