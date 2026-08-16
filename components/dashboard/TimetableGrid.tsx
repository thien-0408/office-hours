"use client";

import { useMemo, useState } from "react";
import {
  Clock,
  ExternalLink,
  Laptop,
  MapPin,
  Plus,
  School,
  Trash2,
  Users,
  X,
} from "lucide-react";
import type { ScheduleBlock } from "@/lib/office-hours/types";

export type DayRangeFilter = "WORKDAYS" | "PLUS_SAT" | "FULL_WEEK";
export type ShiftFilter = "ALL" | "MORNING" | "AFTERNOON" | "EVENING";

export const DAY_METADATA: Record<number, { en: string; vn: string; short: string }> = {
  1: { en: "Monday", vn: "Thứ 2", short: "Mon" },
  2: { en: "Tuesday", vn: "Thứ 3", short: "Tue" },
  3: { en: "Wednesday", vn: "Thứ 4", short: "Wed" },
  4: { en: "Thursday", vn: "Thứ 5", short: "Thu" },
  5: { en: "Friday", vn: "Thứ 6", short: "Fri" },
  6: { en: "Saturday", vn: "Thứ 7", short: "Sat" },
  7: { en: "Sunday", vn: "Chủ Nhật", short: "Sun" },
};

// 30-minute interval slots from 07:30 to 20:30
export const TIME_SLOTS_FULL = [
  "07:30", "08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "12:00",
  "12:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00",
  "16:30", "17:00", "17:30", "18:00", "18:30", "19:00", "19:30", "20:00", "20:30",
];

export function timeToMinutes(t: string): number {
  if (!t) return 0;
  const parts = t.split(":");
  const h = parseInt(parts[0] || "0", 10);
  const m = parseInt(parts[1] || "0", 10);
  return h * 60 + m;
}

export function formatMinutes(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${pad(h)}:${pad(m)}`;
}

export function getDurationLabel(startTime: string, endTime: string): string {
  const diff = timeToMinutes(endTime) - timeToMinutes(startTime);
  if (diff <= 0) return "";
  const hours = diff / 60;
  return hours % 1 === 0 ? `${hours}h` : `${hours.toFixed(1)}h`;
}

export function getShiftForTime(time: string): { name: string; vn: string; hue: string } {
  const m = timeToMinutes(time);
  if (m < 12 * 60 + 30) {
    return { name: "Morning", vn: "Ca Sáng", hue: "var(--brand-500)" };
  } else if (m < 16 * 60 + 30) {
    return { name: "Afternoon", vn: "Ca Chiều", hue: "var(--coral-500)" };
  } else {
    return { name: "Evening", vn: "Ca Tối", hue: "var(--info-500)" };
  }
}

// Map color hues based on subject code or hue property
export function getBlockColorStyles(block: ScheduleBlock): {
  bg: string;
  border: string;
  text: string;
  badgeBg: string;
  badgeText: string;
  accentBar: string;
} {
  const hue = block.colorHue || (
    block.subjectCode?.includes("430")
      ? "brand"
      : block.subjectCode?.includes("437")
      ? "coral"
      : block.subjectCode?.includes("422")
      ? "info"
      : block.subjectCode?.includes("301")
      ? "mint"
      : block.subjectCode?.includes("410")
      ? "rose"
      : block.source === "MANUAL"
      ? "warning"
      : "brand"
  );

  switch (hue) {
    case "brand":
      return {
        bg: "bg-[var(--brand-50)]/90 hover:bg-[var(--brand-100)]",
        border: "border-[var(--brand-300)]",
        text: "text-[var(--brand-900)]",
        badgeBg: "bg-[var(--brand-500)]",
        badgeText: "text-white",
        accentBar: "bg-[var(--brand-500)]",
      };
    case "coral":
      return {
        bg: "bg-[var(--coral-100)]/80 hover:bg-[var(--coral-100)]",
        border: "border-[var(--coral-500)]/40",
        text: "text-[var(--coral-700)]",
        badgeBg: "bg-[var(--coral-500)]",
        badgeText: "text-white",
        accentBar: "bg-[var(--coral-500)]",
      };
    case "mint":
      return {
        bg: "bg-[var(--mint-100)]/80 hover:bg-[var(--mint-100)]",
        border: "border-[var(--mint-500)]/40",
        text: "text-[var(--mint-700)]",
        badgeBg: "bg-[var(--mint-500)]",
        badgeText: "text-white",
        accentBar: "bg-[var(--mint-500)]",
      };
    case "rose":
      return {
        bg: "bg-[var(--rose-100)]/80 hover:bg-[var(--rose-100)]",
        border: "border-[var(--rose-500)]/40",
        text: "text-[var(--rose-700)]",
        badgeBg: "bg-[var(--rose-500)]",
        badgeText: "text-white",
        accentBar: "bg-[var(--rose-500)]",
      };
    case "info":
      return {
        bg: "bg-[var(--info-100)]/80 hover:bg-[var(--info-100)]",
        border: "border-[var(--info-500)]/40",
        text: "text-[var(--info-700)]",
        badgeBg: "bg-[var(--info-500)]",
        badgeText: "text-white",
        accentBar: "bg-[var(--info-500)]",
      };
    case "warning":
      return {
        bg: "bg-[var(--warning-100)]/80 hover:bg-[var(--warning-100)]",
        border: "border-[var(--warning-500)]/40",
        text: "text-[var(--warning-700)]",
        badgeBg: "bg-[var(--warning-500)]",
        badgeText: "text-white",
        accentBar: "bg-[var(--warning-500)]",
      };
    default:
      return {
        bg: "bg-[var(--paper-100)] hover:bg-[var(--paper-200)]",
        border: "border-[var(--paper-200)]",
        text: "text-[var(--ink-900)]",
        badgeBg: "bg-[var(--ink-700)]",
        badgeText: "text-white",
        accentBar: "bg-[var(--ink-500)]",
      };
  }
}

interface LayoutBlock extends ScheduleBlock {
  colIndex: number;
  totalCols: number;
}

// Compute overlapping blocks layout within a day
function layoutDayBlocks(blocks: ScheduleBlock[]): LayoutBlock[] {
  if (blocks.length === 0) return [];
  const sorted = [...blocks].sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
  
  const result: LayoutBlock[] = [];
  const activeClusters: LayoutBlock[][] = [];

  for (const block of sorted) {
    const start = timeToMinutes(block.startTime);

    // Find cluster that overlaps
    let placed = false;
    for (const cluster of activeClusters) {
      const clusterEnd = Math.max(...cluster.map((b) => timeToMinutes(b.endTime)));
      if (start < clusterEnd) {
        // Place in first available colIndex
        const usedCols = new Set(cluster.filter((b) => timeToMinutes(b.endTime) > start).map((b) => b.colIndex));
        let col = 0;
        while (usedCols.has(col)) col++;
        const layoutItem: LayoutBlock = { ...block, colIndex: col, totalCols: Math.max(cluster.length + 1, col + 1) };
        cluster.push(layoutItem);
        // Update all items in this cluster
        const maxCol = Math.max(...cluster.map((b) => b.colIndex)) + 1;
        cluster.forEach((b) => {
          b.totalCols = maxCol;
        });
        result.push(layoutItem);
        placed = true;
        break;
      }
    }

    if (!placed) {
      const layoutItem: LayoutBlock = { ...block, colIndex: 0, totalCols: 1 };
      activeClusters.push([layoutItem]);
      result.push(layoutItem);
    }
  }

  return result;
}

export function TimetableGrid({
  blocks,
  dayRange = "PLUS_SAT",
  shiftFilter = "ALL",
  onSelectBlock,
  onAddManualBlock,
  onDeleteBlock,
}: {
  blocks: ScheduleBlock[];
  dayRange?: DayRangeFilter;
  shiftFilter?: ShiftFilter;
  onSelectBlock?: (block: ScheduleBlock) => void;
  onAddManualBlock?: (dayOfWeek: number, startTime?: string) => void;
  onDeleteBlock?: (id: number) => void;
}) {
  const [selectedBlock, setSelectedBlock] = useState<ScheduleBlock | null>(null);

  // Determine active days list
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

  // Determine active time bounds based on shift filter
  const { startMin, endMin, displaySlots } = useMemo(() => {
    let s = timeToMinutes("07:30"); // 450
    let e = timeToMinutes("20:30"); // 1230

    if (shiftFilter === "MORNING") {
      s = timeToMinutes("07:30");
      e = timeToMinutes("12:30");
    } else if (shiftFilter === "AFTERNOON") {
      s = timeToMinutes("12:30");
      e = timeToMinutes("16:30");
    } else if (shiftFilter === "EVENING") {
      s = timeToMinutes("16:30");
      e = timeToMinutes("20:30");
    }

    const filteredSlots = TIME_SLOTS_FULL.filter((slot) => {
      const m = timeToMinutes(slot);
      return m >= s && m <= e;
    });

    return { startMin: s, endMin: e, displaySlots: filteredSlots };
  }, [shiftFilter]);

  // Group and layout blocks per active day
  const dayLayouts = useMemo(() => {
    const map = new Map<number, LayoutBlock[]>();
    activeDays.forEach((d) => {
      const dayBlocks = blocks.filter((b) => {
        if (b.dayOfWeek !== d) return false;
        const bStart = timeToMinutes(b.startTime);
        const bEnd = timeToMinutes(b.endTime);
        // Check overlap with active shift window
        return bStart < endMin && bEnd > startMin;
      });
      map.set(d, layoutDayBlocks(dayBlocks));
    });
    return map;
  }, [activeDays, blocks, startMin, endMin]);

  // Current day index (1 = Mon, 7 = Sun)
  const todayDayOfWeek = useMemo(() => {
    const d = new Date().getDay();
    return d === 0 ? 7 : d;
  }, []);

  const slotRowHeight = 44; // px per 30 minutes
  const totalGridHeight = (displaySlots.length - 1) * slotRowHeight;

  function handleBlockClick(block: ScheduleBlock) {
    setSelectedBlock(block);
    onSelectBlock?.(block);
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Timetable container */}
      <div className="border border-[var(--paper-200)] bg-[var(--bg-surface)] rounded-2xl shadow-sm overflow-hidden">
        {/* Scroll wrapper */}
        <div className="overflow-x-auto">
          <div className="min-w-[780px]">
            {/* Header row: Days of the week */}
            <div className="grid border-b border-[var(--paper-200)] bg-[var(--paper-50)] sticky top-0 z-20"
                 style={{ gridTemplateColumns: `80px repeat(${activeDays.length}, minmax(0, 1fr))` }}>
              
              {/* Top-left corner: Time header */}
              <div className="p-3 border-r border-[var(--paper-200)] flex flex-col justify-center items-center text-center">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--ink-500)]">Time</span>
                <span className="text-[10px] text-[var(--ink-400)]">07:30 Start</span>
              </div>

              {/* Day headers */}
              {activeDays.map((dayNum) => {
                const meta = DAY_METADATA[dayNum];
                const isToday = dayNum === todayDayOfWeek;
                const dayBlocks = dayLayouts.get(dayNum) || [];
                const totalHours = dayBlocks.reduce((acc, b) => {
                  return acc + (timeToMinutes(b.endTime) - timeToMinutes(b.startTime)) / 60;
                }, 0);

                const dayDate = dayBlocks.find((b) => b.date)?.date;

                return (
                  <div
                    key={dayNum}
                    className={`py-3 px-3 border-r border-[var(--paper-200)] last:border-r-0 flex flex-col items-center justify-center transition-colors ${
                      isToday ? "bg-[var(--brand-50)]/70 text-[var(--brand-900)]" : ""
                    }`}
                  >
                    <div className="flex items-center gap-1.5 flex-wrap justify-center">
                      <span className="text-[13px] font-bold text-[var(--ink-900)]">{meta.en}</span>
                      <span className="text-[11px] font-medium text-[var(--ink-500)]">({meta.vn})</span>
                      {dayDate && (
                        <span className="px-1.5 py-0.5 rounded text-[10.5px] font-extrabold bg-[var(--brand-100)] text-[var(--brand-800)] border border-[var(--brand-200)]">
                          {dayDate}
                        </span>
                      )}
                      {isToday && (
                        <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-[var(--brand-500)] text-white shadow-xs">
                          Today
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 text-[11px] text-[var(--ink-500)]">
                      <span>{dayBlocks.length} session{dayBlocks.length === 1 ? "" : "s"}</span>
                      {totalHours > 0 && <span>· {totalHours.toFixed(1)}h</span>}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Grid Body */}
            <div className="relative flex" style={{ height: `${totalGridHeight}px` }}>
              {/* Left Time Axis Gutter */}
              <div className="w-[80px] shrink-0 border-r border-[var(--paper-200)] bg-[var(--paper-50)]/50 select-none relative z-10">
                {displaySlots.map((timeStr, idx) => {
                  if (idx === displaySlots.length - 1) return null;
                  const isHour = timeStr.endsWith(":00") || timeStr === "07:30";
                  const shift = getShiftForTime(timeStr);
                  const isShiftStart = timeStr === "07:30" || timeStr === "12:30" || timeStr === "16:30";

                  return (
                    <div
                      key={timeStr}
                      className={`relative flex items-center justify-end pr-2.5 border-b border-[var(--paper-200)]/60 text-right ${
                        isShiftStart ? "border-t border-t-[var(--ink-300)]" : ""
                      }`}
                      style={{ height: `${slotRowHeight}px` }}
                    >
                      {isShiftStart && (
                        <div
                          className="absolute left-1 top-1 text-[8.5px] font-bold uppercase tracking-wider px-1 rounded"
                          style={{ color: shift.hue }}
                        >
                          {shift.vn}
                        </div>
                      )}
                      <span
                        className={`text-[11.5px] tabular-nums ${
                          isHour
                            ? "font-bold text-[var(--ink-800)]"
                            : "font-normal text-[var(--ink-400)]"
                        }`}
                      >
                        {timeStr}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Day Columns Matrix */}
              <div className="flex-1 grid relative"
                   style={{ gridTemplateColumns: `repeat(${activeDays.length}, minmax(0, 1fr))` }}>
                
                {/* Horizontal grid guide lines */}
                <div className="absolute inset-0 pointer-events-none flex flex-col">
                  {displaySlots.map((timeStr, idx) => {
                    if (idx === displaySlots.length - 1) return null;
                    const isShiftStart = timeStr === "12:30" || timeStr === "16:30";
                    return (
                      <div
                        key={`grid-line-${timeStr}`}
                        className={`w-full border-b ${
                          isShiftStart
                            ? "border-b-[var(--paper-300)] border-dashed"
                            : "border-b-[var(--paper-100)]"
                        }`}
                        style={{ height: `${slotRowHeight}px` }}
                      />
                    );
                  })}
                </div>

                {/* Day Columns and Blocks */}
                {activeDays.map((dayNum) => {
                  const dayBlocks = dayLayouts.get(dayNum) || [];
                  const isToday = dayNum === todayDayOfWeek;

                  return (
                    <div
                      key={`col-${dayNum}`}
                      className={`relative border-r border-[var(--paper-200)] last:border-r-0 h-full ${
                        isToday ? "bg-[var(--brand-50)]/20" : ""
                      }`}
                    >
                      {/* Slot click areas for adding manual events */}
                      {onAddManualBlock &&
                        displaySlots.map((slotTime, idx) => {
                          if (idx === displaySlots.length - 1) return null;
                          return (
                            <div
                              key={`slot-click-${slotTime}`}
                              onClick={() => onAddManualBlock(dayNum, slotTime)}
                              className="group/slot absolute left-0 right-0 cursor-pointer z-0 transition-colors hover:bg-[var(--brand-50)]/40 flex items-center justify-center"
                              style={{
                                top: `${idx * slotRowHeight}px`,
                                height: `${slotRowHeight}px`,
                              }}
                              title={`Click to add event at ${DAY_METADATA[dayNum].en} ${slotTime}`}
                            >
                              <Plus className="w-3.5 h-3.5 text-[var(--brand-500)] opacity-0 group-hover/slot:opacity-80 transition-opacity" />
                            </div>
                          );
                        })}

                      {/* Rendered Event Blocks */}
                      {dayBlocks.map((block) => {
                        const bStart = Math.max(timeToMinutes(block.startTime), startMin);
                        const bEnd = Math.min(timeToMinutes(block.endTime), endMin);
                        const durationMins = bEnd - bStart;
                        if (durationMins <= 0) return null;

                        const topOffset = ((bStart - startMin) / 30) * slotRowHeight;
                        const blockHeight = (durationMins / 30) * slotRowHeight - 4; // 4px spacing

                        const widthPct = 100 / block.totalCols;
                        const leftPct = block.colIndex * widthPct;

                        const styleTokens = getBlockColorStyles(block);
                        const isLab = block.locationType === "LAB" || block.room?.toUpperCase().includes("LAB");
                        const isOnline = block.locationType === "ONLINE" || block.room?.toUpperCase().includes("ONLINE");

                        return (
                          <div
                            key={block.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleBlockClick(block);
                            }}
                            className={`absolute rounded-xl border p-2.5 shadow-xs cursor-pointer transition-all duration-150 hover:shadow-md hover:scale-[1.01] overflow-hidden flex flex-col justify-between z-10 ${styleTokens.bg} ${styleTokens.border} ${styleTokens.text}`}
                            style={{
                              top: `${topOffset + 2}px`,
                              height: `${Math.max(blockHeight, 38)}px`,
                              left: `calc(${leftPct}% + 3px)`,
                              width: `calc(${widthPct}% - 6px)`,
                            }}
                          >
                            {/* Accent color left strip */}
                            <div className={`absolute top-0 bottom-0 left-0 w-1 ${styleTokens.accentBar}`} />

                            {/* Top row: Code / Group / Source */}
                            <div className="flex items-start justify-between gap-1 pl-1">
                              <div className="flex flex-wrap items-center gap-1">
                                {block.subjectCode && block.subjectCode !== "N/A" && (
                                  <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider ${styleTokens.badgeBg} ${styleTokens.badgeText}`}>
                                    {block.subjectCode}
                                  </span>
                                )}
                                {block.group && block.group !== "N/A" && (
                                  <span className="px-1 py-0.5 rounded text-[9.5px] font-semibold bg-white/70 text-[var(--ink-700)] border border-black/5">
                                    Nhóm: {block.group}
                                  </span>
                                )}
                              </div>
                              <span className="text-[10.5px] font-bold tabular-nums shrink-0 opacity-80">
                                {getDurationLabel(block.startTime, block.endTime)}
                              </span>
                            </div>

                            {/* Title / Subject Name */}
                            <div className="pl-1 my-0.5 flex-1 flex flex-col justify-center">
                              <p className="text-[12px] font-bold leading-tight line-clamp-2" title={block.title}>
                                {block.subjectName || block.title}
                              </p>
                            </div>

                            {/* Bottom row: Time & Room */}
                            <div className="flex flex-wrap items-center justify-between gap-1 pl-1 text-[11px] pt-1 border-t border-black/5">
                              <div className="flex items-center gap-1 font-semibold tabular-nums opacity-90">
                                <Clock className="w-3 h-3 shrink-0" />
                                <span>{block.startTime}–{block.endTime}</span>
                              </div>

                              {block.room && (
                                <div className="flex items-center gap-1 font-medium truncate max-w-[120px]" title={block.room}>
                                  {isLab ? (
                                    <Laptop className="w-3 h-3 text-[var(--brand-600)] shrink-0" />
                                  ) : isOnline ? (
                                    <ExternalLink className="w-3 h-3 text-[var(--info-600)] shrink-0" />
                                  ) : (
                                    <MapPin className="w-3 h-3 text-[var(--ink-500)] shrink-0" />
                                  )}
                                  <span className="truncate">{block.room.split("-")[0]}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Session Details Modal */}
      {selectedBlock && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-[var(--bg-surface)] border border-[var(--paper-200)] rounded-2xl shadow-xl max-w-lg w-full overflow-hidden p-6">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="flex items-center gap-2">
                {selectedBlock.subjectCode && (
                  <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-[var(--brand-500)] text-white">
                    {selectedBlock.subjectCode}
                  </span>
                )}
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[var(--paper-100)] text-[var(--ink-600)] uppercase tracking-wide">
                  {selectedBlock.source === "IMPORTED" ? "AAO Import" : "Manual Block"}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedBlock(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-[var(--ink-400)] hover:bg-[var(--paper-100)] hover:text-[var(--ink-700)] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <h2 className="text-lg font-bold text-[var(--ink-900)] mb-1">
              {selectedBlock.subjectName || selectedBlock.title}
            </h2>
            <p className="text-xs text-[var(--ink-500)] mb-4">
              {DAY_METADATA[selectedBlock.dayOfWeek]?.en} ({DAY_METADATA[selectedBlock.dayOfWeek]?.vn}){selectedBlock.date ? ` · Ngày ${selectedBlock.date}` : ""} · {getShiftForTime(selectedBlock.startTime).vn}
            </p>

            <div className="grid grid-cols-2 gap-3 p-3.5 bg-[var(--paper-50)] border border-[var(--paper-200)] rounded-xl mb-4 text-xs">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[var(--brand-500)] shrink-0" />
                <div>
                  <p className="text-[var(--ink-400)] font-medium">Time & Duration</p>
                  <p className="font-bold text-[var(--ink-800)] tabular-nums">
                    {selectedBlock.startTime} – {selectedBlock.endTime} ({getDurationLabel(selectedBlock.startTime, selectedBlock.endTime)})
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[var(--coral-500)] shrink-0" />
                <div>
                  <p className="text-[var(--ink-400)] font-medium">Room / Facility</p>
                  <p className="font-bold text-[var(--ink-800)] truncate" title={selectedBlock.room}>
                    {selectedBlock.room || "Campus Room"}
                  </p>
                </div>
              </div>

              {selectedBlock.group && (
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-[var(--info-500)] shrink-0" />
                  <div>
                    <p className="text-[var(--ink-400)] font-medium">Class Group / Nhóm</p>
                    <p className="font-bold text-[var(--ink-800)]">{selectedBlock.group}</p>
                  </div>
                </div>
              )}

              {selectedBlock.lecturerName && (
                <div className="flex items-center gap-2">
                  <School className="w-4 h-4 text-[var(--mint-500)] shrink-0" />
                  <div>
                    <p className="text-[var(--ink-400)] font-medium">Instructor / GV</p>
                    <p className="font-bold text-[var(--ink-800)]">{selectedBlock.lecturerName}</p>
                  </div>
                </div>
              )}
            </div>

            {selectedBlock.notes && (
              <div className="p-3 bg-[var(--paper-50)] border border-[var(--paper-200)] rounded-xl mb-4 text-xs text-[var(--ink-600)]">
                <span className="font-semibold text-[var(--ink-800)]">Notes: </span>
                {selectedBlock.notes}
              </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-[var(--paper-200)]">
              {selectedBlock.source === "MANUAL" && onDeleteBlock ? (
                <button
                  type="button"
                  onClick={() => {
                    onDeleteBlock(selectedBlock.id);
                    setSelectedBlock(null);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-[var(--danger-700)] hover:bg-[var(--danger-100)] transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete manual block
                </button>
              ) : (
                <span className="text-[11px] text-[var(--ink-400)]">AAO Synchronized Schedule</span>
              )}

              <button
                type="button"
                onClick={() => setSelectedBlock(null)}
                className="px-4 py-2 rounded-xl bg-[var(--brand-500)] text-white text-xs font-bold hover:bg-[var(--brand-600)] transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
