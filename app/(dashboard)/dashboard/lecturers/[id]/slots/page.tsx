"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { BookSlotModal } from "@/components/dashboard/BookSlotModal";
import { Card } from "@/components/dashboard/Card";
import { SectionHeader } from "@/components/dashboard/SectionHeader";
import { WeekSlotGrid } from "@/components/dashboard/WeekSlotGrid";
import { getMockLecturerById, getMockLecturerWeekSlots } from "@/lib/office-hours/mock-data";
import type { BookableSlot } from "@/lib/office-hours/types";

export default function LecturerSlotsPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const lecturer = getMockLecturerById(id);

  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedSlot, setSelectedSlot] = useState<BookableSlot | null>(null);
  // Slot ids booked during this session — merged into the grid so a just-
  // booked slot immediately shows as unavailable. Not persisted (no backend).
  const [bookedSlotIds, setBookedSlotIds] = useState<number[]>([]);

  if (!lecturer) {
    return (
      <Card className="text-center py-10">
        <p className="text-sm text-[var(--ink-500)] mb-4">Lecturer not found.</p>
        <Link href="/dashboard/lecturers" className="text-sm font-semibold text-[var(--brand-500)] no-underline hover:underline">
          Back to lecturers
        </Link>
      </Card>
    );
  }

  const slots = getMockLecturerWeekSlots(id, weekOffset).map((slot) =>
    bookedSlotIds.includes(slot.id) ? { ...slot, available: false } : slot
  );

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/dashboard/lecturers"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--ink-600)] no-underline hover:text-[var(--brand-600)] w-fit"
      >
        <ArrowLeft className="w-4 h-4" strokeWidth={2} />
        Back to lecturers
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-[var(--ink-900)] mb-1">{lecturer.name}</h1>
        <p className="text-sm text-[var(--ink-600)]">{lecturer.department}</p>
      </div>

      <Card>
        <div className="flex items-center justify-between mb-4">
          <SectionHeader title={weekOffset === 0 ? "This week" : `${weekOffset} week${weekOffset > 1 ? "s" : ""} out`} />
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={weekOffset === 0}
              onClick={() => setWeekOffset((w) => Math.max(0, w - 1))}
              className="flex items-center justify-center w-8 h-8 rounded-full text-[var(--ink-600)] hover:bg-[var(--brand-50)] disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
              aria-label="Previous week"
            >
              <ChevronLeft className="w-4 h-4" strokeWidth={2} />
            </button>
            <button
              type="button"
              onClick={() => setWeekOffset((w) => w + 1)}
              className="flex items-center justify-center w-8 h-8 rounded-full text-[var(--ink-600)] hover:bg-[var(--brand-50)] transition-colors"
              aria-label="Next week"
            >
              <ChevronRight className="w-4 h-4" strokeWidth={2} />
            </button>
          </div>
        </div>

        <WeekSlotGrid slots={slots} onSelectSlot={setSelectedSlot} />
      </Card>

      <Link
        href={`/dashboard/bookings/recurring?lecturer=${id}`}
        className="text-sm font-semibold text-[var(--brand-500)] no-underline hover:underline w-fit"
      >
        Make this a weekly booking →
      </Link>

      <BookSlotModal
        open={selectedSlot !== null}
        slot={selectedSlot}
        lecturerName={lecturer.name}
        onClose={() => setSelectedSlot(null)}
        onConfirm={() => {
          if (selectedSlot) setBookedSlotIds((ids) => [...ids, selectedSlot.id]);
        }}
      />
    </div>
  );
}
