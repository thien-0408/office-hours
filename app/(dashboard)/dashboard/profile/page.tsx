"use client";

import { useState } from "react";
import Image from "next/image";
import { KeyRound, Pencil } from "lucide-react";
import { AvatarPickerModal } from "@/components/dashboard/AvatarPickerModal";
import { Card } from "@/components/dashboard/Card";
import { ConfirmModal } from "@/components/ConfirmModal";
import { FormField, TextInput } from "@/components/dashboard/FormField";
import { SectionHeader } from "@/components/dashboard/SectionHeader";
import { ToggleSwitch } from "@/components/dashboard/ToggleSwitch";
import { useAuth } from "@/lib/auth/auth-context";
import { initials } from "@/lib/avatar";
import { setAvatarOverride, useAvatarIndex } from "@/lib/use-avatar";
import { getMockNotificationPrefs } from "@/lib/office-hours/mock-data";

export default function ProfilePage() {
  const { user } = useAuth();
  const prefs0 = getMockNotificationPrefs();

  // Seeded once from `user` via the useState initializer — re-syncing on a
  // changed user isn't needed here since a session's user identity is fixed
  // for the lifetime of this page (no in-place account switching).
  const [fullName, setFullName] = useState(() => user?.fullName ?? "");
  const [department, setDepartment] = useState(() => user?.department ?? "");
  const [savedIdentity, setSavedIdentity] = useState(false);

  const [prefs, setPrefs] = useState(prefs0);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordConfirmOpen, setPasswordConfirmOpen] = useState(false);
  const [passwordChanged, setPasswordChanged] = useState(false);

  const [avatarPickerOpen, setAvatarPickerOpen] = useState(false);
  const avatarIndex = useAvatarIndex(user?.id ?? -1);

  if (!user) return null;

  const passwordValid = newPassword.length >= 8 && newPassword === confirmPassword && currentPassword.length > 0;

  return (
    <div className="flex flex-col gap-6 max-w-xl">
      <h1 className="text-2xl font-bold text-[var(--ink-900)]">My Profile</h1>

      <Card>
        <SectionHeader title="Identity" />
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setAvatarPickerOpen(true)}
              className="group relative rounded-full"
              aria-label="Change avatar"
            >
              <Image
                src={`/memoji/${avatarIndex}.png`}
                alt={initials(user.fullName)}
                width={64}
                height={64}
                className="w-16 h-16 rounded-full object-cover ring-2 ring-[var(--brand-50)] bg-[var(--brand-50)]"
              />
              <span className="absolute -bottom-1 -right-1 flex items-center justify-center w-6 h-6 rounded-full bg-[var(--brand-500)] text-white ring-2 ring-white group-hover:bg-[var(--brand-600)] transition-colors">
                <Pencil className="w-3 h-3" strokeWidth={2.2} />
              </span>
            </button>
            <div>
              <p className="text-sm font-semibold text-[var(--ink-900)]">Avatar</p>
              <button
                type="button"
                onClick={() => setAvatarPickerOpen(true)}
                className="text-[13px] font-semibold text-[var(--brand-600)] hover:text-[var(--brand-700)] transition-colors"
              >
                Change avatar
              </button>
            </div>
          </div>
          <FormField label="Full name">
            <TextInput
              value={fullName}
              onChange={(e) => {
                setFullName(e.target.value);
                setSavedIdentity(false);
              }}
            />
          </FormField>
          <FormField label="Department">
            <TextInput
              value={department ?? ""}
              onChange={(e) => {
                setDepartment(e.target.value);
                setSavedIdentity(false);
              }}
            />
          </FormField>
          <FormField label="Email">
            <TextInput value={user.email} disabled />
          </FormField>
          {/* No backend yet — "Save" only updates local state. Real wiring
              point: PATCH /users/me, then refreshUser() on auth-context. */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSavedIdentity(true)}
              className="px-4 py-2 rounded-xl bg-[var(--brand-500)] text-white text-sm font-bold hover:bg-[var(--brand-600)] transition-colors w-fit"
            >
              Save changes
            </button>
            {savedIdentity && <span className="text-[13px] text-[var(--success-700)] font-semibold">Saved</span>}
          </div>
        </div>
      </Card>

      <Card>
        <SectionHeader title="Notification preferences" />
        <div className="flex flex-col divide-y divide-[var(--paper-100)]">
          <ToggleSwitch
            label="Booking confirmed"
            description="Email when a lecturer confirms your booking"
            checked={prefs.bookingConfirmed}
            onChange={(v) => setPrefs((p) => ({ ...p, bookingConfirmed: v }))}
          />
          <ToggleSwitch
            label="Booking declined"
            description="Email when a booking is declined or cancelled"
            checked={prefs.bookingDeclined}
            onChange={(v) => setPrefs((p) => ({ ...p, bookingDeclined: v }))}
          />
          <ToggleSwitch
            label="Waitlist offers"
            description="Email when a waitlisted slot opens up"
            checked={prefs.waitlistOffer}
            onChange={(v) => setPrefs((p) => ({ ...p, waitlistOffer: v }))}
          />
          <ToggleSwitch
            label="Reminders"
            description="Email reminders before upcoming bookings"
            checked={prefs.reminders}
            onChange={(v) => setPrefs((p) => ({ ...p, reminders: v }))}
          />
        </div>
      </Card>

      <Card>
        <SectionHeader title="Change password" />
        <div className="flex flex-col gap-4">
          <FormField label="Current password">
            <TextInput
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </FormField>
          <FormField label="New password">
            <TextInput type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          </FormField>
          <FormField label="Confirm new password">
            <TextInput
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </FormField>
          {newPassword.length > 0 && newPassword.length < 8 && (
            <p className="text-[12.5px] text-[var(--danger-700)]">Password must be at least 8 characters.</p>
          )}
          {confirmPassword.length > 0 && newPassword !== confirmPassword && (
            <p className="text-[12.5px] text-[var(--danger-700)]">Passwords don&apos;t match.</p>
          )}
          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={!passwordValid}
              onClick={() => setPasswordConfirmOpen(true)}
              className="px-4 py-2 rounded-xl bg-[var(--brand-500)] text-white text-sm font-bold hover:bg-[var(--brand-600)] transition-colors w-fit disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-[var(--brand-500)]"
            >
              Change password
            </button>
            {passwordChanged && <span className="text-[13px] text-[var(--success-700)] font-semibold">Password changed</span>}
          </div>
        </div>
      </Card>

      <AvatarPickerModal
        open={avatarPickerOpen}
        currentIndex={avatarIndex}
        onSelect={(index) => {
          setAvatarOverride(user.id, index);
          setAvatarPickerOpen(false);
        }}
        onClose={() => setAvatarPickerOpen(false)}
      />

      <ConfirmModal
        open={passwordConfirmOpen}
        icon={KeyRound}
        title="Change your password?"
        description="You'll need your new password the next time you log in."
        confirmLabel="Change password"
        cancelLabel="Cancel"
        onCancel={() => setPasswordConfirmOpen(false)}
        onConfirm={() => {
          setPasswordConfirmOpen(false);
          setPasswordChanged(true);
          setCurrentPassword("");
          setNewPassword("");
          setConfirmPassword("");
        }}
      />
    </div>
  );
}
