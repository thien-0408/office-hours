"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import type { RegisterPayload } from "@/lib/auth/types";

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
    <div className="w-full p-5 sm:p-15 rounded-[28px] bg-white/10 backdrop-blur-lg shadow-2xl text-white flex flex-col font-sans">
      <p className="text-[11.5px] font-bold uppercase tracking-[0.09em] text-[var(--brand-200)] mb-2">
        Join the pilot
      </p>
      <h1 className="text-2xl font-bold text-white mb-5">Create account</h1>

      {error && (
        <p className="text-xs text-red-300 mb-3" role="alert">
          {error}
        </p>
      )}

      <form onSubmit={handleSubmit} noValidate className="w-full flex flex-col gap-3.5">
        <div className="flex flex-col gap-1.5 text-left">
          <label htmlFor="fullName" className="text-xs font-semibold text-white">
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
            className="w-full px-4 py-2.5 rounded-xl border border-white/40 bg-white text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:border-white focus:ring-2 focus:ring-white/50 transition-all"
          />
        </div>

        <div className="flex flex-col gap-1.5 text-left">
          <label htmlFor="email" className="text-xs font-semibold text-white">
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
            className="w-full px-4 py-2.5 rounded-xl border border-white/40 bg-white text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:border-white focus:ring-2 focus:ring-white/50 transition-all"
          />
        </div>

        <div className="flex flex-col gap-1.5 text-left">
          <label htmlFor="password" className="text-xs font-semibold text-white">
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
            className="w-full px-4 py-2.5 rounded-xl border border-white/40 bg-white text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:border-white focus:ring-2 focus:ring-white/50 transition-all"
          />
        </div>

        <div className="flex gap-2" role="group" aria-label="I am a">
          {ROLES.map((r) => (
            <button
              key={r.value}
              type="button"
              aria-pressed={role === r.value}
              onClick={() => setRole(r.value)}
              className="flex-1 text-[13px] font-semibold text-white/70 bg-white/10 border border-white/20 rounded-xl py-2.5 cursor-pointer transition-colors aria-pressed:bg-white aria-pressed:text-slate-900 aria-pressed:border-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
            >
              {r.label}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-1.5 text-left">
          <label htmlFor="department" className="text-xs font-semibold text-white">
            Department <span className="opacity-60 font-normal">(optional)</span>
          </label>
          <input
            id="department"
            name="department"
            type="text"
            placeholder="Computer Science"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-white/40 bg-white text-slate-900 text-sm placeholder:text-slate-400 focus:outline-none focus:border-white focus:ring-2 focus:ring-white/50 transition-all"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 mt-2 rounded-xl bg-[#0b132b] text-white font-bold text-sm hover:bg-[#121f42] active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed transition-all shadow-lg"
        >
          {isSubmitting ? "Creating account…" : "Create account"}
        </button>
      </form>

      <p className="text-xs text-white/80 text-center mt-6">
        Already have an account?{" "}
        <Link href="/login" className="font-bold text-white hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
