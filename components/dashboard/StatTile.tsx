"use client";

import { useEffect, useState } from "react";
import { animate, useReducedMotion } from "framer-motion";
import type { Icon as PhosphorIcon } from "@phosphor-icons/react";
import { Card } from "./Card";

// Only animates numeric values — string values (e.g. "68%", already formatted
// by the caller) render statically rather than parsing/reassembling a suffix.
function useCountUp(target: number, enabled: boolean): number {
  const prefersReducedMotion = useReducedMotion();
  const shouldAnimate = enabled && !prefersReducedMotion;
  const [value, setValue] = useState(shouldAnimate ? 0 : target);

  useEffect(() => {
    if (!shouldAnimate) return;
    const controls = animate(0, target, {
      duration: 0.8,
      ease: "easeOut",
      onUpdate: (v) => setValue(Math.round(v)),
    });
    return () => controls.stop();
  }, [target, shouldAnimate]);

  return value;
}

export function StatTile({
  icon: Icon,
  tone,
  value,
  label,
}: {
  icon: PhosphorIcon;
  tone: { bg: string; text: string; dot: string };
  value: string | number;
  label: string;
}) {
  const isNumeric = typeof value === "number";
  const animatedValue = useCountUp(isNumeric ? value : 0, isNumeric);
  const display = isNumeric ? animatedValue : value;

  return (
    <Card className="flex items-center gap-3.5 p-4">
      {/* Solid saturated chip + filled glyph (Phosphor "fill") — reads livelier than the
          old pale chip with a thin stroke icon. Uses the tone's 500 shade, no new colors. */}
      <span
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-white"
        style={{ background: tone.dot, boxShadow: `0 6px 14px -4px color-mix(in srgb, ${tone.dot} 55%, transparent)` }}
      >
        <Icon className="h-6 w-6" weight="fill" aria-hidden />
      </span>
      <div className="min-w-0">
        <p className="text-2xl font-bold text-[var(--ink-900)] tabular-nums leading-tight">{display}</p>
        <p className="text-[12.5px] text-[var(--ink-600)] truncate">{label}</p>
      </div>
    </Card>
  );
}
