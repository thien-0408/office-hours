"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
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

export default function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { resetPassword } = useAuth();
  const { t } = useI18n();

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
        <h1 className={AUTH_TITLE_CLASS}>{t("auth.invalidResetLink")}</h1>
        <p className={AUTH_LEAD_CLASS}>This link is missing its reset token. Request a new one below.</p>
        <Link href="/forgot-password" className={`${AUTH_SUBMIT_CLASS} mt-8`}>
          {t("auth.requestNewLink")}
        </Link>
      </div>
    );
  }

  return (
    <div className={AUTH_CARD_CLASS}>
      <h1 className={AUTH_TITLE_CLASS}>{t("auth.setNewPassword")}</h1>
      <p className={AUTH_LEAD_CLASS}>8 to 72 characters.</p>

      <form onSubmit={handleSubmit} noValidate className="mt-8 flex w-full flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label htmlFor="password" className={AUTH_LABEL_CLASS}>
            {t("profile.newPassword")}
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

        <div className="flex flex-col gap-2">
          <label htmlFor="confirmPassword" className={AUTH_LABEL_CLASS}>
            {t("profile.confirmPassword")}
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

        {error && (
          <div className="flex flex-col gap-1.5">
            <p className={AUTH_ERROR_CLASS} role="alert">
              {error}
            </p>
            {error.toLowerCase().includes("token") && (
              <Link href="/forgot-password" className={`w-fit text-[13px] ${AUTH_LINK_CLASS}`}>
                Request a new reset link
              </Link>
            )}
          </div>
        )}

        <button type="submit" disabled={isSubmitting} className={AUTH_SUBMIT_CLASS}>
          {isSubmitting ? t("auth.resetting") : t("auth.resetPassword")}
        </button>
      </form>

      <p className={AUTH_FOOT_CLASS}>
        <Link href="/login" className={AUTH_LINK_CLASS}>
          {t("auth.backToLogin")}
        </Link>
      </p>
    </div>
  );
}
