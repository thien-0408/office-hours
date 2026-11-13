"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Eye, EyeOff, X } from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";
import { useToast } from "@/components/ToastProvider";
import {
  AUTH_CARD_CLASS,
  AUTH_ERROR_CLASS,
  AUTH_FOOT_CLASS,
  AUTH_INPUT_CLASS,
  AUTH_LABEL_CLASS,
  AUTH_LEAD_CLASS,
  AUTH_LINK_CLASS,
  AUTH_SUBMIT_CLASS,
  AUTH_TITLE_CLASS,
} from "@/components/mochy/auth-styles";
import { useI18n } from "@/i18n/provider";

const DEMO_ACCOUNTS = [
  { role: "Student", email: "student@officehours.dev", password: "password123", desc: "Book slots, manage appointments and waitlists" },
  { role: "Lecturer", email: "lecturer@officehours.dev", password: "password123", desc: "Set availability, confirm bookings" },
  { role: "Admin", email: "admin@officehours.dev", password: "password123", desc: "Users, allocation and analytics" },
];

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const toast = useToast();
  const { t } = useI18n();
  const prefersReducedMotion = useReducedMotion();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const justRegistered = searchParams.get("registered") === "1";
  const justReset = searchParams.get("reset") === "1";

  // One-time redirect banners, shown as a toast.
  useEffect(() => {
    if (justRegistered) toast.success("Account created", { description: "Log in to continue." });
    if (justReset) toast.success("Password reset", { description: "Log in with your new password." });
  }, [justRegistered, justReset, toast]);

  // Escape closes the demo dialog.
  useEffect(() => {
    if (!showDemoModal) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setShowDemoModal(false);
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showDemoModal]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await login({ email, password });
      toast.success("Welcome back");
      router.push(searchParams.get("redirectTo") || "/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleSelectDemoAccount(acc: (typeof DEMO_ACCOUNTS)[number]) {
    setEmail(acc.email);
    setPassword(acc.password);
    setShowDemoModal(false);
    toast.success(`Filled ${acc.role} account credentials`, {
      description: "Click 'Sign in' or press enter to continue.",
    });
  }

  return (
    <>
      <div className={AUTH_CARD_CLASS}>
        <h1 className={AUTH_TITLE_CLASS}>{t("auth.login")}</h1>
        <p className={AUTH_LEAD_CLASS}>{t("auth.loginLead")}</p>

        <form onSubmit={handleSubmit} noValidate className="mt-8 flex w-full flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label htmlFor="email" className={AUTH_LABEL_CLASS}>
              {t("auth.email")}
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="ten@eiu.edu.vn"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={error ? true : undefined}
              className={AUTH_INPUT_CLASS}
            />
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-baseline justify-between">
              <label htmlFor="password" className={AUTH_LABEL_CLASS}>
                {t("auth.password")}
              </label>
              <Link href="/forgot-password" className="text-[13px] font-semibold text-[var(--m-fg2)] hover:text-[var(--m-fg)]">
                {t("auth.forgotPassword")}
              </Link>
            </div>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="••••••••"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-invalid={error ? true : undefined}
                className={`${AUTH_INPUT_CLASS} pr-12`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-2 top-1/2 grid h-10 w-10 -translate-y-1/2 cursor-pointer place-items-center rounded-full text-[var(--m-fg3)] transition-colors hover:bg-[var(--m-glass-hi)] hover:text-[var(--m-fg)]"
                aria-label={showPassword ? t("auth.hidePassword") : t("auth.showPassword")}
              >
                {showPassword ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
              </button>
            </div>
          </div>

          {error && (
            <p className={AUTH_ERROR_CLASS} role="alert">
              {error}
            </p>
          )}

          <button type="submit" disabled={isSubmitting} className={AUTH_SUBMIT_CLASS}>
            {isSubmitting ? t("auth.signingIn") : t("auth.signIn")}
          </button>

          {process.env.NODE_ENV !== "production" && (
            <button type="button" onClick={() => setShowDemoModal(true)} className="m-btn m-btn-ghost w-full">
              Demo accounts
            </button>
          )}
        </form>

        <p className={AUTH_FOOT_CLASS}>
          {t("auth.noAccount")}{" "}
          <Link href="/register" className={AUTH_LINK_CLASS}>
            {t("auth.registerFree")}
          </Link>
        </p>
      </div>

      <AnimatePresence>
        {showDemoModal && (
          <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
            <motion.div
              key="demo-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDemoModal(false)}
              className="absolute inset-0 bg-[var(--m-scrim)] backdrop-blur-sm"
              aria-hidden="true"
            />
            <motion.div
              key="demo-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="demo-modal-title"
              initial={prefersReducedMotion ? undefined : { opacity: 0, scale: 0.96, y: 18 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 18 }}
              transition={{ type: "spring", stiffness: 420, damping: 34 }}
              className="relative z-10 w-full max-w-md rounded-[28px] bg-[var(--m-sheet)] p-6 shadow-[inset_0_1px_0_var(--m-line2),var(--m-shadow)]"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 id="demo-modal-title" className="text-[22px] font-bold tracking-[-0.045em] text-[var(--m-fg)]">
                    Demo accounts
                  </h2>
                  <p className="mt-1 text-[13px] font-medium text-[var(--m-fg2)]">Pick one to fill the form.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowDemoModal(false)}
                  className="grid h-10 w-10 cursor-pointer place-items-center rounded-full bg-[var(--m-glass-hi)] text-[var(--m-fg)] hover:bg-[var(--m-glass-hi2)]"
                  aria-label="Close dialog"
                >
                  <X className="h-[18px] w-[18px]" />
                </button>
              </div>

              <div className="mt-5 flex flex-col">
                {DEMO_ACCOUNTS.map((acc) => (
                  <button
                    key={acc.role}
                    type="button"
                    onClick={() => handleSelectDemoAccount(acc)}
                    className="m-hl m-press flex cursor-pointer items-center justify-between gap-3 rounded-2xl px-3 py-3.5 text-left"
                  >
                    <span className="min-w-0">
                      <span className="block text-[15px] font-bold tracking-[-0.03em] text-[var(--m-fg)]">{acc.role}</span>
                      <span className="block truncate text-[12.5px] font-medium text-[var(--m-fg2)]">{acc.desc}</span>
                      <span className="mt-0.5 block font-mono text-[12px] text-[var(--m-fg3)]">{acc.email}</span>
                    </span>
                    <span className="shrink-0 rounded-full bg-[var(--m-glass-hi)] px-3 py-1.5 text-[12.5px] font-semibold text-[var(--m-fg)]">Use</span>
                  </button>
                ))}
              </div>

              <p className="mt-3 flex justify-between rounded-2xl bg-[var(--m-s1)] px-4 py-3 text-[12.5px] font-medium text-[var(--m-fg2)]">
                <span>Password for all accounts</span>
                <span className="font-mono text-[var(--m-fg)]">password123</span>
              </p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
