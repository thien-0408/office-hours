"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { MOCHY_SPRING } from "@/components/mochy/motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import type { RegisterPayload } from "@/lib/auth/types";
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
import type { MessageKey } from "@/i18n";

// Text-only role choice (docs/DESIGN.md §8.3: no icons on form fields).
const ROLES: { value: RegisterPayload["role"]; label: MessageKey; sub: string }[] = [
  { value: "STUDENT", label: "nav.roleStudent", sub: "Book hours & queue" },
  { value: "LECTURER", label: "nav.roleLecturer", sub: "Host & manage slots" },
];

export default function RegisterForm() {
  const router = useRouter();
  const { register } = useAuth();
  const { t } = useI18n();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<RegisterPayload["role"]>("STUDENT");
  const [department, setDepartment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await register({
        fullName,
        email,
        password,
        role,
        department: department || undefined,
      });
      router.push("/login?registered=1");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className={AUTH_CARD_CLASS}>
      <h1 className={AUTH_TITLE_CLASS}>{t("auth.createAccount")}</h1>
      <p className={AUTH_LEAD_CLASS}>{t("auth.registerLead")}</p>

      <form onSubmit={handleSubmit} noValidate className="mt-8 flex w-full flex-col gap-4">
        <div className="grid grid-cols-2 gap-2.5" role="group" aria-label={t("auth.accountType")}>
          {ROLES.map((r) => (
            <button
              key={r.value}
              type="button"
              aria-pressed={role === r.value}
              onClick={() => setRole(r.value)}
              className="m-chip m-slide m-press"
            >
              {role === r.value && (
                <motion.span layoutId="register-role" transition={MOCHY_SPRING.indicator} className="m-fill" />
              )}
              <span className="text-[15px] font-bold tracking-[-0.03em]">{t(r.label)}</span>
              <span className="text-[12px] font-medium opacity-70">{r.sub}</span>
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="fullName" className={AUTH_LABEL_CLASS}>
            {t("profile.fullName")}
          </label>
          <input
            id="fullName"
            name="fullName"
            type="text"
            autoComplete="name"
            placeholder="Nguyễn Văn An"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className={AUTH_INPUT_CLASS}
          />
        </div>

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

        <div className="flex flex-col gap-2">
          <label htmlFor="password" className={AUTH_LABEL_CLASS}>
            {t("auth.password")}
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
          <label htmlFor="department" className={AUTH_LABEL_CLASS}>
            {t("profile.department")} <span className="font-medium text-[var(--m-fg3)]">({t("common.optional")})</span>
          </label>
          <input
            id="department"
            name="department"
            type="text"
            placeholder="Computer Science"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className={AUTH_INPUT_CLASS}
          />
        </div>

        {error && (
          <p className={AUTH_ERROR_CLASS} role="alert">
            {error}
          </p>
        )}

        <button type="submit" disabled={isSubmitting} className={AUTH_SUBMIT_CLASS}>
          {isSubmitting ? t("auth.creatingAccount") : t("auth.createAccount")}
        </button>
      </form>

      <p className={AUTH_FOOT_CLASS}>
        {t("auth.haveAccount")}{" "}
        <Link href="/login" className={AUTH_LINK_CLASS}>
          {t("auth.login")}
        </Link>
      </p>
    </div>
  );
}
