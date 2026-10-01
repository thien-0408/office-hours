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
import { useI18n } from "@/i18n/provider";
import { Button } from "@/components/ui/button";

export default function ProfilePage() {
  const { user } = useAuth();
  const { t } = useI18n();
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
      <h1 className="text-2xl font-bold text-[var(--ink-900)]">{t("profile.title")}</h1>

      <Card>
        <SectionHeader title={t("profile.identity")} />
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <Button variant="bare" size="bare"
              type="button"
              onClick={() => setAvatarPickerOpen(true)}
              className="group relative rounded-full"
              aria-label={t("profile.changeAvatar")}
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
            </Button>
            <div>
              <p className="text-sm font-semibold text-[var(--ink-900)]">{t("profile.avatar")}</p>
              <Button variant="link-brand"
                type="button"
                onClick={() => setAvatarPickerOpen(true)}
              >
                {t("profile.changeAvatar")}
              </Button>
            </div>
          </div>
          <FormField label={t("profile.fullName")}>
            <TextInput
              value={fullName}
              onChange={(e) => {
                setFullName(e.target.value);
                setSavedIdentity(false);
              }}
            />
          </FormField>
          <FormField label={t("profile.department")}>
            <TextInput
              value={department ?? ""}
              onChange={(e) => {
                setDepartment(e.target.value);
                setSavedIdentity(false);
              }}
            />
          </FormField>
          <FormField label={t("auth.email")}>
            <TextInput value={user.email} disabled />
          </FormField>
          {/* No backend yet — "Save" only updates local state. Real wiring
              point: PATCH /users/me, then refreshUser() on auth-context. */}
          <div className="flex items-center gap-3">
            <Button
              type="button"
              onClick={() => setSavedIdentity(true)}
              className="w-fit"
            >
              {t("profile.saveChanges")}
            </Button>
            {savedIdentity && <span className="text-[13px] text-[var(--success-700)] font-semibold">{t("profile.saved")}</span>}
          </div>
        </div>
      </Card>

      <Card>
        <SectionHeader title={t("profile.notifications")} />
        <div className="flex flex-col divide-y divide-[var(--paper-100)]">
          <ToggleSwitch
            label={t("profile.bookingConfirmed")}
            description={t("profile.bookingConfirmed")}
            checked={prefs.bookingConfirmed}
            onChange={(v) => setPrefs((p) => ({ ...p, bookingConfirmed: v }))}
          />
          <ToggleSwitch
            label={t("profile.bookingDeclined")}
            description={t("booking.status.cancelled")}
            checked={prefs.bookingDeclined}
            onChange={(v) => setPrefs((p) => ({ ...p, bookingDeclined: v }))}
          />
          <ToggleSwitch
            label={t("profile.waitlistOffers")}
            description={t("booking.openSlots")}
            checked={prefs.waitlistOffer}
            onChange={(v) => setPrefs((p) => ({ ...p, waitlistOffer: v }))}
          />
          <ToggleSwitch
            label={t("profile.reminders")}
            description={t("profile.reminders")}
            checked={prefs.reminders}
            onChange={(v) => setPrefs((p) => ({ ...p, reminders: v }))}
          />
        </div>
      </Card>

      <Card>
        <SectionHeader title={t("profile.changePassword")} />
        <div className="flex flex-col gap-4">
          <FormField label={t("profile.currentPassword")}>
            <TextInput
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </FormField>
          <FormField label={t("profile.newPassword")}>
            <TextInput type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          </FormField>
          <FormField label={t("profile.confirmPassword")}>
            <TextInput
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </FormField>
          {newPassword.length > 0 && newPassword.length < 8 && (
            <p className="text-[12.5px] text-[var(--danger-700)]">{t("profile.passwordTooShort")}</p>
          )}
          {confirmPassword.length > 0 && newPassword !== confirmPassword && (
            <p className="text-[12.5px] text-[var(--danger-700)]">{t("profile.passwordMismatch")}</p>
          )}
          <div className="flex items-center gap-3">
            <Button
              type="button"
              disabled={!passwordValid}
              onClick={() => setPasswordConfirmOpen(true)}
              className="w-fit disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-[var(--brand-500)]"
            >
              {t("profile.changePassword")}
            </Button>
            {passwordChanged && <span className="text-[13px] text-[var(--success-700)] font-semibold">{t("profile.passwordChanged")}</span>}
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
