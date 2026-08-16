"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth/auth-context";
import { AUTH_CARD_CLASS, AUTH_INPUT_CLASS, AUTH_LABEL_CLASS, AUTH_SUBMIT_CLASS, AUTH_LINK_CLASS } from "@/components/landing/auth-styles";

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
    <div className={AUTH_CARD_CLASS}>
      <h1 className="text-2xl font-extrabold text-[var(--po-text-primary)] mb-2">Forgot password?</h1>

      {submitted ? (
        <>
          <p className="text-sm text-[var(--po-text-primary)]/70 mb-6 leading-relaxed">
            If an account exists for <span className="font-bold text-[var(--po-text-primary)]">{email}</span>, we&apos;ve
            sent a link to reset your password. It expires in 30 minutes.
          </p>
          <button
            type="button"
            onClick={() => setSubmitted(false)}
            className={`text-xs text-left mb-6 w-fit ${AUTH_LINK_CLASS}`}
          >
            Didn&apos;t get it? Try another email
          </button>
        </>
      ) : (
        <>
          <p className="text-sm text-[var(--po-text-primary)]/70 mb-6 leading-relaxed">
            Enter the email on your account and we&apos;ll send you a link to reset your password.
          </p>

          <form onSubmit={handleSubmit} noValidate className="w-full flex flex-col gap-3.5">
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

            <button type="submit" disabled={isSubmitting} className={AUTH_SUBMIT_CLASS}>
              {isSubmitting ? "Sending…" : "Send reset link"}
            </button>
          </form>
        </>
      )}

      <p className="text-xs text-[var(--po-text-secondary)] text-center mt-6">
        <Link href="/login" className={AUTH_LINK_CLASS}>
          &larr; Back to login
        </Link>
      </p>
    </div>
  );
}
