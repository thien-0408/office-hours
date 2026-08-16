"use client";

import { useMemo } from "react";
import {
  Clock,
  ExternalLink,
  Laptop,
  MapPin,
  Plus,
  School,
  Trash2,
} from "lucide-react";
import { Card } from "@/components/dashboard/Card";
import type { ScheduleBlock } from "@/lib/office-hours/types";
import {
  DAY_METADATA,
  getBlockColorStyles,
  getDurationLabel,
  getShiftForTime,
  timeToMinutes,
  type DayRangeFilter,
} from "./TimetableGrid";

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
    <div className="flex flex-col gap-5">
      {groupedDays.map(({ dayNum, meta, isToday, blocks: dayBlocks, totalHours, dayDate }) => (
        <div key={dayNum} className="flex flex-col gap-2.5">
          {/* Day Section Header */}
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-[var(--ink-900)]">
                {meta.en} <span className="text-[var(--ink-500)] font-medium">({meta.vn})</span>
              </h2>
              {dayDate && (
                <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-[var(--brand-100)] text-[var(--brand-800)] border border-[var(--brand-200)]">
                  {dayDate}
                </span>
              )}
              {isToday && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[var(--brand-500)] text-white shadow-xs">
                  Today
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-[var(--ink-500)] tabular-nums">
                {dayBlocks.length} session{dayBlocks.length === 1 ? "" : "s"}
                {totalHours > 0 && ` · ${totalHours.toFixed(1)}h total`}
              </span>
              {onAddManualBlock && (
                <button
                  type="button"
                  onClick={() => onAddManualBlock(dayNum)}
                  className="flex items-center gap-1 text-[11px] font-semibold text-[var(--brand-600)] hover:text-[var(--brand-700)] transition-colors"
                >
                  <Plus className="w-3 h-3" />
                  Add event
                </button>
              )}
            </div>
          </div>

          {/* Day Blocks List */}
          {dayBlocks.length === 0 ? (
            <Card className="py-6 text-center border-dashed border-[var(--paper-200)] bg-[var(--paper-50)]/40">
              <p className="text-xs text-[var(--ink-400)]">No scheduled classes or commitments</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {dayBlocks.map((block) => {
                const styleTokens = getBlockColorStyles(block);
                const shift = getShiftForTime(block.startTime);
                const isLab = block.locationType === "LAB" || block.room?.toUpperCase().includes("LAB");
                const isOnline = block.locationType === "ONLINE" || block.room?.toUpperCase().includes("ONLINE");

                return (
                  <Card
                    key={block.id}
                    className={`relative p-4 overflow-hidden border transition-all hover:shadow-md cursor-pointer ${styleTokens.bg} ${styleTokens.border}`}
                    onClick={() => onSelectBlock?.(block)}
                  >
                    {/* Left Accent Bar */}
                    <div className={`absolute top-0 bottom-0 left-0 w-1.5 ${styleTokens.accentBar}`} />

                    <div className="flex flex-col gap-2 pl-1">
                      {/* Top Row: Code / Shift / Duration / Source */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {block.subjectCode && block.subjectCode !== "N/A" && (
                            <span className={`px-2 py-0.5 rounded-md text-[11px] font-extrabold uppercase tracking-wider ${styleTokens.badgeBg} ${styleTokens.badgeText}`}>
                              {block.subjectCode}
                            </span>
                          )}
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-black/5 text-[var(--ink-700)]">
                            {shift.vn}
                          </span>
                          {block.group && block.group !== "N/A" && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-white/80 text-[var(--ink-800)] border border-black/5">
                              Nhóm {block.group}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold tabular-nums text-[var(--ink-700)]">
                            {getDurationLabel(block.startTime, block.endTime)}
                          </span>
                          {block.source === "MANUAL" && onDeleteBlock && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteBlock(block.id);
                              }}
                              className="text-[var(--ink-400)] hover:text-[var(--danger-700)] transition-colors p-1"
                              title="Delete manual entry"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Course Title */}
                      <div>
                        <h3 className="text-sm font-bold text-[var(--ink-900)] leading-snug">
                          {block.subjectName || block.title}
                        </h3>
                      </div>

                      {/* Details Strip */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-2 border-t border-black/5 text-xs text-[var(--ink-600)]">
                        <div className="flex items-center gap-1.5 font-semibold tabular-nums text-[var(--ink-800)]">
                          <Clock className="w-3.5 h-3.5 text-[var(--brand-500)] shrink-0" />
                          <span>{block.startTime} – {block.endTime}</span>
                        </div>

                        {block.room && (
                          <div className="flex items-center gap-1.5 truncate">
                            {isLab ? (
                              <Laptop className="w-3.5 h-3.5 text-[var(--brand-600)] shrink-0" />
                            ) : isOnline ? (
                              <ExternalLink className="w-3.5 h-3.5 text-[var(--info-600)] shrink-0" />
                            ) : (
                              <MapPin className="w-3.5 h-3.5 text-[var(--coral-500)] shrink-0" />
                            )}
                            <span className="truncate">{block.room}</span>
                          </div>
                        )}

                        {block.lecturerName && (
                          <div className="flex items-center gap-1.5 sm:col-span-2 text-[11.5px] text-[var(--ink-500)]">
                            <School className="w-3.5 h-3.5 text-[var(--mint-600)] shrink-0" />
                            <span>GV: {block.lecturerName}</span>
                          </div>
                        )}
                      </div>

                      {block.notes && (
                        <p className="text-[11.5px] text-[var(--ink-500)] italic pt-1">
                          Note: {block.notes}
                        </p>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
