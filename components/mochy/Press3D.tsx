"use client";

import { useRef } from "react";
import { motion, useReducedMotion, useSpring } from "framer-motion";
import { MOCHY_SPRING } from "./motion";

// Press3D.kt on the web: the card leans toward the pointer (up to `maxTilt` degrees) and,
// while pressed, squishes to 0.97. On a mouse the lean also follows hover, like the phones
// on Mochy's homepage (home.js `.tilt`). No bounce, stiffness 420.
export function Press3D({
  children,
  className,
  maxTilt = 7,
  pressedScale = 0.97,
}: {
  children: React.ReactNode;
  className?: string;
  maxTilt?: number;
  pressedScale?: number;
}) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const spring = MOCHY_SPRING.press3d as { stiffness: number; damping: number };
  const rotateX = useSpring(0, spring);
  const rotateY = useSpring(0, spring);
  const scale = useSpring(1, spring);

  function lean(e: React.PointerEvent) {
    const r = ref.current?.getBoundingClientRect();
    if (!r || reduce) return;
    const nx = Math.max(-1, Math.min(1, ((e.clientX - r.left) / r.width) * 2 - 1));
    const ny = Math.max(-1, Math.min(1, ((e.clientY - r.top) / r.height) * 2 - 1));
    rotateX.set(-ny * maxTilt);
    rotateY.set(nx * maxTilt);
  }
  function rest() {
    rotateX.set(0);
    rotateY.set(0);
    scale.set(1);
  }

  return (
    <motion.div
      ref={ref}
      className={className}
      style={{ rotateX, rotateY, scale, transformPerspective: 900 }}
      onPointerMove={lean}
      onPointerDown={(e) => {
        lean(e);
        if (!reduce) scale.set(pressedScale);
      }}
      onPointerUp={() => scale.set(1)}
      onPointerLeave={rest}
      onPointerCancel={rest}
    >
      {children}
    </motion.div>
  );
}
