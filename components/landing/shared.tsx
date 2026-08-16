"use client";

import Link from "next/link";
import type { MouseEvent, ReactNode } from "react";
import "@/components/landing/projectone.css";

// Shared primitives for the /landing route's ProjectOne-referenced system —
// pill buttons, micro eyebrow labels, polaroid photo cards, checkmark
// chips. See components/landing/tokens.ts for the color/type scale these
// draw from. Client boundary (rather than per-component "use client") is
// needed for SmoothAnchor's onClick below; every other export here is plain
// presentational JSX, so making the whole module client-side costs nothing.

export function SmoothAnchor({
  href,
  children,
  className = "",
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  function handleClick(e: MouseEvent<HTMLAnchorElement>) {
    const id = href.replace("#", "");
    const target = document.getElementById(id);
    if (!target) return;
    e.preventDefault();
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
  }

  return (
    <a href={href} onClick={handleClick} className={className}>
      {children}
    </a>
  );
}

// Neo-brutalist hard-shadow card recipe, lifted from app/page.tsx's
// value-prop cards (docs/DESIGN.md §1.1) and applied across every card-like
// surface on this route: border-2 border-blue-950 + a flat offset shadow,
// no blur. NEO_LIGHT is for white/lime/paper surfaces (navy shadow, matching
// the main page's default variant); NEO_DARK is for near-black surfaces
// (blue shadow, matching the main page's "inverted" variant so the shadow
// still reads against a dark card).
export const NEO_LIGHT = "border-2 border-blue-950 shadow-[6px_6px_0_0_#0b1b49]";
export const NEO_DARK = "border-2 border-blue-950 shadow-[6px_6px_0_0_#3465e0]";
// Same recipe, tuned for tiles that sit ON a black section background
// (StatsBento) rather than a light page background — a navy shadow would
// nearly vanish against black, so both variants use the blue shadow to stay
// visible; only the border changes so it still reads against the tile's own
// (light vs. translucent-dark) face.
export const NEO_ON_DARK_LIGHT = "border-2 border-blue-950 shadow-[6px_6px_0_0_#3465e0]";
export const NEO_ON_DARK_GLASS = "border-2 border-white/15 shadow-[6px_6px_0_0_#3465e0]";

export function LimeButton({
  href,
  children,
  className = "",
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    // Bordered pill + a squared-off ("squircle") icon chip, not a circle —
    // matches the ProjectOne reference's lime "JOIN WAITLIST" button, which
    // deliberately contrasts a sharper inner chip against the pill's own
    // full rounding.
    <Link
      href={href}
      className={`inline-flex items-center gap-2.5 rounded-full border-2 border-blue-950 bg-[var(--po-accent)] py-3 pl-6 pr-2 text-[13px] font-bold uppercase tracking-[0.03em] text-[var(--po-text-primary)] transition-transform hover:-translate-y-0.5 ${className}`}
    >
      {children}
      <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--po-text-primary)] text-[var(--po-accent)]">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
      </span>
    </Link>
  );
}

export function DarkButton({
  href,
  children,
  className = "",
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    // Matches the reference's dark "VIEW PRICING" button — same bordered
    // pill shape, but the icon chip stays a full circle (not the squircle
    // above) since that's how the reference draws its dark variant.
    <Link
      href={href}
      className={`inline-flex items-center gap-2.5 rounded-full border-2 border-blue-950 bg-[var(--po-text-primary)] py-3 pl-6 pr-2 text-[13px] font-bold uppercase tracking-[0.03em] text-[var(--po-text-tertiary)] transition-transform hover:-translate-y-0.5 ${className}`}
    >
      {children}
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-[var(--po-text-primary)]">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
      </span>
    </Link>
  );
}

export function Eyebrow({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <p
      className={`text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--po-text-secondary)] ${className}`}
    >
      {children}
    </p>
  );
}

export function PillTag({ children, icon }: { children: ReactNode; icon?: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--po-text-primary)] px-3 py-1.5 text-[10px] font-bold text-[var(--po-text-tertiary)]">
      {icon ?? <span className="h-1.5 w-1.5 rounded-full bg-[var(--po-accent)]" />}
      {children}
    </span>
  );
}

// Small glyph for PillTag's icon slot — a stand-in for the reference's
// feather/paper-plane brand mark, themed to campus scheduling instead
// (a simple graduation-cap outline).
export function CapIcon({ className = "h-3 w-3" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="m2 9 10-5 10 5-10 5-10-5Z" />
      <path d="M6 11v5c0 1.5 2.5 3 6 3s6-1.5 6-3v-5" />
    </svg>
  );
}

// Checkmark-circle for footnote/guarantee-style lines — replaces a plain dot.
export function CheckDot({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <span className={`flex items-center justify-center rounded-full bg-[var(--po-accent)] text-[var(--po-text-primary)] ${className}`}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" className="h-[65%] w-[65%]">
        <path d="m4 12 5 5L20 6" />
      </svg>
    </span>
  );
}

export function PolaroidCard({
  caption,
  rotate,
  accentBg,
  className = "",
  children,
}: {
  caption: string;
  rotate: number;
  accentBg: string;
  className?: string;
  children?: ReactNode;
}) {
  return (
    // Same neo-brutalist hard-shadow recipe as the ProcessTimeline cards and
    // app/page.tsx's value-prop cards (docs/DESIGN.md §1.1) — border-2
    // border-blue-950 + a flat offset shadow, no blur — applied here instead
    // of a soft blurred drop shadow, per explicit request.
    <div
      className={`w-[260px] rounded-2xl border-2 border-blue-950 bg-white p-3 pb-4 shadow-[7px_7px_0_0_#0b1b49] ${className}`}
      style={{ transform: `rotate(${rotate}deg)` }}
    >
      <div className={`relative flex h-[205px] w-full items-center justify-center overflow-hidden rounded-xl ${accentBg}`}>
        {children}
      </div>
      <p className="mt-3 truncate px-1 text-[14px] font-semibold text-[var(--po-text-primary)]">{caption}</p>
    </div>
  );
}

export function CheckBadge({ dark = false }: { dark?: boolean }) {
  return (
    <span
      className={`flex h-5 w-5 items-center justify-center rounded-full ${
        dark ? "bg-[var(--po-text-primary)] text-[var(--po-accent)]" : "bg-[var(--po-text-primary)] text-[var(--po-accent)]"
      }`}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" className="h-2.5 w-2.5">
        <path d="m4 12 5 5L20 6" />
      </svg>
    </span>
  );
}

export function Marquee({ items }: { items: string[] }) {
  const loop = [...items, ...items];
  return (
    <div className="overflow-hidden bg-[var(--po-text-primary)] py-4">
      <div className="po-marquee-track flex w-max items-center gap-8 text-[11px] font-bold uppercase tracking-[0.1em] text-[var(--po-text-tertiary)]">
        {loop.map((item, i) => (
          <span key={`${item}-${i}`} className="flex items-center gap-8 whitespace-nowrap">
            {item}
            <span className="h-1.5 w-1.5 rounded-full bg-[var(--po-accent)]" aria-hidden="true" />
          </span>
        ))}
      </div>
    </div>
  );
}
