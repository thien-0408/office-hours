"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import rough from "roughjs";
import { memojiSrc } from "@/lib/avatar";
import { getMockLecturers } from "@/lib/office-hours/mock-data";

type SlotStatus = "open" | "booked";

interface DemoSlot {
  id: string;
  time: string;
  status: SlotStatus;
}

const WEEK: { day: string; slots: DemoSlot[] }[] = [
  {
    day: "Mon",
    slots: [
      { id: "mon-1", time: "10:00", status: "booked" },
      { id: "mon-2", time: "11:30", status: "open" },
      { id: "mon-3", time: "14:00", status: "open" },
    ],
  },
  {
    day: "Tue",
    slots: [
      { id: "tue-1", time: "09:30", status: "open" },
      { id: "tue-2", time: "13:00", status: "booked" },
      { id: "tue-3", time: "15:30", status: "open" },
    ],
  },
  {
    day: "Wed",
    slots: [
      { id: "wed-1", time: "10:30", status: "open" },
      { id: "wed-2", time: "12:00", status: "open" },
      { id: "wed-3", time: "16:00", status: "booked" },
    ],
  },
  {
    day: "Thu",
    slots: [
      { id: "thu-1", time: "09:00", status: "booked" },
      { id: "thu-2", time: "11:00", status: "open" },
      { id: "thu-3", time: "14:30", status: "open" },
    ],
  },
  {
    day: "Fri",
    slots: [
      { id: "fri-1", time: "10:00", status: "open" },
      { id: "fri-2", time: "13:30", status: "open" },
      { id: "fri-3", time: "15:00", status: "booked" },
    ],
  },
];

const LECTURER = getMockLecturers()[0];

export default function HeroBookingDemo() {
  const ringSvgRef = useRef<SVGSVGElement | null>(null);
  const prefersReducedMotion = useReducedMotion();
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    if (!ringSvgRef.current) return;
    const svg = ringSvgRef.current;
    svg.innerHTML = "";
    const rcSvg = rough.svg(svg);
    const ring1 = rcSvg.ellipse(35, 35, 60, 60, {
      stroke: "#2563eb",
      strokeWidth: 3,
      roughness: 2.3,
      bowing: 2.5,
    });
    const ring2 = rcSvg.ellipse(35.5, 35.5, 66, 64, {
      stroke: "#3b82f6",
      strokeWidth: 1.5,
      roughness: 1.8,
      bowing: 2,
    });
    svg.appendChild(ring1);
    svg.appendChild(ring2);
  }, []);

  function handleSlotClick(slot: DemoSlot) {
    if (slot.status !== "open" || confirmed) return;
    setSelectedSlot((current) => (current === slot.id ? null : slot.id));
  }

  function handleRequest() {
    if (!selectedSlot) return;
    setConfirmed(true);
  }

  function handleReset() {
    setSelectedSlot(null);
    setConfirmed(false);
  }

  return (
    <div className="relative -rotate-1 bg-white border-2 border-blue-950 rounded-[18px] px-6 py-6 shadow-[7px_7px_0_0_#0b1b49] w-full max-w-[420px]">
      {/* Header: lecturer memoji in a rough.js ring + name/department */}
      <div className="flex items-center gap-3.5 mb-5">
        <div className="relative w-[70px] h-[70px] shrink-0 flex items-center justify-center">
          <svg
            ref={ringSvgRef}
            className="absolute inset-0 w-full h-full pointer-events-none"
            viewBox="0 0 70 70"
          />
          <Image
            src={memojiSrc(LECTURER.id)}
            alt={LECTURER.name}
            width={48}
            height={48}
            className="relative w-12 h-12 rounded-full object-cover"
          />
        </div>
        <div className="min-w-0">
          <p className="font-bold text-slate-900 text-[15px] truncate">{LECTURER.name}</p>
          <p className="text-[12px] font-semibold text-blue-600 truncate">{LECTURER.department}</p>
        </div>
      </div>

      {/* Week strip */}
      <div className="grid grid-cols-5 gap-1.5">
        {WEEK.map((column) => (
          <div key={column.day} className="flex flex-col gap-1.5">
            <p className="text-center text-[10.5px] font-bold uppercase tracking-[0.06em] text-slate-400 mb-0.5">
              {column.day}
            </p>
            {column.slots.map((slot) => {
              const isSelected = selectedSlot === slot.id;
              const isConfirmedSlot = confirmed && isSelected;
              return (
                <motion.button
                  key={slot.id}
                  type="button"
                  disabled={slot.status !== "open" || (confirmed && !isSelected)}
                  onClick={() => handleSlotClick(slot)}
                  whileHover={slot.status === "open" && !confirmed ? { y: -2 } : undefined}
                  transition={{ duration: prefersReducedMotion ? 0 : 0.15 }}
                  className={`rounded-lg px-1 py-1.5 text-[10.5px] font-bold text-center border transition-colors ${
                    isConfirmedSlot
                      ? "bg-[#22C55E] border-[#16a34a] text-white"
                      : isSelected
                        ? "bg-blue-600 border-blue-700 text-white"
                        : slot.status === "open"
                          ? "bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                          : "bg-slate-50 border-slate-100 text-slate-300 cursor-not-allowed"
                  }`}
                >
                  {slot.time}
                </motion.button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Action row */}
      <div className="mt-5 flex items-center gap-3">
        <AnimatePresence mode="wait" initial={false}>
          {confirmed ? (
            <motion.button
              key="reset"
              type="button"
              onClick={handleReset}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
              className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-full bg-[#22C55E] text-white text-sm font-bold hover:bg-[#16a34a] transition-colors"
            >
              Booked ✓ — try another
            </motion.button>
          ) : (
            <motion.button
              key="request"
              type="button"
              disabled={!selectedSlot}
              onClick={handleRequest}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
              className="w-full inline-flex items-center justify-center px-4 py-2.5 rounded-full bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:hover:bg-blue-600"
            >
              {selectedSlot ? "Request this slot" : "Pick an open slot"}
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
