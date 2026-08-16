"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import LandingNav from "@/components/landing/LandingNav";
import { LimeButton, DarkButton, PillTag, PolaroidCard } from "@/components/landing/shared";

// Photos self-hosted from Unsplash (images.unsplash.com, Unsplash License —
// free for commercial use, no attribution required) rather than fetched at
// runtime, matching this app's zero-external-request convention for media
// (see docs/DESIGN.md's no-stock-photo-dependency note re: memoji — the
// difference here is these are explicitly requested, downloaded once, and
// bundled, not a live third-party embed).
import heroLecture from "@/assets/photos/landing/hero-lecture.jpg";
import heroLibrary from "@/assets/photos/landing/hero-library.jpg";
import heroCafe from "@/assets/photos/landing/hero-cafe.jpg";
import heroAdvising from "@/assets/photos/landing/hero-advising.jpg";

const POLAROIDS = [
  { src: heroLecture, caption: "Dr. Elena Ruiz", rotate: -8, pos: "left-[9%] top-[8%]", delay: 0.3 },
  { src: heroAdvising, caption: "Advising, Tue 2pm", rotate: 6, pos: "right-[8%] top-[15%]", delay: 0.4 },
  { src: heroLibrary, caption: "Priya Nair", rotate: -6, pos: "left-[13%] bottom-[20%]", delay: 0.5 },
  { src: heroCafe, caption: "Marcus Webb", rotate: 5, pos: "right-[11%] bottom-[9%]", delay: 0.6 },
];

export default function LandingHero() {
  const reduceMotion = useReducedMotion();

  return (
    <section className="relative overflow-hidden bg-[var(--po-bg)]">
      <LandingNav />

      <div className="relative mx-auto flex min-h-[860px] w-full max-w-[1280px] flex-col items-center px-6 pb-16 pt-6">
        <motion.div
          initial={reduceMotion ? undefined : { opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="pointer-events-none absolute left-1/2 top-[20px] h-[920px] w-[920px] -translate-x-1/2 rounded-full bg-[var(--po-circle)]"
          aria-hidden="true"
        />

        {/* Polaroid photo collage, radially placed around the headline */}
        {POLAROIDS.map((p) => (
          <motion.div
            key={p.caption}
            initial={reduceMotion ? undefined : { opacity: 0, y: 24, rotate: 0, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, rotate: p.rotate, scale: 1 }}
            transition={{ duration: 0.6, delay: p.delay, ease: [0.22, 1, 0.36, 1] }}
            className={`absolute z-10 hidden lg:block ${p.pos}`}
          >
            <PolaroidCard caption={p.caption} rotate={0} accentBg="bg-slate-100">
              <Image src={p.src} alt="" fill sizes="220px" className="object-cover" />
            </PolaroidCard>
          </motion.div>
        ))}

        <div className="relative z-10 flex flex-1 flex-col items-center justify-center text-center">
          <motion.div
            initial={reduceMotion ? undefined : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.05 }}
          >
            <PillTag>Built for campus scheduling</PillTag>
          </motion.div>

          <motion.p
            initial={reduceMotion ? undefined : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-6 text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--po-text-secondary)]"
          >
            One inbox. One calendar. Zero conflicts.
          </motion.p>

          <motion.h1
            initial={reduceMotion ? undefined : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="mt-3 max-w-[15ch] text-balance text-[clamp(36px,6vw,62px)] font-extrabold leading-[0.98] tracking-[-0.02em] text-[var(--po-text-primary)]"
          >
            Office Hours, Handled.
          </motion.h1>

          <motion.p
            initial={reduceMotion ? undefined : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.22 }}
            className="mt-5 max-w-[46ch] text-[15px] leading-[1.6] text-[var(--po-text-primary)]/70"
          >
            A booking system that checks every slot against your real class schedule. No email
            chase, no double-books, no spreadsheet sign-up sheet taped to an office door.
          </motion.p>

          <motion.div
            initial={reduceMotion ? undefined : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-8 flex flex-wrap items-center justify-center gap-3"
          >
            <LimeButton href="/register">Get started free</LimeButton>
            <DarkButton href="/public/office-hours">Browse lecturers</DarkButton>
          </motion.div>

          <motion.p
            initial={reduceMotion ? undefined : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-5 inline-flex items-center gap-2 text-[11px] font-semibold text-[var(--po-text-secondary)]"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--po-accent)]" />
            Free for every student and lecturer
          </motion.p>
        </div>
      </div>
    </section>
  );
}
