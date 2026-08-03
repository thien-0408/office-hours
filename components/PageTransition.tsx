"use client";

import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";

// Routes inside this group already slide/cross-fade between each other via
// app/(auth)/layout.tsx's own AnimatePresence — collapsing them to one key here
// stops this outer transition from re-triggering on every login <-> register <->
// forgot-password <-> reset-password hop. It only fires entering/leaving the group.
const AUTH_ROUTES = ["/login", "/register", "/forgot-password", "/reset-password"];

function transitionKey(pathname: string) {
  const isAuthRoute = AUTH_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
  return isAuthRoute ? "auth" : pathname;
}

export default function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const prefersReducedMotion = useReducedMotion();
  const key = transitionKey(pathname);

  // Deliberately no AnimatePresence/exit animation: Next.js already swaps the old
  // route tree out synchronously on navigation, so an exit phase only adds a delay
  // where nothing is rendered but this motion.div — during which the bare `body`
  // background (near-black in dark mode, --bg-canvas) shows through. A mount-only
  // fade-in has no such gap.
  return (
    <motion.div
      key={key}
      initial={prefersReducedMotion ? undefined : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      className="flex-1 flex flex-col"
    >
      {children}
    </motion.div>
  );
}
