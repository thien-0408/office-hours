"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { useToast } from "@/components/ToastProvider";
import { AUTH_CARD_CLASS, AUTH_INPUT_CLASS, AUTH_LABEL_CLASS, AUTH_SUBMIT_CLASS, AUTH_LINK_CLASS } from "@/components/landing/auth-styles";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const toast = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const justRegistered = searchParams.get("registered") === "1";
  const justReset = searchParams.get("reset") === "1";

  // One-time redirect banners, now a toast instead of inline text — the
  // "toast the actor" success case, replacing the two static banners below.
  useEffect(() => {
    if (justRegistered) toast.success("Account created", { description: "Log in to continue." });
    if (justReset) toast.success("Password reset", { description: "Log in with your new password." });
  }, [justRegistered, justReset, toast]);

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

  return (
    <div className={AUTH_CARD_CLASS}>
      <h1 className="text-2xl font-extrabold text-[var(--po-text-primary)] mb-5">Login</h1>

      {error && (
        <p className="text-xs text-red-600 mb-3" role="alert">
          {error}
        </p>
      )}

      {process.env.NODE_ENV !== "production" && (
        <div className="mb-4 rounded-xl border-2 border-[var(--po-border)] bg-[var(--po-bg)] px-3.5 py-2.5 text-[11.5px] text-[var(--po-text-primary)]/85">
          <p className="font-bold text-[var(--po-text-primary)] mb-1">Dev test accounts (no backend yet)</p>
          <ul className="space-y-0.5 font-mono">
            <li>student@officehours.dev</li>
            <li>lecturer@officehours.dev</li>
            <li>admin@officehours.dev</li>
          </ul>
          <p className="mt-1 text-[var(--po-text-secondary)]">Password: password123</p>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="w-full flex flex-col gap-3.5">
        {/* Email Field */}
        <div className="flex flex-col gap-1.5 text-left">
          <label htmlFor="email" className={AUTH_LABEL_CLASS}>
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="username@gmail.com"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={AUTH_INPUT_CLASS}
          />
        </div>

        {/* Password Field */}
        <div className="flex flex-col gap-1.5 text-left">
          <label htmlFor="password" className={AUTH_LABEL_CLASS}>
            Password
          </label>
          <div className="relative flex items-center">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="Password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`${AUTH_INPUT_CLASS} pr-10`}
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-3 text-[var(--po-text-secondary)] hover:text-[var(--po-text-primary)] transition-colors"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Forgot Password Link */}
        <div className="text-left mt-0.5">
          <Link href="/forgot-password" className={`text-xs ${AUTH_LINK_CLASS}`}>
            Forgot Password?
          </Link>
        </div>

        {/* Submit Button */}
        <button type="submit" disabled={isSubmitting} className={AUTH_SUBMIT_CLASS}>
          {isSubmitting ? "Signing in…" : "Sign in"}
        </button>
      </form>

      {/* Social Options Header */}
      <p className="text-xs text-[var(--po-text-secondary)] text-center mt-5 mb-2.5">
        or continue with
      </p>

      {/* Social Provider Icons */}
      <div className="flex items-center justify-center gap-3 p-3 mb-6 ">
        <button
          type="button"
          className="flex items-center justify-center w-[74px] h-9 rounded-xl bg-white border-2 border-[var(--po-border)] hover:bg-[var(--po-bg)] active:scale-95 transition-all"
          aria-label="Sign in with Google"
        >
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path fill="#EA4335" d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.8 14.8 1 12 1 7.7 1 4 3.5 2.2 7.1l3.7 2.8C6.8 7.3 9.2 5 12 5z" />
            <path fill="#4285F4" d="M22.6 12.3c0-.8-.1-1.5-.2-2.3H12v4.3h6c-.3 1.4-1 2.5-2.2 3.3l3.6 2.8c2.1-1.9 3.2-4.7 3.2-8.1z" />
            <path fill="#FBBC05" d="M5.9 14.1c-.2-.7-.3-1.4-.3-2.1s.1-1.4.3-2.1L2.2 7.1C1.4 8.6 1 10.2 1 12s.4 3.4 1.2 4.9l3.7-2.8z" />
            <path fill="#34A853" d="M12 23c3 0 5.5-1 7.3-2.7l-3.6-2.8c-1 .7-2.2 1.1-3.7 1.1-2.8 0-5.2-1.9-6.1-4.5L2.2 16.9C4 20.5 7.7 23 12 23z" />
          </svg>
        </button>
        <button
          type="button"
          className="flex items-center justify-center w-[74px] h-9 rounded-xl bg-black border-2 border-blue-950 hover:bg-slate-900 active:scale-95 transition-all"
          aria-label="Sign in with GitHub"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="#ffffff">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
          </svg>
        </button>
        <button
          type="button"
          className="flex items-center justify-center w-[74px] h-9 rounded-xl bg-[#1877F2] border-2 border-[var(--po-border)] hover:brightness-110 active:scale-95 transition-all"
          aria-label="Sign in with Facebook"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="#ffffff">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
          </svg>
        </button>
      </div>

      {/* Switch Line */}
      <p className="text-xs text-[var(--po-text-secondary)] text-center">
        Don&apos;t have an account yet?{" "}
        <Link href="/register" className={AUTH_LINK_CLASS}>
          Register for free
        </Link>
      </p>
    </div>
  );
}
