"use client";

import { useSyncExternalStore } from "react";
import { MEMOJI_COUNT, hashToIndex } from "@/lib/avatar";

// User-chosen avatar override — no backend field for this yet, so the pick
// persists client-side (per browser) rather than syncing across devices.
// Real wiring point: PATCH /users/me { avatarIndex }, then drop localStorage.
const OVERRIDE_EVENT = "office-hours:avatar-override";

function overrideKey(userId: number): string {
  return `office-hours:avatar:${userId}`;
}

function readOverride(userId: number): number | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(overrideKey(userId));
  const parsed = raw === null ? NaN : Number(raw);
  return Number.isInteger(parsed) && parsed >= 1 && parsed <= MEMOJI_COUNT ? parsed : null;
}

export function setAvatarOverride(userId: number, memojiIndex: number): void {
  window.localStorage.setItem(overrideKey(userId), String(memojiIndex));
  window.dispatchEvent(new Event(OVERRIDE_EVENT));
}

function subscribe(callback: () => void): () => void {
  window.addEventListener(OVERRIDE_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(OVERRIDE_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

// Reactive avatar index for a signed-in user — reflects `setAvatarOverride`
// immediately across every component that calls this hook (topbar, profile
// card, picker), without prop drilling or lifting state into AuthContext for
// what is still a client-only preference.
export function useAvatarIndex(userId: number): number {
  return useSyncExternalStore(
    subscribe,
    () => readOverride(userId) ?? hashToIndex(userId),
    () => hashToIndex(userId)
  );
}

export function useUserAvatarSrc(userId: number): string {
  return `/memoji/${useAvatarIndex(userId)}.png`;
}
