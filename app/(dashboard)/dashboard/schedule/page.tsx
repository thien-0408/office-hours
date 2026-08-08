"use client";

import { Info } from "lucide-react";
import { Card } from "@/components/dashboard/Card";
import { getMockScheduleBlocks } from "@/lib/office-hours/mock-data";
import type { ScheduleBlock } from "@/lib/office-hours/types";

const DAY_LABELS: Record<number, string> = {
  1: "Monday",
  2: "Tuesday",
  3: "Wednesday",
  4: "Thursday",
  5: "Friday",
};

function groupByDay(blocks: ScheduleBlock[]): { dayOfWeek: number; blocks: ScheduleBlock[] }[] {
  return [1, 2, 3, 4, 5]
    .map((dayOfWeek) => ({
      dayOfWeek,
      blocks: blocks.filter((b) => b.dayOfWeek === dayOfWeek).sort((a, b) => a.startTime.localeCompare(b.startTime)),
    }))
    .filter((day) => day.blocks.length > 0);
}

function SourceBadge({ source }: { source: ScheduleBlock["source"] }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-semibold uppercase tracking-wide bg-[var(--paper-100)] text-[var(--ink-500)]">
      {source === "IMPORTED" ? "Imported" : "Manual"}
    </span>
  );
}

// Read-mostly (DESIGN.md: "admin edits") — day-column layout echoes
// WeekSlotGrid's visual language but renders static info cards, not
// bookable buttons, since there's nothing for the lecturer to click here.
export default function SchedulePage() {
  const blocks = getMockScheduleBlocks();
  const days = groupByDay(blocks);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--ink-900)] mb-1">My Schedule</h1>
        <p className="text-sm text-[var(--ink-600)]">Your teaching schedule, imported and manually entered by your department admin.</p>
      </div>

      <p className="text-[12.5px] text-[var(--ink-500)] bg-[var(--paper-50)] border border-[var(--paper-200)] rounded-lg px-3.5 py-2.5 flex items-center gap-2">
        <Info className="w-3.5 h-3.5 shrink-0" strokeWidth={2} />
        Read-only — to correct a block, contact your admin (Schedule Import / Manual Schedule Entry).
      </p>

      {days.length === 0 ? (
        <Card className="text-center py-10">
          <p className="text-sm text-[var(--ink-500)]">No teaching schedule on file.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {days.map(({ dayOfWeek, blocks: dayBlocks }) => (
            <div key={dayOfWeek} className="flex flex-col gap-2">
              <p className="text-xs font-bold uppercase tracking-wide text-[var(--ink-500)] px-1">{DAY_LABELS[dayOfWeek]}</p>
              <div className="flex flex-col gap-2">
                {dayBlocks.map((block) => (
                  <Card key={block.id} className="p-3.5">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="text-[13px] font-semibold text-[var(--ink-900)] leading-snug">{block.title}</p>
                      <SourceBadge source={block.source} />
                    </div>
                    <p className="text-[12px] text-[var(--ink-500)] tabular-nums">
                      {block.startTime}–{block.endTime}
                    </p>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
