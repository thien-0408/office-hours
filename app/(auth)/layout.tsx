"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { PROJECT_ONE_TOKENS } from "@/components/landing/tokens";
import { satoshi } from "@/components/landing/fonts";
import { memojiSrc } from "@/lib/avatar";

const ROUTE_ORDER = ["/login", "/register", "/forgot-password", "/reset-password"];

const variants = {
  enter: { opacity: 0, y: 16 },
  center: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -16 },
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const prefersReducedMotion = useReducedMotion();

  // Derived-during-render state (React's documented pattern for reacting to
  // prop changes without an effect) — tracks which way to slide the card.
  const [prevPathname, setPrevPathname] = useState(pathname);
  const [direction, setDirection] = useState(0);

  if (pathname !== prevPathname) {
    const prevIndex = ROUTE_ORDER.indexOf(prevPathname);
    const nextIndex = ROUTE_ORDER.indexOf(pathname);
    if (prevIndex !== -1 && nextIndex !== -1) {
      setDirection(nextIndex > prevIndex ? 1 : -1);
    }
    setPrevPathname(pathname);
  }

  return (
    <div
      className={`relative flex-1 flex flex-col min-h-screen overflow-hidden bg-[var(--po-bg)] ${satoshi.className}`}
      style={PROJECT_ONE_TOKENS}
    >
      {/* Background decoration:
          1. Large recessed circle to visually anchor the centered auth card
          2. Soft ambient accent glows
          3. Contextual campus scheduler sticker cards (visible on desktop) */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden select-none" aria-hidden="true">
        {/* Soft ambient blurs */}
        <div className="absolute -left-40 -top-40 h-[520px] w-[520px] rounded-full bg-[var(--po-accent)]/20 blur-3xl" />
        <div className="absolute -right-32 -bottom-40 h-[480px] w-[480px] rounded-full bg-[var(--po-accent)]/15 blur-3xl" />

        {/* Central recessed anchoring disc */}
        <div className="absolute left-1/2 top-1/2 h-[760px] w-[760px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--po-circle)] opacity-80" />

        {/* Contextual Campus Scheduler Stickers (Desktop only) */}
        <div className="hidden lg:block">
          {/* Top-Left: Lecturer Office Hours Card */}
          <motion.div
            initial={prefersReducedMotion ? undefined : { opacity: 0, y: 20, rotate: 0 }}
            animate={{ opacity: 1, y: 0, rotate: -7 }}
            transition={{ duration: 0.6, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="absolute left-[3%] xl:left-[8%] top-[16%] w-[230px] rounded-2xl border-2 border-blue-950 bg-white p-3.5 shadow-[6px_6px_0_0_#0b1b49]"
          >
            <div className="flex items-center gap-2.5">
              <div className="relative h-9 w-9 overflow-hidden rounded-full border border-blue-950 bg-blue-100 shrink-0">
                <Image
                  src={memojiSrc("Dr. Elena Ruiz")}
                  alt="Dr. Elena Ruiz"
                  fill
                  sizes="36px"
                  className="object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-bold leading-tight text-[var(--po-text-primary)]">
                  Dr. Elena Ruiz
                </p>
                <p className="text-[10.5px] font-semibold text-[var(--po-text-secondary)]">CS Department</p>
              </div>
            </div>
            <div className="mt-2.5 flex items-center justify-between border-t border-[var(--po-border)] pt-2 text-[11px]">
              <span className="font-semibold text-[var(--po-text-secondary)]">Today 2:00 PM</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                3 slots
              </span>
            </div>
          </motion.div>

          {/* Top-Right: Booking Confirmed Ticket */}
          <motion.div
            initial={prefersReducedMotion ? undefined : { opacity: 0, y: 20, rotate: 0 }}
            animate={{ opacity: 1, y: 0, rotate: 8 }}
            transition={{ duration: 0.6, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="absolute right-[3%] xl:right-[8%] top-[15%] w-[215px] rounded-2xl border-2 border-blue-950 bg-white p-3.5 shadow-[6px_6px_0_0_#0b1b49]"
          >
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--po-accent)] text-blue-950 shrink-0">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} className="h-3.5 w-3.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </span>
              <p className="text-[12px] font-bold text-[var(--po-text-primary)]">Booking Confirmed</p>
            </div>
            <p className="mt-1.5 text-[11px] font-semibold text-[var(--po-text-secondary)]">
              Fri 10:30 AM • Algorithm Review
            </p>
            <div className="mt-2 inline-flex items-center rounded-md border border-[var(--po-border)] bg-[var(--po-bg)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--po-text-primary)]">
              📍 Room 402B
            </div>
          </motion.div>

          {/* Middle-Left: Floating Badge Pill */}
          <motion.div
            initial={prefersReducedMotion ? undefined : { opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1, rotate: -12 }}
            transition={{ duration: 0.5, delay: 0.35 }}
            className="absolute left-[6%] xl:left-[13%] top-[48%] -translate-y-1/2 rounded-full border-2 border-blue-950 bg-white px-3.5 py-1.5 text-[10px] font-extrabold uppercase tracking-widest text-[var(--po-text-primary)] shadow-[4px_4px_0_0_#0b1b49]"
          >
            🎓 Verified Campus Schedule
          </motion.div>

          {/* Middle-Right: Floating Live Sync Badge */}
          <motion.div
            initial={prefersReducedMotion ? undefined : { opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1, rotate: 10 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="absolute right-[6%] xl:right-[13%] top-[48%] -translate-y-1/2 rounded-full border-2 border-blue-950 bg-[var(--po-text-primary)] px-3.5 py-1.5 text-[10px] font-extrabold uppercase tracking-widest text-[var(--po-accent)] shadow-[4px_4px_0_0_#3465e0]"
          >
            ✨ Real-Time Sync
          </motion.div>

          {/* Bottom-Left: Smart Waitlist Notification */}
          <motion.div
            initial={prefersReducedMotion ? undefined : { opacity: 0, y: 20, rotate: 0 }}
            animate={{ opacity: 1, y: 0, rotate: 6 }}
            transition={{ duration: 0.6, delay: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="absolute left-[4%] xl:left-[9%] bottom-[14%] w-[215px] rounded-2xl border-2 border-blue-950 bg-[var(--po-accent)] p-3.5 shadow-[6px_6px_0_0_#0b1b49] text-[var(--po-text-primary)]"
          >
            <div className="flex items-center gap-1.5">
              <span className="text-sm">⚡</span>
              <p className="text-[11.5px] font-extrabold uppercase tracking-wide">Smart Waitlist</p>
            </div>
            <p className="mt-1 text-[11px] font-medium leading-snug">
              Auto-notified when a slot frees up. Zero spam refreshing.
            </p>
          </motion.div>

          {/* Bottom-Right: Zero Double-Books Card */}
          <motion.div
            initial={prefersReducedMotion ? undefined : { opacity: 0, y: 20, rotate: 0 }}
            animate={{ opacity: 1, y: 0, rotate: -7 }}
            transition={{ duration: 0.6, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="absolute right-[4%] xl:right-[9%] bottom-[13%] w-[225px] rounded-2xl border-2 border-blue-950 bg-white p-3.5 shadow-[6px_6px_0_0_#0b1b49]"
          >
            <div className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-md bg-blue-950 text-[10px] font-black text-[var(--po-accent)]">
                0
              </span>
              <p className="text-[12px] font-bold text-[var(--po-text-primary)]">Zero Double-Books</p>
            </div>
            <p className="mt-1.5 text-[11px] leading-tight text-[var(--po-text-secondary)] font-medium">
              Every booking is conflict-checked against student & lecturer timetables.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Top navigation */}
      <nav className="relative z-10 flex items-center justify-between max-w-[1180px] w-full mx-auto px-6 pt-8">
        <Link href="/" className="flex items-center">
          {/* eslint-disable-next-line @next/next/no-img-element -- plain SVG asset */}
          <img src="/logos/concept-4-full.svg" alt="OfficeHours" className="h-9 w-auto" />
        </Link>
        <Link
          href="/"
          className="text-[13px] font-bold uppercase tracking-[0.04em] text-[var(--po-text-primary)] no-underline hover:opacity-60 transition-opacity"
        >
          &larr; Back to home
        </Link>
      </nav>

      {/* Main card viewport */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-5 pt-6 pb-14">
        <motion.div className="w-full max-w-[450px]" layout>
          <AnimatePresence mode="wait" custom={direction} initial={false}>
            <motion.div
              key={pathname}
              custom={direction}
              variants={prefersReducedMotion ? undefined : variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}

