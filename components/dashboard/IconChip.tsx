import type { LucideIcon } from "lucide-react";

// `tone` is a raw { bg, text } pair rather than a hue enum so callers can draw
// from either lib/ui/status-hues.ts (semantic — real booking states) or
// lib/ui/accent-palette.ts (decorative — see docs/DESIGN.md §1.2). This
// component doesn't need to know which source a tile's color came from.
export function IconChip({ icon: Icon, tone }: { icon: LucideIcon; tone: { bg: string; text: string } }) {
  return (
    <span
      className="flex items-center justify-center w-10 h-10 rounded-xl shrink-0"
      style={{ background: tone.bg, color: tone.text }}
    >
      <Icon className="w-5 h-5" strokeWidth={2} />
    </span>
  );
}
