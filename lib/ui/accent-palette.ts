// Decorative accent palette — icon chips, featured-card CTA, calendar
// selection, nav active-state. NOT booking-status semantics (status-hues.ts
// keeps that separate) and NOT a second primary/interactive color — --accent
// (brand blue) still owns default buttons/links/focus rings. See
// docs/DESIGN.md §1.2 for the decision and what deliberately stayed blue.
//
// Validated as a set with brand-500: dataviz skill,
// validate_palette.js "#F97316,#EC4899,#22C55E,#3465E0" --mode light — all
// checks pass. The surface-contrast WARN is resolved by always pairing color
// with an icon + text label, same as status badges — never color alone.
export type AccentColor = "coral" | "rose" | "mint" | "brand";

export const ACCENT_TOKENS: Record<AccentColor, { bg: string; text: string; dot: string }> = {
  coral: { bg: "var(--coral-100)", text: "var(--coral-700)", dot: "var(--coral-500)" },
  rose: { bg: "var(--rose-100)", text: "var(--rose-700)", dot: "var(--rose-500)" },
  mint: { bg: "var(--mint-100)", text: "var(--mint-700)", dot: "var(--mint-500)" },
  brand: { bg: "var(--brand-100)", text: "var(--brand-700)", dot: "var(--brand-500)" },
};
