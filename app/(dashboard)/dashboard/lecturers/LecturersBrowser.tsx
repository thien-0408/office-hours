"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Card } from "@/components/dashboard/Card";
import { FilterTabs } from "@/components/dashboard/FilterTabs";
import { FormField, TextInput } from "@/components/dashboard/FormField";
import { LecturerCard } from "@/components/dashboard/LecturerCard";
import { SuggestedSlotsCard } from "@/components/dashboard/SuggestedSlotsCard";
import { useToast } from "@/components/ToastProvider";
import { getMockLecturers, getMockSuggestedLecturerSlots, type SuggestedSlot } from "@/lib/office-hours/mock-data";

const ALL_LECTURERS = getMockLecturers();
const DEPARTMENTS = Array.from(new Set(ALL_LECTURERS.map((l) => l.department))).sort();

const DAYS: { value: string; label: string }[] = [
  { value: "ALL", label: "Any day" },
  { value: "1", label: "Mon" },
  { value: "2", label: "Tue" },
  { value: "3", label: "Wed" },
  { value: "4", label: "Thu" },
  { value: "5", label: "Fri" },
];

export default function LecturersBrowser() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") ?? "";
  const toast = useToast();

  // Seeded once from the URL's ?q= via the useState initializer — no effect
  // syncing the input to the search param.
  const [query, setQuery] = useState(initialQuery);
  const [department, setDepartment] = useState<string>("ALL");
  const [day, setDay] = useState<string>("ALL");
  const [availability, setAvailability] = useState<string>("ALL");
  const [suggestedSlots, setSuggestedSlots] = useState<SuggestedSlot[]>(() => getMockSuggestedLecturerSlots());

  function handleBookSuccess(slot: SuggestedSlot) {
    setSuggestedSlots((prev) => prev.filter((suggested) => suggested.id !== slot.id));
    toast.success(`Booking request sent to ${slot.lecturerName}`, {
      description: "Slot is held for you pending confirmation.",
    });
  }

  const filtered = getMockLecturers({
    q: query || undefined,
    department: department === "ALL" ? undefined : department,
    dayOfWeek: day === "ALL" ? undefined : Number(day),
    availableOnly: availability === "AVAILABLE" ? true : undefined,
  });

  return (
    <div className="flex flex-col gap-6">
      <SuggestedSlotsCard
        slots={suggestedSlots}
        onBookSuccess={handleBookSuccess}
        showBrowseLink={false}
      />

      <div className="h-px bg-[var(--paper-200)]" aria-hidden="true" />

      <div>
        <h1 className="text-2xl font-bold text-[var(--ink-900)] mb-1">Find a Lecturer</h1>
        <p className="text-sm text-[var(--ink-600)]">Browse availability across every department.</p>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-end gap-3">
        <FormField label="Search">
          <TextInput
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Name or department…"
            className="sm:w-72"
          />
        </FormField>
        <FilterTabs
          options={[{ value: "ALL", label: "All departments" }, ...DEPARTMENTS.map((d) => ({ value: d, label: d }))]}
          value={department}
          onChange={setDepartment}
        />
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <FilterTabs options={DAYS} value={day} onChange={setDay} />
        <FilterTabs
          options={[
            { value: "ALL", label: "All lecturers" },
            { value: "AVAILABLE", label: "Available this week" },
          ]}
          value={availability}
          onChange={setAvailability}
        />
      </div>

      {filtered.length === 0 ? (
        <Card className="text-center py-10">
          <p className="text-sm text-[var(--ink-500)]">No lecturers match your search.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((lecturer) => (
            <LecturerCard key={lecturer.id} lecturer={lecturer} />
          ))}
        </div>
      )}
    </div>
  );
}
