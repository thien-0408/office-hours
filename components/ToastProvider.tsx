"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion, type PanInfo } from "framer-motion";
import { X, type LucideIcon } from "lucide-react";
import { TOAST_VARIANT_CONFIG, toastHueTokens, type ToastVariant } from "@/lib/ui/toast-config";

// Non-blocking, auto-dismissing action feedback — the counterpart to
// ConfirmModal (blocking, glass, confirm-before-action). "Toast the actor,
// notify the recipient": a toast reports the outcome of an action *the
// current user just took*; it never overlaps with the persisted
// Notification inbox (lib/office-hours/mock-data.ts's getMockNotifications,
// Phase 8), which reports things that happened *to* the user, typically via
// another party.
//
// Visual treatment is a deliberate dark-glass exception — see docs/DESIGN.md
// §1.3. Unlike ConfirmModal (light --glass-* tint over its own dark
// backdrop), a toast has no backdrop of its own, so it carries its own dark
// tint (--toast-glass-bg/--toast-glass-border) to read as frosted glass over
// arbitrary light content, per the user-supplied reference design.

const MAX_VISIBLE = 3;

export interface ToastOptions {
  description?: string;
  duration?: number; // ms; 0 = sticky until manually dismissed
  icon?: LucideIcon;
  action?: { label: string; href?: string; onClick?: () => void };
}

interface ToastItemData extends ToastOptions {
  id: number;
  variant: ToastVariant;
  title: string;
}

interface ToastContextValue {
  show: (variant: ToastVariant, title: string, opts?: ToastOptions) => number;
  success: (title: string, opts?: ToastOptions) => number;
  error: (title: string, opts?: ToastOptions) => number;
  warning: (title: string, opts?: ToastOptions) => number;
  info: (title: string, opts?: ToastOptions) => number;
  dismiss: (id: number) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return ctx;
}

// File: lib/office-hours/providers/toast.tsx (Chỉ thay đổi component ToastCard)

function ToastCard({ toast, onDismiss }: { toast: ToastItemData; onDismiss: () => void }) {
  const prefersReducedMotion = useReducedMotion();
  const config = TOAST_VARIANT_CONFIG[toast.variant];
  const hue = toastHueTokens(toast.variant);
  const Icon = toast.icon ?? config.icon;

  function handleDragEnd(_e: unknown, info: PanInfo) {
    if (Math.abs(info.offset.x) > 80) onDismiss();
  }

  return (
    <motion.div
      layout
      role={config.ariaRole}
      aria-live={config.ariaLive}
      drag={prefersReducedMotion ? false : "x"}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.6}
      onDragEnd={handleDragEnd}
      className="w-full sm:w-[380px] rounded-2xl shadow-2xl px-5 py-4 flex items-center gap-4 cursor-grab active:cursor-grabbing relative overflow-hidden"
      style={{
        // Radial gradient creates the soft left-side ambient state glow
        background: `radial-gradient(ellipse 80% 120% at -10% 50%, ${hue.glow} 0%, transparent 70%), var(--toast-glass-bg, #181d22)`,
        borderWidth: 1,
        borderColor: "var(--toast-glass-border, rgba(255, 255, 255, 0.07))",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
      }}
      initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -12, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -12, scale: 0.96 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Outer dark ring container + inner solid icon circle */}
      <span className="flex items-center justify-center w-10 h-10 rounded-full bg-white/[0.08] shrink-0">
        <span
          className="flex items-center justify-center w-6 h-6 rounded-full shadow-sm"
          style={{ background: hue.dot }}
        >
          <Icon className={`w-3.5 h-3.5 ${hue.iconColor ?? "text-white"}`} strokeWidth={3} />
        </span>
      </span>

      <div className="flex-1 min-w-0">
        <p className="text-[14.5px] font-semibold text-white tracking-tight">{toast.title}</p>
        {toast.description && (
          <p className="text-[13px] text-neutral-400 mt-0.5 leading-snug">
            {toast.description}
          </p>
        )}
        {toast.action && (
          <button
            type="button"
            onClick={() => {
              toast.action?.onClick?.();
              if (toast.action?.href) window.location.href = toast.action.href;
              onDismiss();
            }}
            className="text-[12.5px] font-bold text-[var(--brand-300)] hover:text-[var(--brand-200)] mt-1.5"
          >
            {toast.action.label}
          </button>
        )}
      </div>
    </motion.div>
  );
}
// Wraps each toast with its own auto-dismiss timer that pauses on
// hover/focus — isolated per-item so one toast's timer doesn't interfere
// with siblings' remaining time.
function ToastTimer({ toast, onExpire, children }: { toast: ToastItemData; onExpire: () => void; children: React.ReactNode }) {
  const duration = toast.duration ?? TOAST_VARIANT_CONFIG[toast.variant].defaultDuration;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const remainingRef = useRef(duration);
  const startedAtRef = useRef(0);

  function clearTimer() {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
  }

  function start(ms: number) {
    if (ms <= 0) return; // duration: 0 = sticky, no auto-dismiss
    startedAtRef.current = new Date().getTime();
    timerRef.current = setTimeout(onExpire, ms);
  }

  // Mount-once timer start + cleanup — this toast instance never remounts
  // for the same id, so an empty-deps effect fires exactly once, matching
  // ConfirmModal's own effect-based (not render-mutated) side-effect pattern.
  useEffect(() => {
    start(duration);
    return clearTimer;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handlePause() {
    if (!timerRef.current) return;
    clearTimer();
    const elapsed = new Date().getTime() - startedAtRef.current;
    remainingRef.current = Math.max(0, remainingRef.current - elapsed);
  }

  function handleResume() {
    start(remainingRef.current);
  }

  return (
    <div onMouseEnter={handlePause} onMouseLeave={handleResume} onFocus={handlePause} onBlur={handleResume}>
      {children}
    </div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItemData[]>([]);
  const nextIdRef = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts((list) => list.filter((t) => t.id !== id));
  }, []);

  const show = useCallback((variant: ToastVariant, title: string, opts?: ToastOptions) => {
    const id = nextIdRef.current++;
    // Newest first — the viewport is top-anchored, so prepending keeps the
    // most recent toast closest to the corner and pushes older ones down.
    setToasts((list) => [{ id, variant, title, ...opts }, ...list].slice(0, MAX_VISIBLE));
    return id;
  }, []);

  const success = useCallback((title: string, opts?: ToastOptions) => show("success", title, opts), [show]);
  const error = useCallback((title: string, opts?: ToastOptions) => show("error", title, opts), [show]);
  const warning = useCallback((title: string, opts?: ToastOptions) => show("warning", title, opts), [show]);
  const info = useCallback((title: string, opts?: ToastOptions) => show("info", title, opts), [show]);

  return (
    <ToastContext.Provider value={{ show, success, error, warning, info, dismiss }}>
      {children}
      <div
        className="fixed z-[60] top-4 left-4 right-4 sm:left-auto sm:right-4 flex flex-col items-center sm:items-end gap-2.5 pointer-events-none"
        aria-atomic="false"
      >
        <AnimatePresence>
          {toasts.map((toast) => (
            <div key={toast.id} className="pointer-events-auto w-full sm:w-auto">
              <ToastTimer toast={toast} onExpire={() => dismiss(toast.id)}>
                <ToastCard toast={toast} onDismiss={() => dismiss(toast.id)} />
              </ToastTimer>
            </div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
