"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import bgImage from "@/assets/Login-Background.png";
import { LogoWithText } from "@/components/LogoWithText";

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
    <div className="relative flex-1 flex flex-col min-h-screen overflow-hidden bg-[var(--brand-900)]">
      <div className="fixed inset-0 z-0" aria-hidden="true">
        <Image
          src={bgImage}
          alt=""
          fill
          priority
          sizes="100vw"
          quality={95}
          placeholder="blur"
          className="object-cover"
        />
      </div>
      <div
        className="fixed inset-0 z-0 bg-[linear-gradient(180deg,rgba(7,18,48,0.35)_0%,rgba(7,18,48,0.08)_30%,rgba(7,18,48,0.35)_100%)]"
        aria-hidden="true"
      />

      <nav className="relative z-2 flex items-center justify-between max-w-[1180px] w-full mx-auto px-6 pt-6">
        <Link href="/" className="flex items-center text-white no-underline">
          <LogoWithText className="h-12 w-auto text-white" />
        </Link>
        <Link
          href="/"
          className="text-[13.5px] font-semibold text-white/72 no-underline hover:text-white"
        >
          ← Back to home
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
