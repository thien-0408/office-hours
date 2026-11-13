import { useId } from "react";

// Solid status glyphs (docs/DESIGN.md §8.4): a filled shape with the symbol knocked out,
// instead of a colored status dot. Monochrome, follows currentColor.
type Glyph = "ok" | "wait" | "no";

const KNOCKOUT: Record<Glyph, React.ReactNode> = {
  ok: <path d="M7.5 12.2l3 3 6-6.4" stroke="#000" strokeWidth={2.4} fill="none" strokeLinecap="round" strokeLinejoin="round" />,
  wait: <path d="M12 7v5.2l3.2 2" stroke="#000" strokeWidth={2.4} fill="none" strokeLinecap="round" strokeLinejoin="round" />,
  no: <path d="M8.5 8.5l7 7M15.5 8.5l-7 7" stroke="#000" strokeWidth={2.4} fill="none" strokeLinecap="round" />,
};

export function StatusGlyph({ glyph, className }: { glyph: Glyph; className?: string }) {
  const id = `g${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <mask id={id}>
        <rect width="24" height="24" fill="#fff" />
        {KNOCKOUT[glyph]}
      </mask>
      <circle cx="12" cy="12" r="10" fill="currentColor" mask={`url(#${id})`} />
    </svg>
  );
}
