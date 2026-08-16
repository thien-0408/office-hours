"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import type { RegisterPayload } from "@/lib/auth/types";
import { AUTH_CARD_CLASS, AUTH_INPUT_CLASS, AUTH_LABEL_CLASS, AUTH_SUBMIT_CLASS, AUTH_LINK_CLASS } from "@/components/landing/auth-styles";
import { PillTag, CapIcon } from "@/components/landing/shared";

const ROLES: { value: RegisterPayload["role"]; label: string; sub: string; icon: React.ReactNode }[] = [
  {
    value: "STUDENT",
    label: "Student",
    sub: "Book hours & queue",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-3.5 w-3.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="m2 9 10-5 10 5-10 5-10-5Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 11v5c0 1.5 2.5 3 6 3s6-1.5 6-3v-5" />
      </svg>
    ),
  },
  {
    value: "LECTURER",
    label: "Lecturer",
    sub: "Host & manage slots",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-3.5 w-3.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
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
      <div className="mb-2">
        <PillTag icon={<CapIcon />}>Join the campus pilot</PillTag>
      </div>
      <h1 className="text-2xl font-extrabold text-[var(--po-text-primary)] mb-4">Create account</h1>

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

        <div className="flex flex-col gap-1.5 text-left">
          <label className={AUTH_LABEL_CLASS}>Account type</label>
          <div className="grid grid-cols-2 gap-2.5" role="group" aria-label="I am a">
            {ROLES.map((r) => {
              const isSelected = role === r.value;
              return (
                <button
                  key={r.value}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => setRole(r.value)}
                  className={`flex flex-col items-center text-center p-2.5 rounded-xl border-2 cursor-pointer transition-all ${
                    isSelected
                      ? "bg-[var(--po-text-primary)] text-white border-blue-950 shadow-[3px_3px_0_0_#0b1b49]"
                      : "bg-white text-[var(--po-text-secondary)] border-[var(--po-border)] hover:border-blue-950/40 hover:text-[var(--po-text-primary)]"
                  } focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--po-accent)]`}
                >
                  <div className="flex items-center gap-1.5 font-bold text-[12.5px]">
                    <span className={isSelected ? "text-[var(--po-accent)]" : "text-[var(--po-text-secondary)]"}>
                      {r.icon}
                    </span>
                    <span>{r.label}</span>
                  </div>
                  <span className={`text-[10px] mt-0.5 ${isSelected ? "text-white/75" : "text-[var(--po-text-secondary)]"}`}>
                    {r.sub}
                  </span>
                </button>
              );
            })}
          </div>
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

