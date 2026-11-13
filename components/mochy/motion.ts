import type { Transition } from "framer-motion";

// Motion presets ported from Mochy Music (github.com/realidkroo/Mochy-Music):
// the Compose app (ui/component/Press3D.kt, TouchFeedback.kt, TopToast.kt, ContainerTransform.kt)
// and its website (docs/assets/css/site.css, home.css, js/home.js).
// Compose springs are (dampingRatio ζ, stiffness k) with mass 1; framer-motion wants the damping
// coefficient, which is c = 2·ζ·√k.
const spring = (dampingRatio: number, stiffness: number): Transition => ({
  type: "spring",
  stiffness,
  damping: 2 * dampingRatio * Math.sqrt(stiffness),
  mass: 1,
});

export const MOCHY_SPRING = {
  /** Press3D.kt: no bounce, k 420. Tilt and squish while held. */
  press3d: spring(1, 420),
  /** TouchFeedback.pressBounce: squish fast (ζ 1, k 1600)… */
  pressDown: spring(1, 1600),
  /** …and spring back past 1 and settle (ζ 0.38, k 520). */
  pressUp: spring(0.38, 520),
  /** Tab / segment highlight sliding to the new item (STYLE-MOCHY §2.4: ζ 0.82, k 700). */
  indicator: spring(0.82, 700),
  /** TopToast.kt: slide in with ζ 0.74 at medium stiffness. */
  toast: spring(0.74, 1500),
  /** ContainerTransform.kt: a screen grows out of its card, ζ 0.88, k 150 (~0.6 s). */
  containerOpen: spring(0.88, 150),
  /** Hero cards: the bouncy one (ζ 0.38). */
  hero: spring(0.38, 300),
} as const;

/** The website's sheet curve (iOS-like): fast start, long soft landing. */
export const MOCHY_EASE = [0.32, 0.72, 0, 1] as const;
/** ContainerTransform close: starts gently so a slow first frame never shows as a jump. */
export const MOCHY_EASE_CLOSE = [0.4, 0, 0.1, 1] as const;
/** TopToast exit. */
export const MOCHY_TOAST_OUT: Transition = { duration: 0.26, ease: MOCHY_EASE };

/** site.css `.page`: children rise 14 px in 0.55 s, 40 ms apart; the old page leaves up 8 px in 0.16 s. */
export const PAGE_RISE = {
  hidden: { opacity: 0, y: 14 },
  shown: (i: number = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.55, ease: MOCHY_EASE, delay: 0.06 + i * 0.04 } }),
  leave: { opacity: 0, y: -8, transition: { duration: 0.16, ease: "easeIn" } },
} as const;

/** home.css `.reveal`: 48 px below at 0.98 scale, eases in over ~1 s the first time it is seen. */
export const REVEAL = {
  hidden: { opacity: 0, y: 48, scale: 0.98 },
  shown: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.95, ease: MOCHY_EASE } },
} as const;
