"use client";

import { useEffect } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ShieldAlert, type LucideIcon } from "lucide-react";

// Glassmorphism confirm dialog — dark blurred backdrop + frosted card, reusing
// the same --glass-* tokens the auth pages use (docs/DESIGN.md), not new
// values. DESIGN.md §1 already reserves glass for "top nav, modals,
// dropdowns," so this fits the existing system rather than adding a new rule.
// Generic (icon/title/copy/labels are props) — not logout-specific — so any
// destructive/confirm action (cancel booking, decline, etc.) can reuse it.
export function ConfirmModal({
  open,
  icon: Icon = ShieldAlert,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
}: {
  open: boolean;
  icon?: LucideIcon;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onCancel]);

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
            onClick={onCancel}
            aria-hidden="true"
          />
          <motion.div
            key="card"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-modal-title"
            aria-describedby="confirm-modal-description"
            className="relative w-full max-w-[340px] rounded-[28px] px-7 py-8 text-center shadow-2xl"
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
            <span className="mx-auto mb-5 flex items-center justify-center w-14 h-14 rounded-full bg-white">
              <Icon className="w-6 h-6 text-[var(--brand-900)]" strokeWidth={2} />
            </span>
            <h2 id="confirm-modal-title" className="text-lg font-bold text-white mb-2">
              {title}
            </h2>
            <p id="confirm-modal-description" className="text-[13.5px] text-white/70 mb-7 leading-relaxed">
              {description}
            </p>
            <div className="flex flex-col gap-2.5">
              <button
                type="button"
                onClick={onConfirm}
                className="w-full py-3 rounded-xl bg-white text-[var(--ink-900)] text-sm font-bold hover:bg-white/90 active:scale-[0.99] transition-all"
              >
                {confirmLabel}
              </button>
              <button
                type="button"
                onClick={onCancel}
                className="w-full py-3 rounded-xl border text-white text-sm font-bold hover:bg-white/10 active:scale-[0.99] transition-all"
                style={{ background: "var(--glass-bg)", borderColor: "var(--glass-border)" }}
              >
                {cancelLabel}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
