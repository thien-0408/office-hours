// "use client";

// import { useMemo, useState } from "react";
// import {
//   CalendarDays,
//   Clock,
//   Laptop,
//   LayoutGrid,
//   ListFilter,
//   Plus,
//   Printer,
//   School,
//   X,
// } from "lucide-react";
// import { ConfirmModal } from "@/components/ConfirmModal";
// import { Card } from "@/components/dashboard/Card";
// import { FilterTabs } from "@/components/dashboard/FilterTabs";
// import { FormField, TextInput } from "@/components/dashboard/FormField";
// import {
//   type DayRangeFilter,
//   DAY_METADATA,
//   type ShiftFilter,
//   TIME_SLOTS_FULL,
//   timeToMinutes,
// } from "@/components/dashboard/TimetableGrid";
// import { TimetableAgenda } from "@/components/dashboard/TimetableAgenda";
// import { TimetableImport } from "@/components/dashboard/TimetableImport";
// import { useAuth } from "@/lib/auth/auth-context";
// import {
//   getMockMyScheduleImportHistory,
//   getMockScheduleBlocks,
//   getMockStudentScheduleBlocks,
// } from "@/lib/office-hours/mock-data";
// import type {
//   ParsedTimetableRow,
//   ScheduleBlock,
//   ScheduleImportHistoryEntry,
// } from "@/lib/office-hours/types";

// type PageTab = "VIEW" | "IMPORT";
// type ViewMode = "GRID" | "AGENDA";

// type ModernTimetableGridProps = {
//   blocks: ScheduleBlock[];
//   dayRange: DayRangeFilter;
//   shiftFilter: ShiftFilter;
//   onAddManualBlock: (dayNum: number, slotTime: string) => void;
//   onDeleteBlock: (id: number) => void;
// };

// type BlockPalette = {
//   bg: string;
//   border: string;
//   topLine: string;
//   chipBg: string;
//   chipText: string;
//   metaBg: string;
//   metaText: string;
// };

// const GRID_ROW_HEIGHT = 54;
// const FULL_WEEK_DAYS = [1, 2, 3, 4, 5, 6, 7] as const;
// const PALETTES: BlockPalette[] = [
//   {
//     bg: "#F6F8FF",
//     border: "#CFD9FF",
//     topLine: "linear-gradient(90deg, #5B7CFA 0%, #8EA4FF 100%)",
//     chipBg: "#E8EEFF",
//     chipText: "#3352C8",
//     metaBg: "rgba(91, 124, 250, 0.08)",
//     metaText: "#455A9C",
//   },
//   {
//     bg: "#FAF6FF",
//     border: "#DFCFFD",
//     topLine: "linear-gradient(90deg, #8B5CF6 0%, #B392FF 100%)",
//     chipBg: "#F0E8FF",
//     chipText: "#6840C6",
//     metaBg: "rgba(139, 92, 246, 0.08)",
//     metaText: "#685389",
//   },
//   {
//     bg: "#FFF7F2",
//     border: "#FFDABF",
//     topLine: "linear-gradient(90deg, #F28B43 0%, #F6B37A 100%)",
//     chipBg: "#FFECDD",
//     chipText: "#C2601B",
//     metaBg: "rgba(242, 139, 67, 0.10)",
//     metaText: "#8F5C35",
//   },
//   {
//     bg: "#F3FBF8",
//     border: "#CBECDD",
//     topLine: "linear-gradient(90deg, #33B07A 0%, #73D2A7 100%)",
//     chipBg: "#E2F7EE",
//     chipText: "#22885D",
//     metaBg: "rgba(51, 176, 122, 0.10)",
//     metaText: "#46745F",
//   },
//   {
//     bg: "#F9F7F2",
//     border: "#E8DECF",
//     topLine: "linear-gradient(90deg, #8E7A5E 0%, #B9A286 100%)",
//     chipBg: "#EFE9DD",
//     chipText: "#67543D",
//     metaBg: "rgba(142, 122, 94, 0.10)",
//     metaText: "#6D6252",
//   },
//   {
//     bg: "#F4F7FB",
//     border: "#D8E0EE",
//     topLine: "linear-gradient(90deg, #5E7A9D 0%, #8DA3BF 100%)",
//     chipBg: "#E7EEF7",
//     chipText: "#48627F",
//     metaBg: "rgba(94, 122, 157, 0.10)",
//     metaText: "#5B6E86",
//   },
// ];

// const SHIFT_WINDOWS: Record<ShiftFilter, { start: number; end: number }> = {
//   ALL: { start: timeToMinutes(TIME_SLOTS_FULL[0]), end: timeToMinutes(TIME_SLOTS_FULL[TIME_SLOTS_FULL.length - 1]) },
//   MORNING: { start: timeToMinutes("07:30"), end: timeToMinutes("12:30") },
//   AFTERNOON: { start: timeToMinutes("12:30"), end: timeToMinutes("16:30") },
//   EVENING: { start: timeToMinutes("16:30"), end: timeToMinutes(TIME_SLOTS_FULL[TIME_SLOTS_FULL.length - 1]) },
// };

// function getVisibleDays(dayRange: DayRangeFilter): number[] {
//   if (dayRange === "WORKDAYS") return [1, 2, 3, 4, 5];
//   if (dayRange === "PLUS_SAT") return [1, 2, 3, 4, 5, 6];
//   return [...FULL_WEEK_DAYS];
// }

// function getVisibleSlots(shiftFilter: ShiftFilter): string[] {
//   const range = SHIFT_WINDOWS[shiftFilter];
//   return TIME_SLOTS_FULL.filter((slot) => {
//     const minutes = timeToMinutes(slot);
//     return minutes >= range.start && minutes <= range.end;
//   });
// }

// function blockIntersectsShift(block: ScheduleBlock, shiftFilter: ShiftFilter): boolean {
//   if (shiftFilter === "ALL") return true;
//   const range = SHIFT_WINDOWS[shiftFilter];
//   const start = timeToMinutes(block.startTime);
//   const end = timeToMinutes(block.endTime);
//   return end > range.start && start < range.end;
// }

// function getCurrentDayNumber(): number {
//   const jsDay = new Date().getDay();
//   return jsDay === 0 ? 7 : jsDay;
// }

// function getBlockKey(block: ScheduleBlock): string {
//   return block.subjectCode || block.subjectName || block.title || String(block.id);
// }

// function hashString(value: string): number {
//   return value.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
// }

// function getPaletteForBlock(block: ScheduleBlock): BlockPalette {
//   const hash = hashString(getBlockKey(block));
//   return PALETTES[hash % PALETTES.length];
// }

// function getCodeLabel(block: ScheduleBlock): string {
//   if (block.subjectCode) return block.subjectCode;
//   const title = block.title || block.subjectName || "Event";
//   const codeMatch = title.match(/[A-Z]{2,}\s?\d{2,}/);
//   if (codeMatch) return codeMatch[0].replace(/\s+/g, " ");
//   const cleaned = title.replace(/[^A-Za-z0-9 ]/g, " ").trim();
//   if (!cleaned) return "EVENT";
//   return cleaned
//     .split(/\s+/)
//     .slice(0, 2)
//     .map((part) => part.slice(0, 3).toUpperCase())
//     .join(" ");
// }

// function getBlockTitle(block: ScheduleBlock): string {
//   return block.subjectName || block.title || "Untitled session";
// }

// function getDurationLabel(startTime: string, endTime: string): string {
//   const minutes = Math.max(0, timeToMinutes(endTime) - timeToMinutes(startTime));
//   if (minutes % 60 === 0) return `${minutes / 60}h`;
//   return `${(minutes / 60).toFixed(1)}h`;
// }

// function getDaySummary(blocks: ScheduleBlock[]): string {
//   if (blocks.length === 0) return "No classes";
//   const totalMinutes = blocks.reduce(
//     (sum, block) => sum + Math.max(0, timeToMinutes(block.endTime) - timeToMinutes(block.startTime)),
//     0
//   );
//   const hours = totalMinutes / 60;
//   const hourLabel = Number.isInteger(hours) ? `${hours}h` : `${hours.toFixed(1)}h`;
//   return `${blocks.length} ${blocks.length === 1 ? "session" : "sessions"} · ${hourLabel}`;
// }

// function formatAxisLabel(slot: string): string {
//   return slot;
// }

// function ModernTimetableGrid({
//   blocks,
//   dayRange,
//   shiftFilter,
//   onAddManualBlock,
//   onDeleteBlock,
// }: ModernTimetableGridProps) {
//   const visibleDays = useMemo(() => getVisibleDays(dayRange), [dayRange]);
//   const visibleSlots = useMemo(() => getVisibleSlots(shiftFilter), [shiftFilter]);
//   const currentDay = getCurrentDayNumber();

//   const filteredBlocks = useMemo(
//     () => blocks.filter((block) => visibleDays.includes(block.dayOfWeek) && blockIntersectsShift(block, shiftFilter)),
//     [blocks, visibleDays, shiftFilter]
//   );

//   const blocksByDay = useMemo(() => {
//     return visibleDays.reduce<Record<number, ScheduleBlock[]>>((acc, day) => {
//       acc[day] = filteredBlocks
//         .filter((block) => block.dayOfWeek === day)
//         .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
//       return acc;
//     }, {});
//   }, [filteredBlocks, visibleDays]);

//   const startMin = timeToMinutes(visibleSlots[0]);
//   const endMin = timeToMinutes(visibleSlots[visibleSlots.length - 1]);
//   const totalHeight = Math.max(1, visibleSlots.length - 1) * GRID_ROW_HEIGHT;

//   return (
//     <div className="overflow-x-auto">
//       <div className="min-w-[920px] px-4 py-4 sm:px-5 sm:py-5">
//         <div
//           className="grid gap-3"
//           style={{ gridTemplateColumns: `78px repeat(${visibleDays.length}, minmax(150px, 1fr))` }}
//         >
//           <div />
//           {visibleDays.map((dayNum) => {
//             const meta = DAY_METADATA[dayNum];
//             const dayBlocks = blocksByDay[dayNum] ?? [];
//             const isToday = dayNum === currentDay;
//             return (
//               <div
//                 key={`header-${dayNum}`}
//                 className={`rounded-2xl border px-4 py-3.5 transition-colors ${
//                   isToday
//                     ? "border-[var(--brand-200)] bg-[var(--brand-50)]/75"
//                     : dayBlocks.length === 0
//                       ? "border-[var(--paper-200)] bg-[var(--paper-50)]/55"
//                       : "border-[var(--paper-200)] bg-white"
//                 }`}
//               >
//                 <div className="flex items-start justify-between gap-3">
//                   <div className="min-w-0">
//                     <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--ink-400)]">
//                       {meta.en.slice(0, 3)} · {meta.vn}
//                     </p>
//                     <h3 className="mt-1 text-[15px] font-semibold tracking-[-0.01em] text-[var(--ink-900)]">
//                       {meta.en}
//                     </h3>
//                   </div>
//                   {isToday && (
//                     <span className="rounded-full bg-white px-2 py-1 text-[10px] font-semibold text-[var(--brand-700)] shadow-[0_1px_2px_rgba(15,23,42,0.05)]">
//                       Today
//                     </span>
//                   )}
//                 </div>
//                 <p className="mt-2 text-[11px] font-medium text-[var(--ink-500)]">{getDaySummary(dayBlocks)}</p>
//               </div>
//             );
//           })}
//         </div>

//         <div
//           className="mt-3 grid gap-3"
//           style={{ gridTemplateColumns: `78px repeat(${visibleDays.length}, minmax(150px, 1fr))` }}
//         >
//           <div className="relative rounded-2xl border border-[var(--paper-200)] bg-[var(--paper-50)]/55" style={{ height: totalHeight }}>
//             {visibleSlots.slice(0, -1).map((slot, index) => {
//               const top = index * GRID_ROW_HEIGHT;
//               const isWholeHour = slot.endsWith(":00");
//               return (
//                 <div
//                   key={`axis-${slot}`}
//                   className="absolute inset-x-0"
//                   style={{ top, height: GRID_ROW_HEIGHT }}
//                 >
//                   <div
//                     className={`absolute left-0 right-0 border-t ${
//                       isWholeHour ? "border-[var(--paper-300)]" : "border-[var(--paper-200)]/80"
//                     }`}
//                   />
//                   <div className="px-3 pt-1.5">
//                     <span
//                       className={`tabular-nums ${
//                         isWholeHour
//                           ? "text-[12px] font-semibold text-[var(--ink-700)]"
//                           : "text-[10px] font-medium text-[var(--ink-400)]"
//                       }`}
//                     >
//                       {formatAxisLabel(slot)}
//                     </span>
//                   </div>
//                 </div>
//               );
//             })}
//           </div>

//           {visibleDays.map((dayNum) => {
//             const dayBlocks = blocksByDay[dayNum] ?? [];
//             return (
//               <div
//                 key={`day-${dayNum}`}
//                 className={`relative overflow-hidden rounded-2xl border ${
//                   dayBlocks.length === 0
//                     ? "border-[var(--paper-200)] bg-[var(--paper-50)]/35"
//                     : "border-[var(--paper-200)] bg-white"
//                 }`}
//                 style={{ height: totalHeight }}
//               >
//                 {visibleSlots.slice(0, -1).map((slot, index) => {
//                   const isWholeHour = slot.endsWith(":00");
//                   return (
//                     <button
//                       key={`${dayNum}-${slot}`}
//                       type="button"
//                       onClick={() => onAddManualBlock(dayNum, slot)}
//                       className="absolute inset-x-0 text-left transition-colors hover:bg-[var(--brand-50)]/45"
//                       style={{ top: index * GRID_ROW_HEIGHT, height: GRID_ROW_HEIGHT }}
//                       aria-label={`Add event on ${DAY_METADATA[dayNum].en} at ${slot}`}
//                     >
//                       <div
//                         className={`absolute left-0 right-0 border-t ${
//                           isWholeHour ? "border-[var(--paper-300)]" : "border-[var(--paper-200)]/75"
//                         }`}
//                       />
//                     </button>
//                   );
//                 })}

//                 {dayBlocks.length === 0 && (
//                   <div className="absolute inset-x-4 top-6 rounded-2xl border border-dashed border-[var(--paper-200)] bg-white/70 px-4 py-3 text-center">
//                     <p className="text-[12px] font-medium text-[var(--ink-500)]">Free day</p>
//                     <p className="mt-1 text-[11px] text-[var(--ink-400)]">Click a slot to add something.</p>
//                   </div>
//                 )}

//                 {dayBlocks.map((block) => {
//                   const palette = getPaletteForBlock(block);
//                   const rawTop = ((timeToMinutes(block.startTime) - startMin) / 30) * GRID_ROW_HEIGHT;
//                   const rawHeight = ((timeToMinutes(block.endTime) - timeToMinutes(block.startTime)) / 30) * GRID_ROW_HEIGHT;
//                   const top = Math.max(4, rawTop + 4);
//                   const height = Math.max(74, rawHeight - 8);
//                   const clampedHeight = Math.min(height, totalHeight - top - 4);

//                   return (
//                     <article
//                       key={block.id}
//                       className="group absolute inset-x-2 overflow-hidden rounded-[18px] border shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-transform duration-150 hover:-translate-y-[1px]"
//                       style={{
//                         top,
//                         height: clampedHeight,
//                         backgroundColor: palette.bg,
//                         borderColor: palette.border,
//                       }}
//                     >
//                       <div className="absolute inset-x-0 top-0 h-[3px]" style={{ background: palette.topLine }} />

//                       <div className="flex h-full flex-col p-3">
//                         <div className="flex items-start justify-between gap-2">
//                           <div className="flex min-w-0 items-center gap-1.5">
//                             <span
//                               className="inline-flex items-center rounded-full px-2 py-1 text-[10px] font-semibold"
//                               style={{ backgroundColor: palette.chipBg, color: palette.chipText }}
//                             >
//                               {getCodeLabel(block)}
//                             </span>
//                             {block.group && (
//                               <span className="text-[10px] font-medium text-[var(--ink-500)]">Group {block.group}</span>
//                             )}
//                           </div>
//                           <button
//                             type="button"
//                             onClick={() => onDeleteBlock(block.id)}
//                             className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[var(--ink-400)] opacity-0 transition-all hover:bg-white/75 hover:text-[var(--ink-700)] group-hover:opacity-100"
//                             aria-label={`Delete ${getBlockTitle(block)}`}
//                           >
//                             <X className="h-3.5 w-3.5" />
//                           </button>
//                         </div>

//                         <div className="mt-3 min-h-0 flex-1">
//                           <h4
//                             className="text-[13.5px] font-semibold leading-5 text-[var(--ink-900)]"
//                             style={{
//                               display: "-webkit-box",
//                               WebkitBoxOrient: "vertical",
//                               WebkitLineClamp: clampedHeight < 96 ? 2 : 3,
//                               overflow: "hidden",
//                             }}
//                           >
//                             {getBlockTitle(block)}
//                           </h4>
//                         </div>

//                         <div className="mt-3 flex flex-wrap gap-1.5 text-[10.5px] font-medium">
//                           <span
//                             className="inline-flex items-center rounded-full px-2.5 py-1"
//                             style={{ backgroundColor: palette.metaBg, color: palette.metaText }}
//                           >
//                             {block.startTime}–{block.endTime}
//                           </span>
//                           <span
//                             className="inline-flex items-center rounded-full px-2.5 py-1"
//                             style={{ backgroundColor: palette.metaBg, color: palette.metaText }}
//                           >
//                             {getDurationLabel(block.startTime, block.endTime)}
//                           </span>
//                           {block.room && (
//                             <span
//                               className="inline-flex max-w-full items-center rounded-full px-2.5 py-1"
//                               style={{ backgroundColor: palette.metaBg, color: palette.metaText }}
//                             >
//                               <span className="truncate">{block.room}</span>
//                             </span>
//                           )}
//                         </div>
//                       </div>
//                     </article>
//                   );
//                 })}
//               </div>
//             );
//           })}
//         </div>
//       </div>
//     </div>
//   );
// }

// export default function SchedulePage() {
//   const { user } = useAuth();
//   const isStudent = user?.role === "STUDENT";

//   const [tab, setTab] = useState<PageTab>("VIEW");
//   const [viewMode, setViewMode] = useState<ViewMode>("GRID");
//   const [dayRange, setDayRange] = useState<DayRangeFilter>("PLUS_SAT");
//   const [shiftFilter, setShiftFilter] = useState<ShiftFilter>("ALL");

//   const [entries, setEntries] = useState<ScheduleBlock[]>(() =>
//     isStudent ? getMockStudentScheduleBlocks() : getMockScheduleBlocks()
//   );
//   const [history, setHistory] = useState<ScheduleImportHistoryEntry[]>(() =>
//     getMockMyScheduleImportHistory()
//   );

//   // Manual block modal state
//   const [isAddModalOpen, setIsAddModalOpen] = useState(false);
//   const [newTitle, setNewTitle] = useState("");
//   const [newDayOfWeek, setNewDayOfWeek] = useState<number>(1);
//   const [newStartTime, setNewStartTime] = useState("07:30");
//   const [newEndTime, setNewEndTime] = useState("09:30");
//   const [newRoom, setNewRoom] = useState("");
//   const [newNotes, setNewNotes] = useState("");

//   // Delete modal state
//   const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);

//   // Calculated Stats
//   const stats = useMemo(() => {
//     const totalSessions = entries.length;
//     let totalMinutes = 0;
//     let labCount = 0;
//     let onlineCount = 0;
//     let roomCount = 0;

//     entries.forEach((b) => {
//       const dur = timeToMinutes(b.endTime) - timeToMinutes(b.startTime);
//       if (dur > 0) totalMinutes += dur;

//       if (b.locationType === "LAB" || b.room?.toUpperCase().includes("LAB")) {
//         labCount++;
//       } else if (b.locationType === "ONLINE" || b.room?.toUpperCase().includes("ONLINE")) {
//         onlineCount++;
//       } else {
//         roomCount++;
//       }
//     });

//     const totalHours = (totalMinutes / 60).toFixed(1);

//     return {
//       totalSessions,
//       totalHours,
//       labCount,
//       onlineCount,
//       roomCount,
//     };
//   }, [entries]);

//   function handleOpenAddModal(dayNum?: number, slotTime?: string) {
//     if (dayNum) setNewDayOfWeek(dayNum);
//     if (slotTime) {
//       setNewStartTime(slotTime);
//       const slotMin = timeToMinutes(slotTime);
//       const endMin = slotMin + 120; // default 2h
//       const h = Math.floor(endMin / 60)
//         .toString()
//         .padStart(2, "0");
//       const m = (endMin % 60).toString().padStart(2, "0");
//       setNewEndTime(`${h}:${m}`);
//     }
//     setIsAddModalOpen(true);
//   }

//   function handleCreateManualBlock(e: React.FormEvent) {
//     e.preventDefault();
//     if (!newTitle.trim()) return;

//     const nextId = entries.length === 0 ? 1 : Math.max(...entries.map((b) => b.id)) + 1;
//     const isLab = newRoom.toUpperCase().includes("LAB");
//     const isOnline = newRoom.toUpperCase().includes("ONLINE");

//     const newBlock: ScheduleBlock = {
//       id: nextId,
//       title: newTitle.trim(),
//       subjectName: newTitle.trim(),
//       dayOfWeek: Number(newDayOfWeek),
//       startTime: newStartTime,
//       endTime: newEndTime,
//       room: newRoom.trim() || undefined,
//       locationType: isLab ? "LAB" : isOnline ? "ONLINE" : "ROOM",
//       source: "MANUAL",
//       notes: newNotes.trim() || undefined,
//     };

//     setEntries((prev) => [...prev, newBlock]);
//     setIsAddModalOpen(false);
//     setNewTitle("");
//     setNewRoom("");
//     setNewNotes("");
//   }

//   function handleDeleteBlock(id: number) {
//     setEntries((prev) => prev.filter((b) => b.id !== id));
//   }

//   const subtitle = isStudent
//     ? "A cleaner weekly timetable with calmer hierarchy, softer course cards, and less dashboard noise."
//     : "A cleaner weekly teaching timetable with calmer hierarchy, softer course cards, and less dashboard noise.";

//   return (
//     <div className="flex flex-col gap-7">
//       {/* Page Header */}
//       <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
//         <div className="max-w-2xl">
//           <div className="mb-2 flex items-center gap-2">
//             <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--ink-400)]">
//               Schedule
//             </span>
//             <span className="h-1 w-1 rounded-full bg-[var(--paper-300)]" />
//             <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[var(--ink-500)]">
//               <Clock className="h-3.5 w-3.5" />
//               Starts 07:30
//             </span>
//           </div>

//           <h1 className="text-2xl font-semibold tracking-[-0.02em] text-[var(--ink-900)] sm:text-[28px]">
//             {isStudent ? "My Class Schedule" : "My Teaching Schedule"}
//           </h1>
//           <p className="mt-1.5 text-sm leading-6 text-[var(--ink-500)]">{subtitle}</p>
//         </div>

//         {tab === "VIEW" && (
//           <div className="flex items-center gap-2">
//             <button
//               type="button"
//               onClick={() => window.print()}
//               className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[var(--paper-200)] bg-white px-3 text-xs font-semibold text-[var(--ink-700)] transition-colors hover:bg-[var(--paper-50)]"
//               title="Print or export timetable"
//             >
//               <Printer className="h-3.5 w-3.5" />
//               Print
//             </button>
//             <button
//               type="button"
//               onClick={() => handleOpenAddModal()}
//               className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[var(--brand-500)] px-3.5 text-xs font-bold text-white shadow-xs transition-colors hover:bg-[var(--brand-600)]"
//             >
//               <Plus className="h-4 w-4" />
//               Add event
//             </button>
//           </div>
//         )}
//       </div>

//       {/* Main Tab Switcher */}
//       <div className="w-fit">
//         <FilterTabs
//           options={[
//             { value: "VIEW" as PageTab, label: isStudent ? "Timetable" : "Teaching timetable" },
//             { value: "IMPORT" as PageTab, label: "Import AAO PDF" },
//           ]}
//           value={tab}
//           onChange={setTab}
//         />
//       </div>

//       {tab === "VIEW" && (
//         <div className="flex flex-col gap-4">
//           {/* Compact weekly summary */}
//           <div className="grid grid-cols-2 overflow-hidden rounded-xl border border-[var(--paper-200)] bg-white sm:grid-cols-4">
//             <div className="flex min-h-[74px] items-center gap-3 border-b border-r border-[var(--paper-200)] px-4 py-3 sm:border-b-0">
//               <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--brand-50)] text-[var(--brand-600)]">
//                 <Clock className="h-4 w-4" />
//               </div>
//               <div className="min-w-0">
//                 <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--ink-400)]">Weekly load</p>
//                 <p className="mt-0.5 text-[17px] font-semibold tracking-tight text-[var(--ink-900)] tabular-nums">
//                   {stats.totalHours} <span className="text-[11px] font-medium text-[var(--ink-400)]">hours</span>
//                 </p>
//               </div>
//             </div>

//             <div className="flex min-h-[74px] items-center gap-3 border-b border-[var(--paper-200)] px-4 py-3 sm:border-b-0 sm:border-r">
//               <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--coral-100)] text-[var(--coral-600)]">
//                 <CalendarDays className="h-4 w-4" />
//               </div>
//               <div className="min-w-0">
//                 <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--ink-400)]">Sessions</p>
//                 <p className="mt-0.5 text-[17px] font-semibold tracking-tight text-[var(--ink-900)] tabular-nums">
//                   {stats.totalSessions} <span className="text-[11px] font-medium text-[var(--ink-400)]">classes</span>
//                 </p>
//               </div>
//             </div>

//             <div className="flex min-h-[74px] items-center gap-3 border-r border-[var(--paper-200)] px-4 py-3">
//               <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--info-100)] text-[var(--info-600)]">
//                 <Laptop className="h-4 w-4" />
//               </div>
//               <div className="min-w-0">
//                 <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--ink-400)]">Labs</p>
//                 <p className="mt-0.5 text-[17px] font-semibold tracking-tight text-[var(--ink-900)] tabular-nums">
//                   {stats.labCount} <span className="text-[11px] font-medium text-[var(--ink-400)]">sessions</span>
//                 </p>
//               </div>
//             </div>

//             <div className="flex min-h-[74px] items-center gap-3 px-4 py-3">
//               <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--mint-100)] text-[var(--mint-600)]">
//                 <School className="h-4 w-4" />
//               </div>
//               <div className="min-w-0">
//                 <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--ink-400)]">Lecture / online</p>
//                 <p className="mt-0.5 text-[17px] font-semibold tracking-tight text-[var(--ink-900)] tabular-nums">
//                   {stats.roomCount + stats.onlineCount} <span className="text-[11px] font-medium text-[var(--ink-400)]">sessions</span>
//                 </p>
//               </div>
//             </div>
//           </div>

//           {/* Calm utility bar */}
//           <div className="flex flex-col gap-3 rounded-xl border border-[var(--paper-200)] bg-[var(--paper-50)]/70 p-2.5 lg:flex-row lg:items-center lg:justify-between">
//             <div className="flex items-center gap-2">
//               <span className="hidden pl-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--ink-400)] sm:inline">
//                 Layout
//               </span>
//               <div className="flex rounded-lg border border-[var(--paper-200)] bg-white p-0.5">
//                 <button
//                   type="button"
//                   onClick={() => setViewMode("GRID")}
//                   className={`flex h-8 items-center gap-1.5 rounded-md px-3 text-xs font-semibold transition-colors ${
//                     viewMode === "GRID"
//                       ? "bg-[var(--ink-900)] text-white"
//                       : "text-[var(--ink-500)] hover:bg-[var(--paper-50)] hover:text-[var(--ink-900)]"
//                   }`}
//                 >
//                   <LayoutGrid className="h-3.5 w-3.5" />
//                   Week
//                 </button>
//                 <button
//                   type="button"
//                   onClick={() => setViewMode("AGENDA")}
//                   className={`flex h-8 items-center gap-1.5 rounded-md px-3 text-xs font-semibold transition-colors ${
//                     viewMode === "AGENDA"
//                       ? "bg-[var(--ink-900)] text-white"
//                       : "text-[var(--ink-500)] hover:bg-[var(--paper-50)] hover:text-[var(--ink-900)]"
//                   }`}
//                 >
//                   <ListFilter className="h-3.5 w-3.5" />
//                   Agenda
//                 </button>
//               </div>
//             </div>

//             <div className="flex flex-wrap items-center gap-2.5">
//               <div className="flex items-center gap-1.5">
//                 <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--ink-400)]">Days</span>
//                 <FilterTabs
//                   options={[
//                     { value: "WORKDAYS" as DayRangeFilter, label: "Mon–Fri" },
//                     { value: "PLUS_SAT" as DayRangeFilter, label: "Mon–Sat" },
//                     { value: "FULL_WEEK" as DayRangeFilter, label: "7 days" },
//                   ]}
//                   value={dayRange}
//                   onChange={setDayRange}
//                 />
//               </div>

//               {viewMode === "GRID" && (
//                 <div className="flex items-center gap-1.5">
//                   <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--ink-400)]">Shift</span>
//                   <FilterTabs
//                     options={[
//                       { value: "ALL" as ShiftFilter, label: "All" },
//                       { value: "MORNING" as ShiftFilter, label: "Morning" },
//                       { value: "AFTERNOON" as ShiftFilter, label: "Afternoon" },
//                       { value: "EVENING" as ShiftFilter, label: "Evening" },
//                     ]}
//                     value={shiftFilter}
//                     onChange={setShiftFilter}
//                   />
//                 </div>
//               )}
//             </div>
//           </div>

//           {/* Timetable Body */}
//           {entries.length === 0 ? (
//             <Card className="border-dashed py-14 text-center">
//               <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--paper-100)] text-[var(--ink-400)]">
//                 <School className="h-5 w-5" />
//               </div>
//               <p className="text-sm font-semibold text-[var(--ink-800)]">No schedule blocks yet</p>
//               <p className="mx-auto mb-4 mt-1 max-w-sm text-xs leading-5 text-[var(--ink-500)]">
//                 Import the official AAO timetable or add a manual event to start building your week.
//               </p>
//               <button
//                 type="button"
//                 onClick={() => setTab("IMPORT")}
//                 className="rounded-lg bg-[var(--ink-900)] px-4 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90"
//               >
//                 Import AAO PDF
//               </button>
//             </Card>
//           ) : (
//             <section className="overflow-hidden rounded-2xl border border-[var(--paper-200)] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
//               <div className="flex flex-col gap-1 border-b border-[var(--paper-200)] px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
//                 <div>
//                   <h2 className="text-sm font-semibold tracking-[-0.01em] text-[var(--ink-900)]">
//                     {viewMode === "GRID" ? "Weekly timetable" : "Agenda"}
//                   </h2>
//                   <p className="mt-0.5 text-[11px] text-[var(--ink-400)]">
//                     {viewMode === "GRID"
//                       ? "Cleaner day cards, calmer course surfaces, and click-to-add empty slots."
//                       : "Your classes ordered by day and time."}
//                   </p>
//                 </div>
//                 <span className="text-[11px] font-medium text-[var(--ink-400)] tabular-nums">
//                   {stats.totalSessions} sessions · {stats.totalHours}h
//                 </span>
//               </div>

//               <div className="bg-[var(--bg-surface)]">
//                 {viewMode === "GRID" ? (
//                   <ModernTimetableGrid
//                     blocks={entries}
//                     dayRange={dayRange}
//                     shiftFilter={shiftFilter}
//                     onAddManualBlock={(dayNum, slotTime) => handleOpenAddModal(dayNum, slotTime)}
//                     onDeleteBlock={(id) => setPendingDeleteId(id)}
//                   />
//                 ) : (
//                   <TimetableAgenda
//                     blocks={entries}
//                     dayRange={dayRange}
//                     onAddManualBlock={(dayNum) => handleOpenAddModal(dayNum)}
//                     onDeleteBlock={(id) => setPendingDeleteId(id)}
//                   />
//                 )}
//               </div>
//             </section>
//           )}
//         </div>
//       )}

//       {tab === "IMPORT" && (
//         <TimetableImport
//           entries={entries}
//           setEntries={setEntries}
//           history={history}
//           setHistory={setHistory}
//           heading="Upload your AAO Timetable PDF"
//           description="Parses your official EIU AAO 'lịch học' export starting from 07:30 AM entirely in your browser — detects course codes, section groups, rooms, and shift clusters."
//           buildEntry={(row: ParsedTimetableRow, dayOfWeek: number, id: number): ScheduleBlock => {
//             const isLab = row.room.toUpperCase().includes("LAB");
//             const isOnline = row.room.toUpperCase().includes("ONLINE");
//             return {
//               id,
//               title: row.subjectCode !== "N/A" ? `${row.subjectName} (${row.subjectCode})` : row.subjectName,
//               subjectCode: row.subjectCode !== "N/A" ? row.subjectCode : undefined,
//               subjectName: row.subjectName,
//               group: row.group !== "N/A" ? row.group : undefined,
//               room: row.room,
//               lecturerName: row.lecturerName !== "Chưa rõ" ? row.lecturerName : undefined,
//               locationType: isLab ? "LAB" : isOnline ? "ONLINE" : "ROOM",
//               dayOfWeek,
//               date: row.date ?? undefined,
//               startTime: row.startTime,
//               endTime: row.endTime,
//               source: "IMPORTED",
//             };
//           }}
//         />
//       )}

//       {/* Add Manual Event Modal */}
//       {isAddModalOpen && (
//         <div className="animate-in fade-in fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 duration-150 backdrop-blur-[2px]">
//           <div className="w-full max-w-md overflow-hidden rounded-2xl border border-[var(--paper-200)] bg-white p-6 shadow-[0_24px_70px_rgba(15,23,42,0.18)]">
//             <div className="mb-4 flex items-center justify-between">
//               <h2 className="text-base font-bold text-[var(--ink-900)]">Add Schedule Event</h2>
//               <button
//                 type="button"
//                 onClick={() => setIsAddModalOpen(false)}
//                 className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--ink-400)] transition-colors hover:bg-[var(--paper-100)]"
//               >
//                 <X className="w-4 h-4" />
//               </button>
//             </div>

//             <form onSubmit={handleCreateManualBlock} className="flex flex-col gap-4">
//               <FormField label="Event Title / Subject">
//                 <TextInput
//                   value={newTitle}
//                   onChange={(e) => setNewTitle(e.target.value)}
//                   placeholder="e.g. Department Committee, Thesis Defense"
//                   required
//                 />
//               </FormField>

//               <div className="flex flex-col gap-1.5">
//                 <span className="text-[12.5px] font-semibold text-[var(--ink-700)]">Day of Week</span>
//                 <select
//                   value={newDayOfWeek}
//                   onChange={(e) => setNewDayOfWeek(Number(e.target.value))}
//                   className="rounded-xl border border-[var(--paper-200)] bg-white px-3.5 py-2 text-sm text-[var(--ink-900)] outline-none focus:ring-2 focus:ring-[var(--brand-300)]"
//                 >
//                   {Object.entries(DAY_METADATA).map(([num, meta]) => (
//                     <option key={num} value={num}>
//                       {meta.en} ({meta.vn})
//                     </option>
//                   ))}
//                 </select>
//               </div>

//               <div className="grid grid-cols-2 gap-3">
//                 <FormField label="Start Time">
//                   <select
//                     value={newStartTime}
//                     onChange={(e) => setNewStartTime(e.target.value)}
//                     className="rounded-xl border border-[var(--paper-200)] bg-white px-3 py-2 text-sm text-[var(--ink-900)] outline-none focus:ring-2 focus:ring-[var(--brand-300)] tabular-nums"
//                   >
//                     {TIME_SLOTS_FULL.slice(0, -1).map((t) => (
//                       <option key={t} value={t}>
//                         {t}
//                       </option>
//                     ))}
//                   </select>
//                 </FormField>

//                 <FormField label="End Time">
//                   <select
//                     value={newEndTime}
//                     onChange={(e) => setNewEndTime(e.target.value)}
//                     className="rounded-xl border border-[var(--paper-200)] bg-white px-3 py-2 text-sm text-[var(--ink-900)] outline-none focus:ring-2 focus:ring-[var(--brand-300)] tabular-nums"
//                   >
//                     {TIME_SLOTS_FULL.slice(1).map((t) => (
//                       <option key={t} value={t}>
//                         {t}
//                       </option>
//                     ))}
//                   </select>
//                 </FormField>
//               </div>

//               <FormField label="Room / Facility (Optional)">
//                 <TextInput
//                   value={newRoom}
//                   onChange={(e) => setNewRoom(e.target.value)}
//                   placeholder="e.g. Boardroom B02, Room 402, Online"
//                 />
//               </FormField>

//               <FormField label="Notes (Optional)">
//                 <TextInput
//                   value={newNotes}
//                   onChange={(e) => setNewNotes(e.target.value)}
//                   placeholder="e.g. Capstone defense evaluation panel"
//                 />
//               </FormField>

//               <div className="flex items-center justify-end gap-2 border-t border-[var(--paper-200)] pt-3">
//                 <button
//                   type="button"
//                   onClick={() => setIsAddModalOpen(false)}
//                   className="rounded-lg px-4 py-2 text-xs font-semibold text-[var(--ink-600)] transition-colors hover:bg-[var(--paper-100)]"
//                 >
//                   Cancel
//                 </button>
//                 <button
//                   type="submit"
//                   className="rounded-lg bg-[var(--brand-500)] px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-[var(--brand-600)]"
//                 >
//                   Add Block
//                 </button>
//               </div>
//             </form>
//           </div>
//         </div>
//       )}

//       {/* Delete Confirmation Modal */}
//       <ConfirmModal
//         open={pendingDeleteId !== null}
//         title="Delete this schedule block?"
//         description="This will remove the event from your timetable view. Students will be able to book slots during this window."
//         confirmLabel="Delete"
//         cancelLabel="Cancel"
//         onCancel={() => setPendingDeleteId(null)}
//         onConfirm={() => {
//           if (pendingDeleteId) handleDeleteBlock(pendingDeleteId);
//           setPendingDeleteId(null);
//         }}
//       />
//     </div>
//   );
// }
"use client";

import { useMemo, useState } from "react";
import {
  CalendarDays,
  Clock,
  Laptop,
  LayoutGrid,
  ListFilter,
  Plus,
  Printer,
  School,
  X,
} from "lucide-react";
import { ConfirmModal } from "@/components/ConfirmModal";
import { Card } from "@/components/dashboard/Card";
import { FilterTabs } from "@/components/dashboard/FilterTabs";
import { FormField, TextInput } from "@/components/dashboard/FormField";
import {
  type DayRangeFilter,
  DAY_METADATA,
  type ShiftFilter,
  TimetableGrid,
  TIME_SLOTS_FULL,
  timeToMinutes,
} from "@/components/dashboard/TimetableGrid";
import { TimetableAgenda } from "@/components/dashboard/TimetableAgenda";
import { TimetableImport } from "@/components/dashboard/TimetableImport";
import { useAuth } from "@/lib/auth/auth-context";
import {
  getMockMyScheduleImportHistory,
  getMockScheduleBlocks,
  getMockStudentScheduleBlocks,
} from "@/lib/office-hours/mock-data";
import type {
  ParsedTimetableRow,
  ScheduleBlock,
  ScheduleImportHistoryEntry,
} from "@/lib/office-hours/types";
import { useI18n } from "@/i18n/provider";
import { NativeSelect } from "@/components/ui/native-select";
import { Button } from "@/components/ui/button";

type PageTab = "VIEW" | "IMPORT";
type ViewMode = "GRID" | "AGENDA";

export default function SchedulePage() {
  const { user } = useAuth();
  const { t } = useI18n();
  const isStudent = user?.role === "STUDENT";

  const [tab, setTab] = useState<PageTab>("VIEW");
  const [viewMode, setViewMode] = useState<ViewMode>("GRID");
  const [dayRange, setDayRange] = useState<DayRangeFilter>("PLUS_SAT");
  const [shiftFilter, setShiftFilter] = useState<ShiftFilter>("ALL");

  const [entries, setEntries] = useState<ScheduleBlock[]>(() =>
    isStudent ? getMockStudentScheduleBlocks() : getMockScheduleBlocks()
  );
  const [history, setHistory] = useState<ScheduleImportHistoryEntry[]>(() =>
    getMockMyScheduleImportHistory()
  );

  // Manual block modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDayOfWeek, setNewDayOfWeek] = useState<number>(1);
  const [newStartTime, setNewStartTime] = useState("07:30");
  const [newEndTime, setNewEndTime] = useState("09:30");
  const [newRoom, setNewRoom] = useState("");
  const [newNotes, setNewNotes] = useState("");

  // Delete modal state
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);

  // Calculated Stats
  const stats = useMemo(() => {
    const totalSessions = entries.length;
    let totalMinutes = 0;
    let labCount = 0;
    let onlineCount = 0;
    let roomCount = 0;

    entries.forEach((b) => {
      const dur = timeToMinutes(b.endTime) - timeToMinutes(b.startTime);
      if (dur > 0) totalMinutes += dur;

      if (b.locationType === "LAB" || b.room?.toUpperCase().includes("LAB")) {
        labCount++;
      } else if (b.locationType === "ONLINE" || b.room?.toUpperCase().includes("ONLINE")) {
        onlineCount++;
      } else {
        roomCount++;
      }
    });

    const totalHours = (totalMinutes / 60).toFixed(1);

    return {
      totalSessions,
      totalHours,
      labCount,
      onlineCount,
      roomCount,
    };
  }, [entries]);

  function handleOpenAddModal(dayNum?: number, slotTime?: string, endTime?: string) {
    if (dayNum) setNewDayOfWeek(dayNum);
    if (slotTime) {
      setNewStartTime(slotTime);

      if (endTime) {
        // Drag selection from TimetableGrid provides an exact end boundary.
        setNewEndTime(endTime);
      } else {
        // Toolbar / agenda add keeps the previous convenient 2-hour default.
        const slotMin = timeToMinutes(slotTime);
        const endMin = slotMin + 120;
        const h = Math.floor(endMin / 60)
          .toString()
          .padStart(2, "0");
        const m = (endMin % 60).toString().padStart(2, "0");
        setNewEndTime(`${h}:${m}`);
      }
    }
    setIsAddModalOpen(true);
  }

  function handleCreateManualBlock(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const nextId = entries.length === 0 ? 1 : Math.max(...entries.map((b) => b.id)) + 1;
    const isLab = newRoom.toUpperCase().includes("LAB");
    const isOnline = newRoom.toUpperCase().includes("ONLINE");

    const newBlock: ScheduleBlock = {
      id: nextId,
      title: newTitle.trim(),
      subjectName: newTitle.trim(),
      dayOfWeek: Number(newDayOfWeek),
      startTime: newStartTime,
      endTime: newEndTime,
      room: newRoom.trim() || undefined,
      locationType: isLab ? "LAB" : isOnline ? "ONLINE" : "ROOM",
      source: "MANUAL",
      notes: newNotes.trim() || undefined,
    };

    setEntries((prev) => [...prev, newBlock]);
    setIsAddModalOpen(false);
    setNewTitle("");
    setNewRoom("");
    setNewNotes("");
  }

  function handleDeleteBlock(id: number) {
    setEntries((prev) => prev.filter((b) => b.id !== id));
  }

  const subtitle = isStudent ? t("schedule.studentSubtitle") : t("schedule.lecturerSubtitle");

  return (
    <div className="flex flex-col gap-7">
      {/* Page Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <div className="mb-2 flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--ink-400)]">
              {t("nav.schedule")}
            </span>
            <span className="h-1 w-1 rounded-full bg-[var(--paper-300)]" />
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[var(--ink-500)]">
              <Clock className="h-3.5 w-3.5" />
              Starts 07:30
            </span>
          </div>

          <h1 className="text-2xl font-semibold tracking-[-0.02em] text-[var(--ink-900)] sm:text-[28px]">
            {isStudent ? t("schedule.studentTitle") : t("schedule.lecturerTitle")}
          </h1>
          <p className="mt-1.5 text-sm leading-6 text-[var(--ink-500)]">{subtitle}</p>
        </div>

        {tab === "VIEW" && (
          <div className="flex items-center gap-2">
            <Button variant="outline"
              type="button"
              onClick={() => window.print()}
              className="h-9"
              title="Print or export timetable"
            >
              <Printer className="h-3.5 w-3.5" />
              {t("schedule.print")}
            </Button>
            <Button
              type="button"
              onClick={() => handleOpenAddModal()}
              className="h-9"
            >
              <Plus className="h-4 w-4" />
              {t("schedule.addEvent")}
            </Button>
          </div>
        )}
      </div>

      {/* Main Tab Switcher */}
      <div className="w-fit">
        <FilterTabs
          options={[
            { value: "VIEW" as PageTab, label: isStudent ? "Timetable" : "Teaching timetable" },
            { value: "IMPORT" as PageTab, label: "Import AAO PDF" },
          ]}
          value={tab}
          onChange={setTab}
        />
      </div>

      {tab === "VIEW" && (
        <div className="flex flex-col gap-4">
          {/* Compact weekly summary */}
          <div className="grid grid-cols-2 overflow-hidden rounded-xl border border-[var(--paper-200)] bg-white sm:grid-cols-4">
            <div className="flex min-h-[74px] items-center gap-3 border-b border-r border-[var(--paper-200)] px-4 py-3 sm:border-b-0">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--brand-50)] text-[var(--brand-600)]">
                <Clock className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--ink-400)]">Weekly load</p>
                <p className="mt-0.5 text-[17px] font-semibold tracking-tight text-[var(--ink-900)] tabular-nums">
                  {stats.totalHours} <span className="text-[11px] font-medium text-[var(--ink-400)]">hours</span>
                </p>
              </div>
            </div>

            <div className="flex min-h-[74px] items-center gap-3 border-b border-[var(--paper-200)] px-4 py-3 sm:border-b-0 sm:border-r">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--coral-100)] text-[var(--coral-600)]">
                <CalendarDays className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--ink-400)]">Sessions</p>
                <p className="mt-0.5 text-[17px] font-semibold tracking-tight text-[var(--ink-900)] tabular-nums">
                  {stats.totalSessions} <span className="text-[11px] font-medium text-[var(--ink-400)]">classes</span>
                </p>
              </div>
            </div>

            <div className="flex min-h-[74px] items-center gap-3 border-r border-[var(--paper-200)] px-4 py-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--info-100)] text-[var(--info-600)]">
                <Laptop className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--ink-400)]">Labs</p>
                <p className="mt-0.5 text-[17px] font-semibold tracking-tight text-[var(--ink-900)] tabular-nums">
                  {stats.labCount} <span className="text-[11px] font-medium text-[var(--ink-400)]">sessions</span>
                </p>
              </div>
            </div>

            <div className="flex min-h-[74px] items-center gap-3 px-4 py-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--mint-100)] text-[var(--mint-600)]">
                <School className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--ink-400)]">Lecture / online</p>
                <p className="mt-0.5 text-[17px] font-semibold tracking-tight text-[var(--ink-900)] tabular-nums">
                  {stats.roomCount + stats.onlineCount} <span className="text-[11px] font-medium text-[var(--ink-400)]">sessions</span>
                </p>
              </div>
            </div>
          </div>

          {/* Calm utility bar */}
          <div className="flex flex-col gap-3 rounded-xl border border-[var(--paper-200)] bg-[var(--paper-50)]/70 p-2.5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-2">
              <span className="hidden pl-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--ink-400)] sm:inline">
                Layout
              </span>
              <div className="flex rounded-lg border border-[var(--paper-200)] bg-white p-0.5">
                <button
                  type="button"
                  onClick={() => setViewMode("GRID")}
                  className={`flex h-8 items-center gap-1.5 rounded-md px-3 text-xs font-semibold transition-colors ${
                    viewMode === "GRID"
                      ? "bg-[var(--ink-900)] text-white"
                      : "text-[var(--ink-500)] hover:bg-[var(--paper-50)] hover:text-[var(--ink-900)]"
                  }`}
                >
                  <LayoutGrid className="h-3.5 w-3.5" />
                  Week
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("AGENDA")}
                  className={`flex h-8 items-center gap-1.5 rounded-md px-3 text-xs font-semibold transition-colors ${
                    viewMode === "AGENDA"
                      ? "bg-[var(--ink-900)] text-white"
                      : "text-[var(--ink-500)] hover:bg-[var(--paper-50)] hover:text-[var(--ink-900)]"
                  }`}
                >
                  <ListFilter className="h-3.5 w-3.5" />
                  Agenda
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--ink-400)]">Days</span>
                <FilterTabs
                  options={[
                    { value: "WORKDAYS" as DayRangeFilter, label: "Mon–Fri" },
                    { value: "PLUS_SAT" as DayRangeFilter, label: "Mon–Sat" },
                    { value: "FULL_WEEK" as DayRangeFilter, label: "7 days" },
                  ]}
                  value={dayRange}
                  onChange={setDayRange}
                />
              </div>

              {viewMode === "GRID" && (
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--ink-400)]">Shift</span>
                  <FilterTabs
                    options={[
                      { value: "ALL" as ShiftFilter, label: "All" },
                      { value: "MORNING" as ShiftFilter, label: "Morning" },
                      { value: "AFTERNOON" as ShiftFilter, label: "Afternoon" },
                      { value: "EVENING" as ShiftFilter, label: "Evening" },
                    ]}
                    value={shiftFilter}
                    onChange={setShiftFilter}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Timetable Body */}
          {entries.length === 0 ? (
            <Card className="border-dashed py-14 text-center">
              <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--paper-100)] text-[var(--ink-400)]">
                <School className="h-5 w-5" />
              </div>
              <p className="text-sm font-semibold text-[var(--ink-800)]">No schedule blocks yet</p>
              <p className="mx-auto mb-4 mt-1 max-w-sm text-xs leading-5 text-[var(--ink-500)]">
                Import the official AAO timetable or add a manual event to start building your week.
              </p>
              <button
                type="button"
                onClick={() => setTab("IMPORT")}
                className="rounded-lg bg-[var(--ink-900)] px-4 py-2 text-xs font-semibold text-white transition-opacity hover:opacity-90"
              >
                Import AAO PDF
              </button>
            </Card>
          ) : (
            <section className="overflow-hidden rounded-2xl border border-[var(--paper-200)] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.03)]">
              <div className="flex flex-col gap-1 border-b border-[var(--paper-200)] px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-sm font-semibold tracking-[-0.01em] text-[var(--ink-900)]">
                    {viewMode === "GRID" ? "Weekly timetable" : "Agenda"}
                  </h2>
                  <p className="mt-0.5 text-[11px] text-[var(--ink-400)]">
                    {viewMode === "GRID"
                      ? "Cleaner day cards, calmer course surfaces, and click-to-add empty slots."
                      : "Your classes ordered by day and time."}
                  </p>
                </div>
                <span className="text-[11px] font-medium text-[var(--ink-400)] tabular-nums">
                  {stats.totalSessions} sessions · {stats.totalHours}h
                </span>
              </div>

              <div className="bg-[var(--bg-surface)]">
                {viewMode === "GRID" ? (
                  <TimetableGrid
                    blocks={entries}
                    dayRange={dayRange}
                    shiftFilter={shiftFilter}
                    onAddManualBlock={(dayNum, slotTime, endTime) => handleOpenAddModal(dayNum, slotTime, endTime)}
                    onDeleteBlock={(id) => setPendingDeleteId(id)}
                  />
                ) : (
                  <TimetableAgenda
                    blocks={entries}
                    dayRange={dayRange}
                    onAddManualBlock={(dayNum) => handleOpenAddModal(dayNum)}
                    onDeleteBlock={(id) => setPendingDeleteId(id)}
                  />
                )}
              </div>
            </section>
          )}
        </div>
      )}

      {tab === "IMPORT" && (
        <TimetableImport
          entries={entries}
          setEntries={setEntries}
          history={history}
          setHistory={setHistory}
          heading="Upload your AAO Timetable PDF"
          description="Parses your official EIU AAO 'lịch học' export starting from 07:30 AM entirely in your browser — detects course codes, section groups, rooms, and shift clusters."
          buildEntry={(row: ParsedTimetableRow, dayOfWeek: number, id: number): ScheduleBlock => {
            const isLab = row.room.toUpperCase().includes("LAB");
            const isOnline = row.room.toUpperCase().includes("ONLINE");
            return {
              id,
              title: row.subjectCode !== "N/A" ? `${row.subjectName} (${row.subjectCode})` : row.subjectName,
              subjectCode: row.subjectCode !== "N/A" ? row.subjectCode : undefined,
              subjectName: row.subjectName,
              group: row.group !== "N/A" ? row.group : undefined,
              room: row.room,
              lecturerName: row.lecturerName !== "Chưa rõ" ? row.lecturerName : undefined,
              locationType: isLab ? "LAB" : isOnline ? "ONLINE" : "ROOM",
              dayOfWeek,
              date: row.date ?? undefined,
              startTime: row.startTime,
              endTime: row.endTime,
              source: "IMPORTED",
            };
          }}
        />
      )}

      {/* Add Manual Event Modal */}
      {isAddModalOpen && (
        <div className="animate-in fade-in fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 duration-150 backdrop-blur-[2px]">
          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-[var(--paper-200)] bg-white p-6 shadow-[0_24px_70px_rgba(15,23,42,0.18)]">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-bold text-[var(--ink-900)]">Add Schedule Event</h2>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--ink-400)] transition-colors hover:bg-[var(--paper-100)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateManualBlock}
            className="flex flex-col gap-4">
              <FormField label="Event Title / Subject">
                <TextInput
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Department Committee, Thesis Defense"
                  required
                />
              </FormField>

              <div className="flex flex-col gap-1.5">
                <span className="text-[12.5px] font-semibold text-[var(--ink-700)]">Day of Week</span>
                <NativeSelect
                  value={newDayOfWeek}
                  onChange={(e) => setNewDayOfWeek(Number(e.target.value))}
                  className="w-auto"
                >
                  {Object.entries(DAY_METADATA).map(([num, meta]) => (
                    <option key={num} value={num}>
                      {meta.en} ({meta.vn})
                    </option>
                  ))}
                </NativeSelect>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <FormField label="Start Time">
                  <NativeSelect
                    value={newStartTime}
                    onChange={(e) => setNewStartTime(e.target.value)}
                    className="w-auto"
                  >
                    {TIME_SLOTS_FULL.slice(0, -1).map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </NativeSelect>
                </FormField>

                <FormField label="End Time">
                  <NativeSelect
                    value={newEndTime}
                    onChange={(e) => setNewEndTime(e.target.value)}
                    className="w-auto"
                  >
                    {TIME_SLOTS_FULL.slice(1).map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </NativeSelect>
                </FormField>
              </div>

              <FormField label="Room / Facility (Optional)">
                <TextInput
                  value={newRoom}
                  onChange={(e) => setNewRoom(e.target.value)}
                  placeholder="e.g. Boardroom B02, Room 402, Online"
                />
              </FormField>

              <FormField label="Notes (Optional)">
                <TextInput
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="e.g. Capstone defense evaluation panel"
                />
              </FormField>

              <div className="flex items-center justify-end gap-2 border-t border-[var(--paper-200)] pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="rounded-lg px-4 py-2 text-xs font-semibold text-[var(--ink-600)] transition-colors hover:bg-[var(--paper-100)]"
                >
                  Cancel
                </button>
                <Button
                  type="submit"
                >
                  Add Block
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        open={pendingDeleteId !== null}
        title="Delete this schedule block?"
        description="This will remove the event from your timetable view. Students will be able to book slots during this window."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onCancel={() => setPendingDeleteId(null)}
        onConfirm={() => {
          if (pendingDeleteId) handleDeleteBlock(pendingDeleteId);
          setPendingDeleteId(null);
        }}
      />
    </div>
  );
}
