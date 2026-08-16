// Shared class strings for the (auth) route group — login/register/
// forgot-password/reset-password — now built on the same neo-brutalist
// system as the landing page (docs/DESIGN.md §1.1) rather than the old
// full-glass gradient treatment, on explicit request once the landing
// rebuild made the two surfaces visually disconnected. Uses the same
// --po-* tokens (components/landing/tokens.ts) and NEO_LIGHT border/shadow
// recipe (components/landing/shared.tsx) — a plain white card with a hard
// offset shadow, not glass.

export const AUTH_CARD_CLASS =
  "w-full p-8 sm:p-12 rounded-[24px] border-2 border-blue-950 bg-white shadow-[8px_8px_0_0_#0b1b49] text-[var(--po-text-primary)] flex flex-col";

export const AUTH_INPUT_CLASS =
  "w-full px-4 py-2.5 rounded-xl border-2 border-[var(--po-border)] bg-white text-[var(--po-text-primary)] text-sm placeholder:text-[var(--po-text-secondary)] focus:outline-none focus:border-blue-950 focus:ring-2 focus:ring-[var(--po-accent)] transition-all";

export const AUTH_LABEL_CLASS = "text-xs font-bold text-[var(--po-text-primary)]";

export const AUTH_SUBMIT_CLASS =
  "w-full py-3.5 mt-2 rounded-full border-2 border-blue-950 bg-[var(--po-text-primary)] text-white font-bold text-sm uppercase tracking-[0.03em] text-center hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-60 disabled:hover:translate-y-0 disabled:cursor-not-allowed transition-all";

export const AUTH_LINK_CLASS =
  "font-bold text-[var(--po-text-primary)] underline underline-offset-2 hover:opacity-70";
