"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth/auth-context";
import {
  AUTH_CARD_CLASS,
  AUTH_FOOT_CLASS,
  AUTH_INPUT_CLASS,
  AUTH_LABEL_CLASS,
  AUTH_LEAD_CLASS,
  AUTH_LINK_CLASS,
  AUTH_SUBMIT_CLASS,
  AUTH_TITLE_CLASS,
} from "@/components/mochy/auth-styles";
import { useI18n } from "@/i18n/provider";

export default function ForgotPasswordForm() {
  const { forgotPassword } = useAuth();
  const { t } = useI18n();

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
      <h1 className={AUTH_TITLE_CLASS}>{t("auth.forgotPassword")}</h1>

      {submitted ? (
        <>
          <p className={AUTH_LEAD_CLASS}>
            If an account exists for <span className="font-semibold text-[var(--m-fg)]">{email}</span>, we&apos;ve sent a link
            to reset your password. It expires in 30 minutes.
          </p>
          <div className="mt-8 flex flex-col gap-3">
            <a href="https://mail.google.com" target="_blank" rel="noreferrer" className="m-btn m-btn-primary w-full">
              Open Gmail
            </a>
            <button type="button" onClick={() => setSubmitted(false)} className="m-btn m-btn-ghost w-full">
              Try another email
            </button>
          </div>
        </>
      ) : (
        <>
          <p className={AUTH_LEAD_CLASS}>
            Enter the email on your account and we&apos;ll send you a link to reset your password.
          </p>

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
                className={AUTH_INPUT_CLASS}
              />
            </div>

            <button type="submit" disabled={isSubmitting} className={AUTH_SUBMIT_CLASS}>
              {isSubmitting ? t("auth.sending") : t("auth.sendResetLink")}
            </button>
          </form>
        </>
      )}

      <p className={AUTH_FOOT_CLASS}>
        <Link href="/login" className={AUTH_LINK_CLASS}>
          {t("auth.backToLogin")}
        </Link>
      </p>
    </div>
  );
}
