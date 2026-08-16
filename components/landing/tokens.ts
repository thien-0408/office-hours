// Scoped design tokens for the /landing route only — a distinct visual
// system (near-black-on-warm-white, lime accent, Satoshi-style geometric
// sans) requested for this one route, deliberately not merged into the
// app-wide --brand-*/--paper-*/--ink-* ramp in app/globals.css (docs/DESIGN.md
// §3). Values are the exact hex tokens supplied for this route's design spec;
// a few (bg/surface/border) are inferred from the reference screenshot since
// the spec only extracted text-color tokens — noted inline.
//
// Applied once via inline style on the route's root element, then referenced
// everywhere as Tailwind arbitrary values, e.g. `bg-[var(--po-accent)]` —
// this keeps every color a token lookup, never a raw hex in component markup,
// per the spec's "Do" rule.
export const PROJECT_ONE_TOKENS: Record<string, string> = {
  // Text
  "--po-text-primary": "#131311",
  "--po-text-secondary": "#b9b9b7",
  "--po-text-tertiary": "#fafafa",
  // Spec's color.text.inverse was a lime `#c6fd50`; swapped for this app's
  // own brand blue (docs/DESIGN.md §3 --brand-300) on explicit user request
  // so the accent reads as OfficeHours, not a lime clone of the reference.
  // brand-300 (not brand-500) — light enough that near-black text on top of
  // it still clears WCAG AA the same way the original lime did.
  "--po-accent": "#8fb0ff",
  // Surfaces — corrected to match the ProjectOne reference's actual values
  // (spot-checked directly against its rendered page, not just the earlier
  // extraction): page background #fafafa, hero circle #f4f4f4 — the circle
  // reads as a soft recessed disc, very slightly darker than the canvas
  // it sits on, not a bright spotlight.
  "--po-bg": "#fafafa",
  "--po-circle": "#f4f4f4",
  "--po-surface": "#ffffff",
  "--po-surface-black": "#000000",
  "--po-border": "#e4e2db",
  // Typography scale (exact spec values)
  "--po-text-xs": "8px",
  "--po-text-sm": "9px",
  "--po-text-md": "12px",
  "--po-text-lg": "14px",
  "--po-text-xl": "16px",
  "--po-text-2xl": "18px",
  "--po-text-3xl": "20px",
  "--po-text-4xl": "31px",
};

// The actual Satoshi font is self-hosted via next/font/local — see
// components/landing/fonts.ts — and applied directly on the route's root
// element via its generated `.className`, not through this token file.
