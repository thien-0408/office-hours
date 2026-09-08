"use client";

import { useMemo, useState, type PointerEvent as ReactPointerEvent } from "react";
import {
  Clock,
  ExternalLink,
  Laptop,
  MapPin,
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

// 30-minute boundaries from 07:30 to 20:30. A visual row is the interval
// between two consecutive entries, not the label itself.
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
  }
  if (m < 16 * 60 + 30) {
    return { name: "Afternoon", vn: "Ca Chiều", hue: "var(--coral-500)" };
  }
  return { name: "Evening", vn: "Ca Tối", hue: "var(--info-500)" };
}

export function getBlockColorStyles(block: ScheduleBlock): {
  bg: string;
  border: string;
  text: string;
  badgeBg: string;
  badgeText: string;
  accentBar: string;
  dot: string;
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
        bg: "bg-[var(--brand-50)]/70 hover:bg-[var(--brand-50)]",
        border: "border-[var(--brand-200)]",
        text: "text-[var(--ink-900)]",
        badgeBg: "bg-transparent",
        badgeText: "text-[var(--brand-700)]",
        accentBar: "bg-[var(--brand-500)]",
        dot: "bg-[var(--brand-500)]",
      };
    case "coral":
      return {
        bg: "bg-[var(--coral-100)]/50 hover:bg-[var(--coral-100)]/65",
        border: "border-[var(--coral-500)]/25",
        text: "text-[var(--ink-900)]",
        badgeBg: "bg-transparent",
        badgeText: "text-[var(--coral-700)]",
        accentBar: "bg-[var(--coral-500)]",
        dot: "bg-[var(--coral-500)]",
      };
    case "mint":
      return {
        bg: "bg-[var(--mint-100)]/45 hover:bg-[var(--mint-100)]/65",
        border: "border-[var(--mint-500)]/25",
        text: "text-[var(--ink-900)]",
        badgeBg: "bg-transparent",
        badgeText: "text-[var(--mint-700)]",
        accentBar: "bg-[var(--mint-500)]",
        dot: "bg-[var(--mint-500)]",
      };
    case "rose":
      return {
        bg: "bg-[var(--rose-100)]/45 hover:bg-[var(--rose-100)]/65",
        border: "border-[var(--rose-500)]/25",
        text: "text-[var(--ink-900)]",
        badgeBg: "bg-transparent",
        badgeText: "text-[var(--rose-700)]",
        accentBar: "bg-[var(--rose-500)]",
        dot: "bg-[var(--rose-500)]",
      };
    case "info":
      return {
        bg: "bg-[var(--info-100)]/50 hover:bg-[var(--info-100)]/65",
        border: "border-[var(--info-500)]/25",
        text: "text-[var(--ink-900)]",
        badgeBg: "bg-transparent",
        badgeText: "text-[var(--info-700)]",
        accentBar: "bg-[var(--info-500)]",
        dot: "bg-[var(--info-500)]",
      };
    case "warning":
      return {
        bg: "bg-[var(--warning-100)]/50 hover:bg-[var(--warning-100)]/65",
        border: "border-[var(--warning-500)]/25",
        text: "text-[var(--ink-900)]",
        badgeBg: "bg-transparent",
        badgeText: "text-[var(--warning-700)]",
        accentBar: "bg-[var(--warning-500)]",
        dot: "bg-[var(--warning-500)]",
      };
    default:
      return {
        bg: "bg-[var(--paper-50)] hover:bg-[var(--paper-100)]",
        border: "border-[var(--paper-200)]",
        text: "text-[var(--ink-900)]",
        badgeBg: "bg-transparent",
        badgeText: "text-[var(--ink-700)]",
        accentBar: "bg-[var(--ink-500)]",
        dot: "bg-[var(--ink-500)]",
      };
  }
}

/**
 * Return the exact visual rectangle for a schedule block. No visual spacing is
 * subtracted from the duration, so the lower edge lands on the true end-time
 * boundary (e.g. 09:30–11:30 ends exactly on the 11:30 line).
 */
export function getBlockPosition(
  startTime: string,
  endTime: string,
  windowStartMin: number,
  windowEndMin: number,
  rowHeight: number
): { top: number; height: number } {
  const start = Math.max(timeToMinutes(startTime), windowStartMin);
  const end = Math.min(timeToMinutes(endTime), windowEndMin);
  const duration = Math.max(0, end - start);
  return {
    top: ((start - windowStartMin) / 30) * rowHeight,
    height: (duration / 30) * rowHeight,
  };
}

/**
 * Convert inclusive dragged row indexes to an exclusive end-time range.
 * Selecting only the 09:30 row therefore means 09:30–10:00.
 */
export function selectionRangeFromSlots(
  anchorIndex: number,
  currentIndex: number,
  slots: string[]
): { startTime: string; endTime: string } {
  const maxRowIndex = Math.max(0, slots.length - 2);
  const a = Math.min(Math.max(anchorIndex, 0), maxRowIndex);
  const b = Math.min(Math.max(currentIndex, 0), maxRowIndex);
  const first = Math.min(a, b);
  const last = Math.max(a, b);
  return {
    startTime: slots[first],
    endTime: slots[last + 1],
  };
}

/**
 * Normalize a drag that starts inside one row and ends on a snapped time
 * boundary. The anchor row is always fully included, so a click remains a
 * single 30-minute selection while exact boundary releases never overshoot.
 */
export function selectionRangeFromDrag(
  anchorRowIndex: number,
  edgeBoundaryIndex: number,
  slots: string[]
): { startTime: string; endTime: string } {
  const maxRowIndex = Math.max(0, slots.length - 2);
  const maxBoundaryIndex = Math.max(1, slots.length - 1);
  const anchor = Math.min(Math.max(anchorRowIndex, 0), maxRowIndex);
  const edge = Math.min(Math.max(edgeBoundaryIndex, 0), maxBoundaryIndex);

  const startBoundary = edge <= anchor ? edge : anchor;
  const endBoundary = edge <= anchor ? anchor + 1 : Math.max(anchor + 1, edge);

  return {
    startTime: slots[startBoundary],
    endTime: slots[Math.min(endBoundary, slots.length - 1)],
  };
}

interface LayoutBlock extends ScheduleBlock {
  colIndex: number;
  totalCols: number;
}

function layoutCluster(cluster: ScheduleBlock[]): LayoutBlock[] {
  const columnEnds: number[] = [];
  const assigned = cluster.map((block) => {
    const start = timeToMinutes(block.startTime);
    let colIndex = columnEnds.findIndex((end) => end <= start);
    if (colIndex === -1) {
      colIndex = columnEnds.length;
      columnEnds.push(timeToMinutes(block.endTime));
    } else {
      columnEnds[colIndex] = timeToMinutes(block.endTime);
    }
    return { ...block, colIndex, totalCols: 1 };
  });

  const totalCols = Math.max(1, columnEnds.length);
  return assigned.map((block) => ({ ...block, totalCols }));
}

// Compute overlapping blocks using transitive overlap clusters. This keeps
// widths stable when A overlaps B and B overlaps C, even if A does not overlap C.
function layoutDayBlocks(blocks: ScheduleBlock[]): LayoutBlock[] {
  if (blocks.length === 0) return [];

  const sorted = [...blocks].sort((a, b) => {
    const startDiff = timeToMinutes(a.startTime) - timeToMinutes(b.startTime);
    if (startDiff !== 0) return startDiff;
    return timeToMinutes(a.endTime) - timeToMinutes(b.endTime);
  });

  const result: LayoutBlock[] = [];
  let cluster: ScheduleBlock[] = [];
  let clusterEnd = -Infinity;

  const flush = () => {
    if (cluster.length > 0) result.push(...layoutCluster(cluster));
    cluster = [];
    clusterEnd = -Infinity;
  };

  for (const block of sorted) {
    const start = timeToMinutes(block.startTime);
    const end = timeToMinutes(block.endTime);
    if (cluster.length > 0 && start >= clusterEnd) flush();
    cluster.push(block);
    clusterEnd = Math.max(clusterEnd, end);
  }
  flush();

  return result;
}

type DragSelection = {
  dayNum: number;
  anchorIndex: number;
  edgeBoundaryIndex: number;
  pointerId: number;
};

function daySummary(blocks: ScheduleBlock[]): string {
  if (blocks.length === 0) return "No classes";
  const minutes = blocks.reduce(
    (sum, block) => sum + Math.max(0, timeToMinutes(block.endTime) - timeToMinutes(block.startTime)),
    0
  );
  const hours = minutes / 60;
  const hoursText = Number.isInteger(hours) ? `${hours}h` : `${hours.toFixed(1)}h`;
  return `${blocks.length} ${blocks.length === 1 ? "session" : "sessions"} · ${hoursText}`;
}

function pointerRowIndex(
  event: ReactPointerEvent<HTMLDivElement>,
  rowHeight: number,
  rowCount: number
): number {
  const rect = event.currentTarget.getBoundingClientRect();
  const localY = Math.max(0, Math.min(rect.height - 1, event.clientY - rect.top));
  return Math.min(rowCount - 1, Math.max(0, Math.floor(localY / rowHeight)));
}

function pointerBoundaryIndex(
  event: ReactPointerEvent<HTMLDivElement>,
  rowHeight: number,
  boundaryCount: number
): number {
  const rect = event.currentTarget.getBoundingClientRect();
  const localY = Math.max(0, Math.min(rect.height, event.clientY - rect.top));
  return Math.min(boundaryCount - 1, Math.max(0, Math.round(localY / rowHeight)));
}

function timeBoundaryLabelTransform(index: number, lastIndex: number): string {
  if (index === 0) return "translateY(3px)";
  if (index === lastIndex) return "translateY(calc(-100% - 3px))";
  return "translateY(-50%)";
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
  onAddManualBlock?: (dayOfWeek: number, startTime?: string, endTime?: string) => void;
  onDeleteBlock?: (id: number) => void;
}) {
  const [selectedBlock, setSelectedBlock] = useState<ScheduleBlock | null>(null);
  const [dragSelection, setDragSelection] = useState<DragSelection | null>(null);

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

  const { startMin, endMin, displaySlots } = useMemo(() => {
    let s = timeToMinutes("07:30");
    let e = timeToMinutes("20:30");

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

  const dayLayouts = useMemo(() => {
    const map = new Map<number, LayoutBlock[]>();
    activeDays.forEach((d) => {
      const dayBlocks = blocks.filter((b) => {
        if (b.dayOfWeek !== d) return false;
        const bStart = timeToMinutes(b.startTime);
        const bEnd = timeToMinutes(b.endTime);
        return bStart < endMin && bEnd > startMin;
      });
      map.set(d, layoutDayBlocks(dayBlocks));
    });
    return map;
  }, [activeDays, blocks, startMin, endMin]);

  const todayDayOfWeek = useMemo(() => {
    const d = new Date().getDay();
    return d === 0 ? 7 : d;
  }, []);

  // 48px keeps the timetable dense, but every row still means exactly 30 minutes.
  const slotRowHeight = 48;
  const rowCount = Math.max(0, displaySlots.length - 1);
  const totalGridHeight = rowCount * slotRowHeight;

  function handleBlockClick(block: ScheduleBlock) {
    setSelectedBlock(block);
    onSelectBlock?.(block);
  }

  function beginSelection(dayNum: number, event: ReactPointerEvent<HTMLDivElement>) {
    if (!onAddManualBlock || event.button !== 0 || rowCount === 0) return;
    if ((event.target as HTMLElement).closest("[data-timetable-block='true']")) return;

    event.preventDefault();
    const index = pointerRowIndex(event, slotRowHeight, rowCount);
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragSelection({ dayNum, anchorIndex: index, edgeBoundaryIndex: index + 1, pointerId: event.pointerId });
  }

  function updateSelection(dayNum: number, event: ReactPointerEvent<HTMLDivElement>) {
    if (!dragSelection || dragSelection.dayNum !== dayNum || dragSelection.pointerId !== event.pointerId) return;
    const edgeBoundaryIndex = pointerBoundaryIndex(event, slotRowHeight, displaySlots.length);
    if (edgeBoundaryIndex !== dragSelection.edgeBoundaryIndex) {
      setDragSelection((current) => current ? { ...current, edgeBoundaryIndex } : current);
    }
  }

  function finishSelection(dayNum: number, event: ReactPointerEvent<HTMLDivElement>) {
    if (!dragSelection || dragSelection.dayNum !== dayNum || dragSelection.pointerId !== event.pointerId) return;
    const edgeBoundaryIndex = pointerBoundaryIndex(event, slotRowHeight, displaySlots.length);
    const range = selectionRangeFromDrag(dragSelection.anchorIndex, edgeBoundaryIndex, displaySlots);

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    setDragSelection(null);
    onAddManualBlock?.(dayNum, range.startTime, range.endTime);
  }

  function cancelSelection(event: ReactPointerEvent<HTMLDivElement>) {
    if (!dragSelection || dragSelection.pointerId !== event.pointerId) return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    setDragSelection(null);
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="overflow-hidden rounded-xl border border-[var(--paper-200)] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.025)]">
        <div className="overflow-x-auto">
          <div className="min-w-[900px]">
            {/* Editorial header: flat columns rather than a row of rounded dashboard cards. */}
            <div
              className="sticky top-0 z-30 grid border-b border-[var(--paper-200)] bg-white/95 backdrop-blur-md"
              style={{ gridTemplateColumns: `82px repeat(${activeDays.length}, minmax(0, 1fr))` }}
            >
              <div className="flex min-h-[70px] flex-col justify-end border-r border-[var(--paper-200)] px-3 pb-3">
                <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-[var(--ink-400)]">Time</span>
                <span className="mt-1 text-[10px] font-medium text-[var(--ink-500)]">30 min grid</span>
              </div>

              {activeDays.map((dayNum) => {
                const meta = DAY_METADATA[dayNum];
                const isToday = dayNum === todayDayOfWeek;
                const dayBlocks = dayLayouts.get(dayNum) || [];
                const dayDate = dayBlocks.find((b) => b.date)?.date;

                return (
                  <div
                    key={dayNum}
                    className={`min-h-[70px] border-r border-[var(--paper-200)] px-3.5 py-3 last:border-r-0 ${
                      isToday ? "bg-[var(--brand-50)]/40" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          {isToday && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--brand-500)]" />}
                          <span className="text-[9px] font-bold uppercase tracking-[0.14em] text-[var(--ink-400)]">
                            {meta.short}
                          </span>
                          {dayDate && (
                            <span className="text-[10px] font-semibold tabular-nums text-[var(--ink-500)]">{dayDate}</span>
                          )}
                        </div>
                        <h3 className="mt-1 text-[13px] font-semibold tracking-[-0.01em] text-[var(--ink-900)]">
                          {meta.en}
                        </h3>
                      </div>
                      <span className="pt-0.5 text-[10px] font-medium text-[var(--ink-400)]">{meta.vn}</span>
                    </div>
                    <p className="mt-1.5 text-[10.5px] font-medium text-[var(--ink-500)]">{daySummary(dayBlocks)}</p>
                  </div>
                );
              })}
            </div>

            <div className="relative flex" style={{ height: `${totalGridHeight}px` }}>
              {/* Time labels sit on boundaries, not in the middle of rows. */}
              <div className="relative z-20 w-[82px] shrink-0 border-r border-[var(--paper-200)] bg-[var(--paper-50)]/45 select-none">
                {displaySlots.map((timeStr, idx) => {
                  const minutes = timeToMinutes(timeStr);
                  const isHour = minutes % 60 === 0;
                  const isShiftBoundary = timeStr === "12:30" || timeStr === "16:30";
                  return (
                    <div key={timeStr}>
                      <div
                        className={`absolute left-3 right-0 border-t ${
                          isHour ? "border-[var(--paper-300)]" : "border-[var(--paper-200)]/85"
                        }`}
                        style={{ top: `${idx * slotRowHeight}px` }}
                      />
                      <div
                        className="absolute right-3 z-10 bg-[var(--paper-50)] px-1.5 tabular-nums"
                        style={{
                          top: `${idx * slotRowHeight}px`,
                          transform: timeBoundaryLabelTransform(idx, displaySlots.length - 1),
                        }}
                      >
                        <span
                          className={
                            isHour
                              ? "text-[11px] font-semibold text-[var(--ink-700)]"
                              : "text-[10px] font-medium text-[var(--ink-400)]"
                          }
                        >
                          {timeStr}
                        </span>
                      </div>
                      {isShiftBoundary && (
                        <span
                          className="absolute left-2 z-10 bg-[var(--paper-50)] px-1 text-[8px] font-bold uppercase tracking-[0.12em] text-[var(--ink-400)]"
                          style={{ top: `${idx * slotRowHeight + 7}px` }}
                        >
                          {getShiftForTime(timeStr).vn}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              <div
                className="relative grid flex-1"
                style={{ gridTemplateColumns: `repeat(${activeDays.length}, minmax(0, 1fr))` }}
              >
                {/* Exact shared time-boundary guides across all days. */}
                <div className="pointer-events-none absolute inset-0 z-0">
                  {displaySlots.map((timeStr, idx) => {
                    const isHour = timeToMinutes(timeStr) % 60 === 0;
                    return (
                      <div
                        key={`boundary-${timeStr}`}
                        className={`absolute inset-x-0 border-t ${
                          isHour ? "border-[var(--paper-300)]" : "border-[var(--paper-200)]/75"
                        }`}
                        style={{ top: `${idx * slotRowHeight}px` }}
                      />
                    );
                  })}
                </div>

                {activeDays.map((dayNum) => {
                  const dayBlocks = dayLayouts.get(dayNum) || [];
                  const isToday = dayNum === todayDayOfWeek;
                  const isDraggingHere = dragSelection?.dayNum === dayNum;
                  const selectionRange = isDraggingHere && dragSelection
                    ? selectionRangeFromDrag(dragSelection.anchorIndex, dragSelection.edgeBoundaryIndex, displaySlots)
                    : null;
                  const selectionStartBoundary = selectionRange
                    ? displaySlots.indexOf(selectionRange.startTime)
                    : 0;
                  const selectionEndBoundary = selectionRange
                    ? displaySlots.indexOf(selectionRange.endTime)
                    : 0;
                  const selectionRows = Math.max(0, selectionEndBoundary - selectionStartBoundary);

                  return (
                    <div
                      key={`col-${dayNum}`}
                      className={`relative h-full select-none border-r border-[var(--paper-200)] last:border-r-0 ${
                        isToday ? "bg-[var(--brand-50)]/15" : ""
                      } ${onAddManualBlock ? "cursor-crosshair" : ""}`}
                      onPointerDown={(event) => beginSelection(dayNum, event)}
                      onPointerMove={(event) => updateSelection(dayNum, event)}
                      onPointerUp={(event) => finishSelection(dayNum, event)}
                      onPointerCancel={cancelSelection}
                    >
                      {dayBlocks.length === 0 && !isDraggingHere && (
                        <div className="pointer-events-none absolute inset-x-0 top-4 text-center">
                          <span className="text-[10px] font-medium text-[var(--ink-300)]">No classes</span>
                        </div>
                      )}

                      {isDraggingHere && dragSelection && selectionRange && (
                        <div
                          className="pointer-events-none absolute inset-x-1.5 z-20 rounded-md border border-[var(--brand-400)] bg-[var(--brand-100)]/55 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.45)]"
                          style={{
                            top: `${selectionStartBoundary * slotRowHeight}px`,
                            height: `${selectionRows * slotRowHeight}px`,
                          }}
                        >
                          <div className="m-2 inline-flex items-center rounded-md border border-[var(--brand-200)] bg-white/92 px-2 py-1 text-[10px] font-semibold tabular-nums text-[var(--brand-700)] shadow-[0_1px_2px_rgba(15,23,42,0.05)]">
                            {selectionRange.startTime} – {selectionRange.endTime}
                          </div>
                        </div>
                      )}

                      {dayBlocks.map((block) => {
                        const bStart = Math.max(timeToMinutes(block.startTime), startMin);
                        const bEnd = Math.min(timeToMinutes(block.endTime), endMin);
                        const durationMins = bEnd - bStart;
                        if (durationMins <= 0) return null;

                        const { top: topOffset, height: blockHeight } = getBlockPosition(
                          block.startTime,
                          block.endTime,
                          startMin,
                          endMin,
                          slotRowHeight
                        );

                        const widthPct = 100 / block.totalCols;
                        const leftPct = block.colIndex * widthPct;
                        const styleTokens = getBlockColorStyles(block);
                        const isLab = block.locationType === "LAB" || block.room?.toUpperCase().includes("LAB");
                        const isOnline = block.locationType === "ONLINE" || block.room?.toUpperCase().includes("ONLINE");
                        const isCompact = blockHeight < 96;
                        const isVeryCompact = blockHeight < 68;

                        return (
                          <div
                            key={block.id}
                            data-timetable-block="true"
                            onPointerDown={(event) => event.stopPropagation()}
                            onClick={(event) => {
                              event.stopPropagation();
                              handleBlockClick(block);
                            }}
                            className={`group absolute z-10 overflow-hidden rounded-lg border shadow-[0_1px_2px_rgba(15,23,42,0.035)] transition-[box-shadow,background-color] duration-150 hover:shadow-[0_4px_14px_rgba(15,23,42,0.08)] ${styleTokens.bg} ${styleTokens.border} ${styleTokens.text}`}
                            style={{
                              top: `${topOffset}px`,
                              height: `${blockHeight}px`,
                              left: `calc(${leftPct}% + 4px)`,
                              width: `calc(${widthPct}% - 8px)`,
                            }}
                          >
                            <button
                              type="button"
                              className="flex h-full w-full cursor-pointer flex-col p-2.5 text-left"
                              title={`${block.subjectName || block.title} · ${block.startTime}–${block.endTime}`}
                            >
                              <div className="flex min-w-0 items-center gap-1.5">
                                <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${styleTokens.dot}`} />
                                {block.subjectCode && block.subjectCode !== "N/A" ? (
                                  <span className={`truncate text-[9.5px] font-bold uppercase tracking-[0.08em] ${styleTokens.badgeText}`}>
                                    {block.subjectCode}
                                  </span>
                                ) : (
                                  <span className="truncate text-[9.5px] font-bold uppercase tracking-[0.08em] text-[var(--ink-500)]">
                                    Manual
                                  </span>
                                )}
                                {block.group && block.group !== "N/A" && (
                                  <span className="truncate text-[9.5px] font-medium text-[var(--ink-500)]">· {block.group}</span>
                                )}
                              </div>

                              <p
                                className={`mt-2 font-semibold leading-[1.35] tracking-[-0.01em] text-[var(--ink-900)] ${
                                  isVeryCompact ? "line-clamp-1 text-[11px]" : isCompact ? "line-clamp-2 text-[11.5px]" : "line-clamp-3 text-[12px]"
                                }`}
                              >
                                {block.subjectName || block.title}
                              </p>

                              <div className="mt-auto min-w-0 pt-2">
                                <div className="flex items-center justify-between gap-2 border-t border-black/[0.055] pt-1.5">
                                  <span className="whitespace-nowrap text-[10px] font-semibold tabular-nums text-[var(--ink-700)]">
                                    {block.startTime}–{block.endTime}
                                  </span>
                                  {!isVeryCompact && (
                                    <span className="text-[9.5px] font-medium tabular-nums text-[var(--ink-500)]">
                                      {getDurationLabel(block.startTime, block.endTime)}
                                    </span>
                                  )}
                                </div>

                                {!isCompact && block.room && (
                                  <div className="mt-1.5 flex min-w-0 items-center gap-1 text-[9.5px] font-medium text-[var(--ink-500)]">
                                    {isLab ? (
                                      <Laptop className="h-3 w-3 shrink-0" />
                                    ) : isOnline ? (
                                      <ExternalLink className="h-3 w-3 shrink-0" />
                                    ) : (
                                      <MapPin className="h-3 w-3 shrink-0" />
                                    )}
                                    <span className="truncate">{block.room}</span>
                                  </div>
                                )}
                              </div>
                            </button>
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

      {onAddManualBlock && (
        <p className="px-1 text-[10.5px] text-[var(--ink-400)]">
          Drag vertically inside a day to select a time range. A short click creates one 30-minute slot.
        </p>
      )}

      {/* Session Details Modal */}
      {selectedBlock && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4 backdrop-blur-[2px] animate-in fade-in duration-150">
          <div className="w-full max-w-lg overflow-hidden rounded-xl border border-[var(--paper-200)] bg-white p-6 shadow-[0_24px_70px_rgba(15,23,42,0.18)]">
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${getBlockColorStyles(selectedBlock).dot}`} />
                  {selectedBlock.subjectCode && (
                    <span className={`text-[10px] font-bold uppercase tracking-[0.1em] ${getBlockColorStyles(selectedBlock).badgeText}`}>
                      {selectedBlock.subjectCode}
                    </span>
                  )}
                  <span className="text-[10px] font-medium uppercase tracking-[0.08em] text-[var(--ink-400)]">
                    {selectedBlock.source === "IMPORTED" ? "AAO import" : "Manual event"}
                  </span>
                </div>
                <h2 className="mt-2 text-lg font-semibold tracking-[-0.02em] text-[var(--ink-900)]">
                  {selectedBlock.subjectName || selectedBlock.title}
                </h2>
                <p className="mt-1 text-xs text-[var(--ink-500)]">
                  {DAY_METADATA[selectedBlock.dayOfWeek]?.en} ({DAY_METADATA[selectedBlock.dayOfWeek]?.vn})
                  {selectedBlock.date ? ` · ${selectedBlock.date}` : ""} · {getShiftForTime(selectedBlock.startTime).vn}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedBlock(null)}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[var(--ink-400)] transition-colors hover:bg-[var(--paper-100)] hover:text-[var(--ink-700)]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="divide-y divide-[var(--paper-200)] border-y border-[var(--paper-200)] text-xs">
              <div className="grid grid-cols-[110px_1fr] gap-3 py-3">
                <span className="text-[var(--ink-400)]">Time</span>
                <div className="flex items-center gap-2 font-semibold tabular-nums text-[var(--ink-800)]">
                  <Clock className="h-3.5 w-3.5 text-[var(--ink-400)]" />
                  {selectedBlock.startTime} – {selectedBlock.endTime}
                  <span className="font-medium text-[var(--ink-400)]">· {getDurationLabel(selectedBlock.startTime, selectedBlock.endTime)}</span>
                </div>
              </div>

              <div className="grid grid-cols-[110px_1fr] gap-3 py-3">
                <span className="text-[var(--ink-400)]">Room / facility</span>
                <div className="flex items-center gap-2 font-semibold text-[var(--ink-800)]">
                  <MapPin className="h-3.5 w-3.5 text-[var(--ink-400)]" />
                  <span className="truncate">{selectedBlock.room || "Campus room"}</span>
                </div>
              </div>

              {selectedBlock.group && (
                <div className="grid grid-cols-[110px_1fr] gap-3 py-3">
                  <span className="text-[var(--ink-400)]">Class group</span>
                  <div className="flex items-center gap-2 font-semibold text-[var(--ink-800)]">
                    <Users className="h-3.5 w-3.5 text-[var(--ink-400)]" />
                    {selectedBlock.group}
                  </div>
                </div>
              )}

              {selectedBlock.lecturerName && (
                <div className="grid grid-cols-[110px_1fr] gap-3 py-3">
                  <span className="text-[var(--ink-400)]">Instructor</span>
                  <div className="flex items-center gap-2 font-semibold text-[var(--ink-800)]">
                    <School className="h-3.5 w-3.5 text-[var(--ink-400)]" />
                    {selectedBlock.lecturerName}
                  </div>
                </div>
              )}
            </div>

            {selectedBlock.notes && (
              <p className="mt-4 text-xs leading-5 text-[var(--ink-500)]">
                <span className="font-semibold text-[var(--ink-700)]">Note · </span>
                {selectedBlock.notes}
              </p>
            )}

            <div className="mt-5 flex items-center justify-between">
              {selectedBlock.source === "MANUAL" && onDeleteBlock ? (
                <button
                  type="button"
                  onClick={() => {
                    onDeleteBlock(selectedBlock.id);
                    setSelectedBlock(null);
                  }}
                  className="flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-semibold text-[var(--danger-700)] transition-colors hover:bg-[var(--danger-100)]"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete event
                </button>
              ) : (
                <span className="text-[10.5px] text-[var(--ink-400)]">AAO synchronized schedule</span>
              )}

              <button
                type="button"
                onClick={() => setSelectedBlock(null)}
                className="rounded-lg bg-[var(--ink-900)] px-4 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90"
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
