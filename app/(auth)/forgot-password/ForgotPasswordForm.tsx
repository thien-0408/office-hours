"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth/auth-context";

export default function ForgotPasswordForm() {
  const { forgotPassword } = useAuth();

  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await forgotPassword({ email });
    } finally {
      setIsSubmitting(false);
      // Always show the same confirmation state — never reveal whether the email exists.
      setSubmitted(true);
    }
  }

  return (
    <div className="w-full p-12 sm:p-15 rounded-[28px] bg-white/10 backdrop-blur-lg shadow-2xl text-white flex flex-col font-sans">
      <h1 className="text-2xl font-bold text-white mb-2">Forgot password?</h1>

      {submitted ? (
        <>
          <p className="text-sm text-white/80 mb-6 leading-relaxed">
            If an account exists for <span className="font-semibold text-white">{email}</span>, we&apos;ve
            sent a link to reset your password. It expires in 30 minutes.
          </p>
          <button
            type="button"
            onClick={() => setSubmitted(false)}
            className="text-xs font-semibold text-white/80 hover:text-white hover:underline text-left mb-6 w-fit"
          >
            Didn&apos;t get it? Try another email
          </button>
        </>
      ) : (
        <>
          <p className="text-sm text-white/70 mb-6 leading-relaxed">
            Enter the email on your account and we&apos;ll send you a link to reset your password.
          </p>

          <form onSubmit={handleSubmit} noValidate className="w-full flex flex-col gap-3.5">
            <div className="flex flex-col gap-1.5 text-left">
              <label htmlFor="email" className="text-xs font-semibold text-white">
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
                className="w-full px-4 py-2.5 rounded-xl border border-white/40 bg-white text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:border-white focus:ring-2 focus:ring-white/50 transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 mt-2 rounded-xl bg-[#0b132b] text-white font-bold text-sm hover:bg-[#121f42] active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-lg"
            >
              {isSubmitting ? "Sending…" : "Send reset link"}
            </button>
          </form>
        </>
      )}

      <p className="text-xs text-white/80 text-center mt-6">
        <Link href="/login" className="font-bold text-white hover:underline">
          ← Back to login
        </Link>
      </p>
    </div>
  );
}
