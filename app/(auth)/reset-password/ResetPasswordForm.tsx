"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";

export default function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { resetPassword } = useAuth();

  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }

    setIsSubmitting(true);
    try {
      await resetPassword({ token: token!, newPassword: password });
      router.push("/login?reset=1");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Password reset failed");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!token) {
    return (
      <div className="w-full p-12 sm:p-15 rounded-[28px] bg-white/10 backdrop-blur-lg shadow-2xl text-white flex flex-col font-sans">
        <h1 className="text-2xl font-bold text-white mb-2">Invalid reset link</h1>
        <p className="text-sm text-white/80 mb-6 leading-relaxed">
          This link is missing its reset token. Request a new one below.
        </p>
        <Link
          href="/forgot-password"
          className="w-full py-3 rounded-xl bg-[#0b132b] text-white font-bold text-sm text-center hover:bg-[#121f42] active:scale-[0.99] transition-all shadow-lg"
        >
          Request new link
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full p-12 sm:p-15 rounded-[28px] bg-white/10 backdrop-blur-lg shadow-2xl text-white flex flex-col font-sans">
      <h1 className="text-2xl font-bold text-white mb-5">Set a new password</h1>

      {error && (
        <div className="mb-3">
          <p className="text-xs text-[var(--danger-300)]" role="alert">
            {error}
          </p>
          {error.toLowerCase().includes("token") && (
            <Link href="/forgot-password" className="text-xs font-semibold text-white hover:underline">
              Request a new reset link →
            </Link>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="w-full flex flex-col gap-3.5">
        <div className="flex flex-col gap-1.5 text-left">
          <label htmlFor="password" className="text-xs font-semibold text-white">
            New password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            placeholder="At least 8 characters"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-white/40 bg-white text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:border-white focus:ring-2 focus:ring-white/50 transition-all"
          />
        </div>

        <div className="flex flex-col gap-1.5 text-left">
          <label htmlFor="confirmPassword" className="text-xs font-semibold text-white">
            Confirm new password
          </label>
          <input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            placeholder="Re-enter password"
            required
            minLength={8}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-white/40 bg-white text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:border-white focus:ring-2 focus:ring-white/50 transition-all"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 mt-2 rounded-xl bg-[#0b132b] text-white font-bold text-sm hover:bg-[#121f42] active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-lg"
        >
          {isSubmitting ? "Resetting…" : "Reset password"}
        </button>
      </form>

      <p className="text-xs text-white/80 text-center mt-6">
        <Link href="/login" className="font-bold text-white hover:underline">
          ← Back to login
        </Link>
      </p>
    </div>
  );
}
