"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { PROJECT_ONE_TOKENS } from "@/components/landing/tokens";
import { satoshi } from "@/components/landing/fonts";

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
      {/* Background decoration — soft accent blobs + small rotated
          neo-brutalist "sticker" shapes, echoing the landing page's card
          language (docs/DESIGN.md §1.1) without competing with the form.
          Hidden below lg to keep small screens uncluttered, same convention
          as the landing hero's polaroid collage. */}
      <div className="pointer-events-none absolute inset-0 z-0" aria-hidden="true">
        <div className="absolute -left-40 -top-40 h-[480px] w-[480px] rounded-full bg-[var(--po-accent)]/25 blur-3xl" />
        <div className="absolute -right-32 -bottom-40 h-[440px] w-[440px] rounded-full bg-[var(--po-accent)]/20 blur-3xl" />

        <div className="hidden lg:block">
          <div className="absolute left-[12%] top-[18%] h-14 w-14 -rotate-12 rounded-2xl border-2 border-blue-950 bg-[var(--po-accent)]" />
          <div className="absolute right-[14%] top-[26%] h-10 w-10 rotate-12 rounded-full border-2 border-blue-950 bg-white" />
          <div className="absolute left-[16%] bottom-[22%] h-9 w-9 rotate-6 rounded-full border-2 border-blue-950 bg-[var(--po-accent)]" />
          <div className="absolute right-[10%] bottom-[16%] h-16 w-16 rotate-[14deg] rounded-2xl border-2 border-blue-950 bg-white" />
          <div className="absolute left-[7%] top-[52%] h-6 w-6 -rotate-6 rounded-full border-2 border-blue-950 bg-white" />
        </div>
      </div>

      <nav className="relative z-2 flex items-center justify-between max-w-[1180px] w-full mx-auto px-6 pt-8">
        <Link href="/" className="flex items-center">
          {/* eslint-disable-next-line @next/next/no-img-element -- plain SVG asset, no benefit from next/image's raster optimizer */}
          <img src="/logos/concept-4-full.svg" alt="OfficeHours" className="h-9 w-auto" />
        </Link>
        <Link
          href="/"
          className="text-[13px] font-bold uppercase tracking-[0.04em] text-[var(--po-text-primary)] no-underline hover:opacity-60"
        >
          &larr; Back to home
        </Link>
      </nav>

      <div className="relative z-2 flex-1 flex items-center justify-center px-5 pt-8 pb-16">
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
