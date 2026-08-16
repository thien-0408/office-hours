"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { AUTH_CARD_CLASS, AUTH_INPUT_CLASS, AUTH_LABEL_CLASS, AUTH_SUBMIT_CLASS, AUTH_LINK_CLASS } from "@/components/landing/auth-styles";
import { PillTag, CapIcon } from "@/components/landing/shared";

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
      <div className={AUTH_CARD_CLASS}>
        <div className="mb-2">
          <PillTag icon={<CapIcon />}>Security</PillTag>
        </div>
        <h1 className="text-2xl font-extrabold text-[var(--po-text-primary)] mb-2">Invalid reset link</h1>
        <p className="text-sm text-[var(--po-text-primary)]/70 mb-6 leading-relaxed">
          This link is missing its reset token. Request a new one below.
        </p>
        <Link href="/forgot-password" className={`${AUTH_SUBMIT_CLASS} inline-block`}>
          Request new link
        </Link>
      </div>
    );
  }

  return (
    <div className={AUTH_CARD_CLASS}>
      <div className="mb-2">
        <PillTag icon={<CapIcon />}>Account Security</PillTag>
      </div>
      <h1 className="text-2xl font-extrabold text-[var(--po-text-primary)] mb-4">Set a new password</h1>

      {error && (
        <div className="mb-3">
          <p className="text-xs text-red-600" role="alert">
            {error}
          </p>
          {error.toLowerCase().includes("token") && (
            <Link href="/forgot-password" className={`text-xs ${AUTH_LINK_CLASS}`}>
              Request a new reset link &rarr;
            </Link>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="w-full flex flex-col gap-3.5">
        <div className="flex flex-col gap-1.5 text-left">
          <label htmlFor="password" className={AUTH_LABEL_CLASS}>
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
            className={AUTH_INPUT_CLASS}
          />
        </div>

        <div className="flex flex-col gap-1.5 text-left">
          <label htmlFor="confirmPassword" className={AUTH_LABEL_CLASS}>
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
            className={AUTH_INPUT_CLASS}
          />
        </div>

        <button type="submit" disabled={isSubmitting} className={AUTH_SUBMIT_CLASS}>
          {isSubmitting ? "Resetting…" : "Reset password"}
        </button>
      </form>

      <p className="text-xs text-[var(--po-text-secondary)] text-center mt-6">
        <Link href="/login" className={AUTH_LINK_CLASS}>
          &larr; Back to login
        </Link>
      </p>
    </div>
  );
}
