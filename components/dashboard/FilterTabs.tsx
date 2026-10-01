"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Generic segmented filter control — shared by My Bookings (status filter)
// and Notifications (All/Unread). Built on the shadcn Tabs primitive (arrow-key
// navigation + aria for free); active tab keeps the brand-blue treatment since
// DESIGN.md keeps brand-500 as the only primary/interactive color.
export function FilterTabs<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <Tabs value={value} onValueChange={(next) => onChange(next as T)}>
      <TabsList className="h-auto gap-1 rounded-full border border-[var(--paper-200)] bg-white p-1">
        {options.map((opt) => (
          <TabsTrigger
            key={opt.value}
            value={opt.value}
            className="h-auto flex-none rounded-full px-3.5 py-1.5 text-[13px] font-semibold text-[var(--ink-600)] hover:bg-[var(--paper-100)] hover:text-[var(--ink-600)] data-active:bg-[var(--brand-500)] data-active:text-white data-active:shadow-none data-active:hover:bg-[var(--brand-500)] dark:data-active:text-white"
          >
            {opt.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
