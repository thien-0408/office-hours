"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Calendar,
  CheckCircle2,
  ChevronRight,
  Sparkles,
  UserCheck,
} from "lucide-react";
import { Card } from "@/components/dashboard/Card";
import { BookSlotModal } from "@/components/dashboard/BookSlotModal";
import type { BookableSlot } from "@/lib/office-hours/types";
import type { SuggestedSlot } from "@/lib/office-hours/mock-data";

type FilterCategory = "ALL" | "CS" | "MATH" | "SOON";

export function SuggestedSlotsCard({
  slots,
  onBookSuccess,
}: {
  slots: SuggestedSlot[];
  onBookSuccess?: (slot: SuggestedSlot, topic: string) => void;
}) {
  const [filter, setFilter] = useState<FilterCategory>("ALL");
  const [bookingSlot, setBookingSlot] = useState<SuggestedSlot | null>(null);

  const filteredSlots = useMemo(() => {
    return slots.filter((s) => {
      if (filter === "CS") return s.department.toLowerCase().includes("computer");
      if (filter === "MATH")
        return (
          s.department.toLowerCase().includes("math") ||
          s.department.toLowerCase().includes("physic") ||
          s.department.toLowerCase().includes("econ")
        );
      if (filter === "SOON") return s.dayLabel === "Today" || s.dayLabel === "Tomorrow";
      return true;
    });
  }, [slots, filter]);

  // Convert SuggestedSlot to BookableSlot format for BookSlotModal
  const activeBookableSlot: BookableSlot | null = useMemo(() => {
    if (!bookingSlot) return null;
    return {
      id: bookingSlot.id,
      lecturerId: bookingSlot.lecturerId,
      startAt: bookingSlot.startAt,
      endAt: bookingSlot.endAt,
      available: true,
      conflict: false,
    };
  }, [bookingSlot]);

  function handleQuickBookConfirm(topic: string) {
    if (!bookingSlot) return;
    onBookSuccess?.(bookingSlot, topic);
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Header and filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-[var(--ink-900)]">
              Suggested for You
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-[var(--brand-50)] text-[var(--brand-700)] border border-[var(--brand-200)] flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-[var(--brand-500)]" /> Conflict-Free
            </span>
          </div>
          <p className="text-xs text-[var(--ink-500)] mt-0.5">
            Verified open slots that never clash with your 07:30 AM class schedule.
          </p>
        </div>

        <Link
          href="/dashboard/lecturers"
          className="text-xs font-bold text-[var(--brand-600)] hover:text-[var(--brand-700)] flex items-center gap-1 group self-start sm:self-auto"
        >
          Browse all lecturers
          <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {[
          { id: "ALL" as FilterCategory, label: "All Recommendations" },
          { id: "CS" as FilterCategory, label: "Computer Science" },
          { id: "MATH" as FilterCategory, label: "Math & Physics" },
          { id: "SOON" as FilterCategory, label: "Available Soon (Next 48h)" },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setFilter(tab.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
              filter === tab.id
                ? "bg-[var(--brand-500)] text-white shadow-xs"
                : "bg-[var(--paper-100)] text-[var(--ink-600)] hover:bg-[var(--paper-200)]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Slots Cards Grid */}
      {filteredSlots.length === 0 ? (
        <Card className="py-8 text-center bg-[var(--paper-50)]/50">
          <p className="text-xs text-[var(--ink-500)]">
            No suggested slots found for this filter. Try viewing all recommendations.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredSlots.slice(0, 6).map((slot) => (
            <Card
              key={`${slot.id}-${slot.startAt}`}
              className="p-4 flex flex-col justify-between gap-3 border hover:border-[var(--brand-300)] hover:shadow-md transition-all group"
            >
              <div>
                {/* Top Row: Avatar & Lecturer Info */}
                <div className="flex items-start gap-3 mb-2.5">
                  <Image
                    src={slot.photoUrl}
                    alt={slot.lecturerName}
                    width={40}
                    height={40}
                    className="w-10 h-10 rounded-full bg-[var(--brand-100)] object-cover shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-[13.5px] font-bold text-[var(--ink-900)] truncate group-hover:text-[var(--brand-700)] transition-colors">
                      {slot.lecturerName}
                    </p>
                    <p className="text-[11.5px] text-[var(--ink-500)] truncate">
                      {slot.department}
                    </p>
                  </div>
                </div>

                {/* Specialty Pill */}
                <div className="mb-3">
                  <span className="inline-block px-2 py-0.5 rounded-md text-[11px] font-semibold bg-[var(--paper-100)] text-[var(--ink-700)] truncate max-w-full">
                    {slot.specialtyTag}
                  </span>
                </div>

                {/* Time & Conflict Info */}
                <div className="flex flex-col gap-1.5 p-2.5 rounded-xl bg-[var(--paper-50)] border border-[var(--paper-200)] text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[var(--brand-700)] flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      {slot.dayLabel}
                    </span>
                    <span className="text-[var(--ink-800)] font-semibold tabular-nums">
                      {slot.formattedTime}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 text-[11px] text-[var(--success-700)] font-medium pt-1 border-t border-[var(--paper-200)]/60">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>Free from all classes</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setBookingSlot(slot)}
                  className="flex-1 px-3 py-2 rounded-xl bg-[var(--brand-500)] text-white text-xs font-bold hover:bg-[var(--brand-600)] transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  Quick Book
                </button>
                <Link
                  href={`/dashboard/lecturers/${slot.lecturerId}/slots`}
                  className="px-3 py-2 rounded-xl border border-[var(--paper-200)] text-[var(--ink-700)] text-xs font-semibold hover:bg-[var(--paper-100)] transition-colors text-center"
                  title="View full weekly calendar"
                >
                  All Slots
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Book Slot Modal */}
      {bookingSlot && (
        <BookSlotModal
          open={Boolean(bookingSlot)}
          slot={activeBookableSlot}
          lecturerName={bookingSlot.lecturerName}
          onClose={() => setBookingSlot(null)}
          onConfirm={handleQuickBookConfirm}
        />
      )}
    </div>
  );
}
