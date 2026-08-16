"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import type { RegisterPayload } from "@/lib/auth/types";
import { AUTH_CARD_CLASS, AUTH_INPUT_CLASS, AUTH_LABEL_CLASS, AUTH_SUBMIT_CLASS, AUTH_LINK_CLASS } from "@/components/landing/auth-styles";

const ROLES: { value: RegisterPayload["role"]; label: string }[] = [
  { value: "STUDENT", label: "Student" },
  { value: "LECTURER", label: "Lecturer" },
];

export default function RegisterForm() {
  const router = useRouter();
  const { register } = useAuth();

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
      <p className="text-[11.5px] font-bold uppercase tracking-[0.09em] text-[var(--po-text-secondary)] mb-2">
        Join the pilot
      </p>
      <h1 className="text-2xl font-extrabold text-[var(--po-text-primary)] mb-5">Create account</h1>

      {error && (
        <p className="text-xs text-red-600 mb-3" role="alert">
          {error}
        </p>
      )}

      <form onSubmit={handleSubmit} noValidate className="w-full flex flex-col gap-3.5">
        <div className="flex flex-col gap-1.5 text-left">
          <label htmlFor="fullName" className={AUTH_LABEL_CLASS}>
            Full name
          </label>
          <input
            id="fullName"
            name="fullName"
            type="text"
            autoComplete="name"
            placeholder="Jordan Alvarez"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className={AUTH_INPUT_CLASS}
          />
        </div>

        <div className="flex flex-col gap-1.5 text-left">
          <label htmlFor="email" className={AUTH_LABEL_CLASS}>
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@school.edu"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={AUTH_INPUT_CLASS}
          />
        </div>

        <div className="flex flex-col gap-1.5 text-left">
          <label htmlFor="password" className={AUTH_LABEL_CLASS}>
            Password
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

        <div className="flex gap-2" role="group" aria-label="I am a">
          {ROLES.map((r) => (
            <button
              key={r.value}
              type="button"
              aria-pressed={role === r.value}
              onClick={() => setRole(r.value)}
              className="flex-1 text-[13px] font-bold text-[var(--po-text-secondary)] bg-white border-2 border-[var(--po-border)] rounded-xl py-2.5 cursor-pointer transition-colors aria-pressed:bg-[var(--po-text-primary)] aria-pressed:text-white aria-pressed:border-blue-950 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--po-accent)]"
            >
              {r.label}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-1.5 text-left">
          <label htmlFor="department" className={AUTH_LABEL_CLASS}>
            Department <span className="opacity-60 font-normal">(optional)</span>
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

        <button type="submit" disabled={isSubmitting} className={AUTH_SUBMIT_CLASS}>
          {isSubmitting ? "Creating account…" : "Create account"}
        </button>
      </form>

      <p className="text-xs text-[var(--po-text-secondary)] text-center mt-6">
        Already have an account?{" "}
        <Link href="/login" className={AUTH_LINK_CLASS}>
          Log in
        </Link>
      </p>
    </div>
  );
}
