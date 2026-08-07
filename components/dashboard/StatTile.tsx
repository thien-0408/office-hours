"use client";

import { useEffect, useState } from "react";
import { animate, useReducedMotion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { Card } from "./Card";
import { IconChip } from "./IconChip";

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
  icon,
  tone,
  value,
  label,
}: {
  icon: LucideIcon;
  tone: { bg: string; text: string };
  value: string | number;
  label: string;
}) {
  const isNumeric = typeof value === "number";
  const animatedValue = useCountUp(isNumeric ? value : 0, isNumeric);
  const display = isNumeric ? animatedValue : value;

  return (
    <Card className="flex items-center gap-3.5 p-4">
      <IconChip icon={icon} tone={tone} />
      <div className="min-w-0">
        <p className="text-xl font-bold text-[var(--ink-900)] tabular-nums leading-tight">{display}</p>
        <p className="text-[12.5px] text-[var(--ink-600)] truncate">{label}</p>
      </div>
    </Card>
  );
}
