"use client";

import { useMemo } from "react";
import {
  ExternalLink,
  Laptop,
  MapPin,
  Plus,
  School,
  Trash2,
} from "lucide-react";
import type { ScheduleBlock } from "@/lib/office-hours/types";
import {
  DAY_METADATA,
  getBlockColorStyles,
  getDurationLabel,
  getShiftForTime,
  timeToMinutes,
  type DayRangeFilter,
} from "./TimetableGrid";
import { Button } from "@/components/ui/button";

export function TimetableAgenda({
  blocks,
  dayRange = "PLUS_SAT",
  onSelectBlock,
  onAddManualBlock,
  onDeleteBlock,
}: {
  blocks: ScheduleBlock[];
  dayRange?: DayRangeFilter;
  onSelectBlock?: (block: ScheduleBlock) => void;
  onAddManualBlock?: (dayOfWeek: number) => void;
  onDeleteBlock?: (id: number) => void;
}) {
  const activeDays = useMemo(() => {
    switch (dayRange) {
      case "WORKDAYS":
        return [1, 2, 3, 4, 5];
      case "PLUS_SAT":
        return [1, 2, 3, 4, 5, 6];
      case "FULL_WEEK":
        return [1, 2, 3, 4, 5, 6, 7];
    }
  }, [dayRange]);

  const todayDayOfWeek = useMemo(() => {
    const d = new Date().getDay();
    return d === 0 ? 7 : d;
  }, []);

  const groupedDays = useMemo(() => {
    return activeDays.map((dayNum) => {
      const dayBlocks = blocks
        .filter((b) => b.dayOfWeek === dayNum)
        .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
      const totalHours = dayBlocks.reduce(
        (acc, b) => acc + (timeToMinutes(b.endTime) - timeToMinutes(b.startTime)) / 60,
        0
      );
      const dayDate = dayBlocks.find((b) => b.date)?.date;
      return {
        dayNum,
        meta: DAY_METADATA[dayNum],
        isToday: dayNum === todayDayOfWeek,
        blocks: dayBlocks,
        totalHours,
        dayDate,
      };
    });
  }, [activeDays, blocks, todayDayOfWeek]);

  return (
    <div className="flex flex-col gap-7 p-1 sm:p-2">
      {groupedDays.map(({ dayNum, meta, isToday, blocks: dayBlocks, totalHours, dayDate }) => (
        <section key={dayNum} className="min-w-0">
          <div className="mb-2.5 flex items-end justify-between gap-4 px-1">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                {isToday && <span className="h-1.5 w-1.5 rounded-full bg-[var(--brand-500)]" />}
                <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-[var(--ink-400)]">
                  {meta.short}
                </span>
                {dayDate && (
                  <span className="text-[10px] font-semibold tabular-nums text-[var(--ink-500)]">{dayDate}</span>
                )}
              </div>
              <h2 className="mt-1 text-sm font-semibold tracking-[-0.01em] text-[var(--ink-900)]">
                {meta.en} <span className="font-medium text-[var(--ink-400)]">· {meta.vn}</span>
              </h2>
            </div>

            <div className="flex shrink-0 items-center gap-3">
              <span className="text-[10.5px] font-medium tabular-nums text-[var(--ink-400)]">
                {dayBlocks.length} {dayBlocks.length === 1 ? "session" : "sessions"}
                {totalHours > 0 && ` · ${Number.isInteger(totalHours) ? totalHours : totalHours.toFixed(1)}h`}
              </span>
              {onAddManualBlock && (
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  onClick={() => onAddManualBlock(dayNum)}
                  className="text-[10.5px] text-[var(--ink-600)] hover:text-[var(--ink-900)]"
                >
                  <Plus className="h-3 w-3" />
                  Add
                </Button>
              )}
            </div>
          </div>

          {dayBlocks.length === 0 ? (
            <div className="rounded-lg border border-dashed border-[var(--paper-200)] bg-[var(--paper-50)]/35 px-4 py-5 text-center">
              <p className="text-[11px] font-medium text-[var(--ink-400)]">No scheduled classes</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-[var(--paper-200)] bg-white">
              {dayBlocks.map((block, index) => {
                const styleTokens = getBlockColorStyles(block);
                const shift = getShiftForTime(block.startTime);
                const isLab = block.locationType === "LAB" || block.room?.toUpperCase().includes("LAB");
                const isOnline = block.locationType === "ONLINE" || block.room?.toUpperCase().includes("ONLINE");

                return (
                  <Button variant="bare" size="bare"
                    type="button"
                    key={block.id}
                    onClick={() => onSelectBlock?.(block)}
                    className={`group grid w-full grid-cols-[86px_minmax(0,1fr)] text-left transition-colors ${
                      index > 0 ? "border-t border-[var(--paper-200)]" : ""
                    }`}
                  >
                    <div className="flex flex-col border-r border-[var(--paper-200)] bg-[var(--paper-50)]/45 px-3 py-4">
                      <span className="text-[12px] font-semibold tabular-nums text-[var(--ink-800)]">{block.startTime}</span>
                      <span className="mt-0.5 text-[10px] font-medium tabular-nums text-[var(--ink-400)]">{block.endTime}</span>
                      <span className="mt-auto pt-3 text-[9.5px] font-medium text-[var(--ink-400)]">
                        {getDurationLabel(block.startTime, block.endTime)}
                      </span>
                    </div>

                    <div className={`min-w-0 px-4 py-3.5 ${styleTokens.bg}`}>
                      <div className="flex min-w-0 items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className={`h-1.5 w-1.5 rounded-full ${styleTokens.dot}`} />
                            {block.subjectCode && block.subjectCode !== "N/A" && (
                              <span className={`text-[9.5px] font-bold uppercase tracking-[0.09em] ${styleTokens.badgeText}`}>
                                {block.subjectCode}
                              </span>
                            )}
                            {block.group && block.group !== "N/A" && (
                              <span className="text-[9.5px] font-medium text-[var(--ink-500)]">· Group {block.group}</span>
                            )}
                            <span className="text-[9.5px] font-medium text-[var(--ink-400)]">· {shift.vn}</span>
                          </div>

                          <h3 className="mt-1.5 text-[13px] font-semibold leading-5 tracking-[-0.01em] text-[var(--ink-900)]">
                            {block.subjectName || block.title}
                          </h3>
                        </div>

                        {block.source === "MANUAL" && onDeleteBlock && (
                          <span
                            role="button"
                            tabIndex={0}
                            onClick={(event) => {
                              event.stopPropagation();
                              onDeleteBlock(block.id);
                            }}
                            onKeyDown={(event) => {
                              if (event.key === "Enter" || event.key === " ") {
                                event.preventDefault();
                                event.stopPropagation();
                                onDeleteBlock(block.id);
                              }
                            }}
                            className="flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-md text-[var(--ink-300)] opacity-0 transition-all hover:bg-white/70 hover:text-[var(--danger-700)] group-hover:opacity-100"
                            title="Delete manual entry"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </span>
                        )}
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[10.5px] font-medium text-[var(--ink-500)]">
                        {block.room && (
                          <span className="inline-flex min-w-0 items-center gap-1.5">
                            {isLab ? (
                              <Laptop className="h-3.5 w-3.5 shrink-0" />
                            ) : isOnline ? (
                              <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                            ) : (
                              <MapPin className="h-3.5 w-3.5 shrink-0" />
                            )}
                            <span className="truncate">{block.room}</span>
                          </span>
                        )}

                        {block.lecturerName && (
                          <span className="inline-flex min-w-0 items-center gap-1.5">
                            <School className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate">{block.lecturerName}</span>
                          </span>
                        )}
                      </div>

                      {block.notes && (
                        <p className="mt-2 line-clamp-2 text-[10.5px] leading-4 text-[var(--ink-400)]">{block.notes}</p>
                      )}
                    </div>
                  </Button>
                );
              })}
            </div>
          )}
        </section>
      ))}
    </div>
  );
}
