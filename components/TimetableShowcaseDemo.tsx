"use client";

import { useState } from "react";
import {
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  EyeOff,
  FileCheck,
  Laptop,
  MapPin,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type ShowcaseTab = "STUDENT_SCHEDULE" | "LECTURER_HOURS" | "CONFLICT_MATCH";

interface ShowcaseClass {
  day: string;
  code: string;
  name: string;
  time: string;
  room: string;
  type: "LAB" | "ROOM" | "ONLINE";
  color: string;
}

const STUDENT_CLASSES: ShowcaseClass[] = [
  { day: "Mon", code: "CSW 437", name: "Thiết kế trải nghiệm (UX)", time: "09:30–11:30", room: "213.B08", type: "ROOM", color: "coral" },
  { day: "Mon", code: "CSW 430", name: "Ứng dụng di động (Online)", time: "16:30–18:30", room: "ONLINE 3", type: "ONLINE", color: "brand" },
  { day: "Tue", code: "CSE 422", name: "Lập trình chuyên nghiệp", time: "16:30–18:30", room: "221.B08", type: "ROOM", color: "info" },
  { day: "Wed", code: "CSW 437", name: "Thiết kế trải nghiệm (UX)", time: "09:30–11:30", room: "213.B08", type: "ROOM", color: "coral" },
  { day: "Thu", code: "CSW 430", name: "Ứng dụng di động (LAB)", time: "07:30–11:30", room: "LAB405.B08", type: "LAB", color: "brand" },
  { day: "Sat", code: "CSE 422", name: "Lập trình chuyên nghiệp (LAB)", time: "07:30–11:30", room: "LAB403.B08", type: "LAB", color: "info" },
];

interface LecturerSlot {
  id: string;
  day: string;
  time: string;
  lecturer: string;
  hasConflict: boolean;
  conflictReason?: string;
}

const LECTURER_SLOTS: LecturerSlot[] = [
  { id: "s1", day: "Mon", time: "10:00–10:30", lecturer: "Dr. Amara Chen", hasConflict: true, conflictReason: "Clashes with CSW 437 (09:30–11:30)" },
  { id: "s2", day: "Mon", time: "14:00–14:30", lecturer: "Dr. Amara Chen", hasConflict: false },
  { id: "s3", day: "Tue", time: "09:30–10:00", lecturer: "Dr. Amara Chen", hasConflict: false },
  { id: "s4", day: "Wed", time: "10:30–11:00", lecturer: "Dr. Amara Chen", hasConflict: true, conflictReason: "Clashes with CSW 437 (09:30–11:30)" },
  { id: "s5", day: "Wed", time: "14:00–14:30", lecturer: "Dr. Amara Chen", hasConflict: false },
  { id: "s6", day: "Thu", time: "09:00–09:30", lecturer: "Dr. Amara Chen", hasConflict: true, conflictReason: "Clashes with CSW 430 Lab (07:30–11:30)" },
  { id: "s7", day: "Thu", time: "14:30–15:00", lecturer: "Dr. Amara Chen", hasConflict: false },
  { id: "s8", day: "Fri", time: "10:00–10:30", lecturer: "Dr. Amara Chen", hasConflict: false },
  { id: "s9", day: "Fri", time: "13:30–14:00", lecturer: "Dr. Amara Chen", hasConflict: false },
];

export function TimetableShowcaseDemo() {
  const [tab, setTab] = useState<ShowcaseTab>("CONFLICT_MATCH");

  return (
    <div className="relative rounded-[22px] border-2 border-blue-950 bg-white p-6 sm:p-8 shadow-[9px_9px_0_0_#0b1b49] overflow-hidden">
      {/* Top Banner / Tab Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-5 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-blue-100 text-blue-800 uppercase tracking-wider">
              Interactive Showcase
            </span>
            <span className="text-xs text-slate-500 font-medium">07:30 AM Timetable Synchronization</span>
          </div>
          <h3 className="text-lg sm:text-xl font-black text-blue-950 font-display">
            How the Conflict-Free Engine Works
          </h3>
        </div>

        {/* Tab Controls */}
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setTab("STUDENT_SCHEDULE")}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              tab === "STUDENT_SCHEDULE"
                ? "bg-white text-blue-950 shadow-xs font-bold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Calendar className="w-3.5 h-3.5 text-blue-600" />
            1. Your AAO Schedule
          </button>
          <button
            type="button"
            onClick={() => setTab("LECTURER_HOURS")}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              tab === "LECTURER_HOURS"
                ? "bg-white text-blue-950 shadow-xs font-bold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-coral-500" />
            2. Lecturer Hours
          </button>
          <button
            type="button"
            onClick={() => setTab("CONFLICT_MATCH")}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              tab === "CONFLICT_MATCH"
                ? "bg-blue-600 text-white shadow-xs font-bold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            3. Conflict Matching ✨
          </button>
        </div>
      </div>

      {/* Main Interactive Stage */}
      <div className="min-h-[320px]">
        <AnimatePresence mode="wait">
          {tab === "STUDENT_SCHEDULE" && (
            <motion.div
              key="student"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col gap-4"
            >
              <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-900">
                <div className="flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>
                    <strong>Imported AAO Export:</strong> Student Nguyen Dinh Thien · Semester 4 (2025–2026) · 07:30 AM Standard
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-600 text-white">
                  6 sessions synced
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {STUDENT_CLASSES.map((cls, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 flex flex-col justify-between gap-2 hover:bg-slate-100 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-blue-600 text-white uppercase">
                          {cls.day}
                        </span>
                        <span className="text-xs font-bold text-slate-900">{cls.code}</span>
                      </div>
                      <span className="text-[11px] font-semibold text-slate-600 tabular-nums">
                        {cls.time}
                      </span>
                    </div>

                    <p className="text-xs font-semibold text-slate-800 leading-snug">{cls.name}</p>

                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 pt-1 border-t border-slate-200/60">
                      {cls.type === "LAB" ? (
                        <Laptop className="w-3 h-3 text-blue-600" />
                      ) : cls.type === "ONLINE" ? (
                        <ExternalLink className="w-3 h-3 text-purple-600" />
                      ) : (
                        <MapPin className="w-3 h-3 text-orange-600" />
                      )}
                      <span>{cls.room}</span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {tab === "LECTURER_HOURS" && (
            <motion.div
              key="lecturer"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col gap-4"
            >
              <div className="flex items-center justify-between bg-orange-50 border border-orange-200 rounded-xl p-3 text-xs text-orange-950">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-orange-600 shrink-0" />
                  <span>
                    <strong>Dr. Amara Chen:</strong> Computer Science Department · 9 weekly open slots published
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-500 text-white">
                  Published rules
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {LECTURER_SLOTS.map((slot) => (
                  <div
                    key={slot.id}
                    className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-2xs flex flex-col justify-between gap-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded text-[10.5px] font-bold bg-slate-100 text-slate-800">
                        {slot.day}
                      </span>
                      <span className="text-xs font-bold text-blue-600 tabular-nums">{slot.time}</span>
                    </div>
                    <p className="text-xs text-slate-600">{slot.lecturer}</p>
                    <div className="text-[11px] text-slate-400">Standard 30-min office hours slot</div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {tab === "CONFLICT_MATCH" && (
            <motion.div
              key="match"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col gap-4"
            >
              {/* Highlight Callout */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-gradient-to-r from-blue-950 to-blue-900 text-white rounded-xl p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white shrink-0 shadow-xs">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-blue-300">
                      Cross-Referenced in Browser
                    </p>
                    <p className="text-sm font-semibold">
                      3 clashing slots automatically filtered out · 6 verified free slots available to book
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#22c55e] text-white flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> 100% Conflict-Free
                  </span>
                </div>
              </div>

              {/* Slot Cards with Conflict Status */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {LECTURER_SLOTS.map((slot) => {
                  return (
                    <div
                      key={slot.id}
                      className={`p-3.5 rounded-xl border transition-all ${
                        slot.hasConflict
                          ? "bg-slate-50 border-slate-200/80 opacity-60"
                          : "bg-white border-blue-400 shadow-sm hover:shadow-md hover:border-blue-600"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className={`px-2 py-0.5 rounded text-[10.5px] font-bold ${
                          slot.hasConflict ? "bg-slate-200 text-slate-600" : "bg-blue-600 text-white"
                        }`}>
                          {slot.day}
                        </span>
                        <span className="text-xs font-bold tabular-nums text-slate-900">{slot.time}</span>
                      </div>

                      <p className="text-xs text-slate-700 font-medium mb-2">{slot.lecturer}</p>

                      {slot.hasConflict ? (
                        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-rose-600 bg-rose-50 border border-rose-200 rounded-lg p-1.5">
                          <EyeOff className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">{slot.conflictReason}</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between text-[11px] font-bold text-[#16a34a] bg-green-50 border border-green-200 rounded-lg p-1.5">
                          <span className="flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Free to Book
                          </span>
                          <span className="text-[10px] text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded">
                            1-Click
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Feature Pill Trio */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6 pt-5 border-t border-slate-100 text-xs">
        <div className="flex items-center gap-2.5 text-slate-700">
          <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <strong className="block text-slate-900">07:30 AM Shift Layout</strong>
            <span className="text-slate-500">Ca Sáng, Chiều, Tối divisions</span>
          </div>
        </div>

        <div className="flex items-center gap-2.5 text-slate-700">
          <div className="w-7 h-7 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600 shrink-0">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <strong className="block text-slate-900">Browser-Side PDF Parser</strong>
            <span className="text-slate-500">100% private, no server upload</span>
          </div>
        </div>

        <div className="flex items-center gap-2.5 text-slate-700">
          <div className="w-7 h-7 rounded-lg bg-green-100 flex items-center justify-center text-green-600 shrink-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <strong className="block text-slate-900">Zero Double-Booking</strong>
            <span className="text-slate-500">DB-level exclusion constraint</span>
          </div>
        </div>
      </div>
    </div>
  );
}
