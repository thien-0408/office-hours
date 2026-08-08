"use client";

import { useEffect } from "react";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";
import { MEMOJI_INDICES } from "@/lib/avatar";

// Same glassmorphism modal shell as ConfirmModal (docs/DESIGN.md reserves
// glass for "top nav, modals, dropdowns") — just swaps the confirm/cancel
// body for a scrollable memoji grid.
export function AvatarPickerModal({
  open,
  currentIndex,
  onSelect,
  onClose,
}: {
  open: boolean;
  currentIndex: number;
  onSelect: (index: number) => void;
  onClose: () => void;
}) {
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            key="backdrop"
            className="absolute inset-0 bg-[var(--brand-950)]/60 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.div
            key="card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="avatar-picker-title"
            className="relative w-full max-w-[420px] rounded-[28px] px-6 py-7 shadow-2xl"
            style={{
              background: "var(--glass-bg)",
              borderWidth: 1,
              borderColor: "var(--glass-border)",
              backdropFilter: "blur(24px)",
            }}
            initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95, y: 12 }}
            animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
            exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.95, y: 12 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="flex items-center justify-between mb-5">
              <h2 id="avatar-picker-title" className="text-lg font-bold text-white">
                Choose your avatar
              </h2>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="flex items-center justify-center w-8 h-8 rounded-full text-white/70 hover:bg-white/10 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" strokeWidth={2} />
              </button>
            </div>

            <div className="grid grid-cols-6 gap-2.5 max-h-[320px] overflow-y-auto pr-1 -mr-1">
              {MEMOJI_INDICES.map((index) => {
                const selected = index === currentIndex;
                return (
                  <button
                    key={index}
                    type="button"
                    onClick={() => onSelect(index)}
                    aria-label={`Use memoji ${index}`}
                    aria-pressed={selected}
                    className={`relative rounded-full overflow-hidden transition-transform hover:scale-105 ${
                      selected ? "ring-2 ring-white ring-offset-2 ring-offset-transparent" : "ring-1 ring-white/15"
                    }`}
                  >
                    <Image src={`/memoji/${index}.png`} alt="" width={56} height={56} className="w-full h-full object-cover" />
                  </button>
                );
              })}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
