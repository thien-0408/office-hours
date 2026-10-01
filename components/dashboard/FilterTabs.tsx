"use client";

import type { ReactNode } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

// Generic segmented control — My Bookings status filter, Notifications, Waitlist,
// the schedule layout toggle and the timetable import mode. Built on the shadcn
// Tabs primitive (arrow-key navigation + aria for free). `variant` picks one of the
// skins that used to be hand-rolled per page; active state stays brand-blue except
// where the original deliberately used ink-900/white.
type Variant = "pill" | "compact" | "chips" | "dark" | "paper";

const LIST: Record<Variant, string> = {
  pill: "h-auto gap-1 rounded-full border border-[var(--paper-200)] bg-white p-1",
  compact: "h-auto flex-wrap gap-1 rounded-full border border-[var(--paper-200)] bg-white p-1",
  chips: "h-auto flex-wrap gap-1.5 rounded-none bg-transparent p-0",
  dark: "h-auto gap-0 rounded-lg border border-[var(--paper-200)] bg-white p-0.5",
  paper: "h-auto gap-0 rounded-xl border border-[var(--paper-200)] bg-[var(--paper-100)] p-1",
};

const TRIGGER: Record<Variant, string> = {
  pill: "px-3.5 py-1.5 rounded-full text-[13px] text-[var(--ink-600)] hover:bg-[var(--paper-100)] data-active:bg-[var(--brand-500)] data-active:text-white data-active:hover:bg-[var(--brand-500)]",
  compact: "min-h-[29px] px-2.5 py-1 rounded-full text-[11px] font-bold text-[var(--ink-600)] hover:bg-[var(--paper-100)] data-active:bg-[var(--brand-500)] data-active:text-white data-active:hover:bg-[var(--brand-500)]",
  chips: "px-3 py-1.5 rounded-xl text-xs bg-[var(--paper-100)] text-[var(--ink-600)] hover:bg-[var(--paper-200)] data-active:bg-[var(--brand-500)] data-active:text-white data-active:hover:bg-[var(--brand-500)]",
  dark: "h-8 gap-1.5 px-3 rounded-md text-xs text-[var(--ink-500)] hover:bg-[var(--paper-50)] hover:text-[var(--ink-900)] data-active:bg-[var(--ink-900)] data-active:text-white data-active:hover:bg-[var(--ink-900)] data-active:hover:text-white",
  paper: "px-3 py-1.5 rounded-lg text-xs font-bold text-[var(--ink-600)] hover:text-[var(--ink-900)] data-active:bg-white data-active:text-[var(--ink-900)]",
};

export function FilterTabs<T extends string>({
  options,
  value,
  onChange,
  variant = "pill",
  className,
}: {
  options: { value: T; label: ReactNode; icon?: ReactNode; title?: string }[];
  value: T;
  onChange: (value: T) => void;
  variant?: Variant;
  className?: string;
}) {
  return (
    <Tabs value={value} onValueChange={(next) => onChange(next as T)} className={className}>
      <TabsList className={LIST[variant]}>
        {options.map((opt) => (
          <TabsTrigger
            key={opt.value}
            value={opt.value}
            title={opt.title}
            className={cn(
              "h-auto flex-none font-semibold whitespace-nowrap data-active:shadow-none dark:data-active:text-white",
              variant === "paper" && "data-active:shadow-xs dark:data-active:text-[var(--ink-900)]",
              TRIGGER[variant]
            )}
          >
            {opt.icon}
            {opt.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
