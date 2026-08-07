import Link from "next/link";
import { Building2, GraduationCap, Mail } from "lucide-react";
import type { AuthUser } from "@/lib/auth/types";
import { Card } from "./Card";

function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function roleLabel(role: AuthUser["role"]): string {
  return role === "STUDENT" ? "Student" : role === "LECTURER" ? "Lecturer" : "Admin";
}

export function ProfileCard({ user }: { user: AuthUser }) {
  return (
    <Card className="flex flex-col items-center text-center p-6">
      <span className="flex items-center justify-center w-16 h-16 rounded-full bg-[var(--brand-500)] text-white text-xl font-bold mb-3">
        {initials(user.fullName)}
      </span>
      <p className="text-base font-bold text-[var(--ink-900)]">{user.fullName}</p>
      <p className="text-[12.5px] text-[var(--ink-500)] mb-4">@{user.email.split("@")[0]}</p>

      <div className="w-full flex flex-col gap-2.5 text-left border-t border-[var(--paper-200)] pt-4">
        <div className="flex items-center gap-2.5 text-[13px]">
          <GraduationCap className="w-4 h-4 text-[var(--ink-400)] shrink-0" strokeWidth={1.8} />
          <span className="text-[var(--ink-600)]">Role</span>
          <span className="ml-auto font-semibold text-[var(--ink-900)]">{roleLabel(user.role)}</span>
        </div>
        <div className="flex items-center gap-2.5 text-[13px]">
          <Building2 className="w-4 h-4 text-[var(--ink-400)] shrink-0" strokeWidth={1.8} />
          <span className="text-[var(--ink-600)]">Department</span>
          <span className="ml-auto font-semibold text-[var(--ink-900)] truncate">{user.department ?? "—"}</span>
        </div>
        <div className="flex items-center gap-2.5 text-[13px]">
          <Mail className="w-4 h-4 text-[var(--ink-400)] shrink-0" strokeWidth={1.8} />
          <span className="text-[var(--ink-600)]">Email</span>
          <span className="ml-auto font-semibold text-[var(--ink-900)] truncate">{user.email}</span>
        </div>
      </div>

      <Link
        href="/dashboard/profile"
        className="w-full mt-5 inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-[var(--brand-500)] text-white text-sm font-bold no-underline hover:bg-[var(--brand-600)] transition-colors"
      >
        Edit Profile
      </Link>
    </Card>
  );
}
