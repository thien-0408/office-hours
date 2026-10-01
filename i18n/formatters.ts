import type { Locale } from "@/i18n";

export function localeCode(locale: Locale) {
  return locale === "vi" ? "vi-VN" : "en-US";
}

export function formatDate(value: Date | string | number, locale: Locale, options?: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat(localeCode(locale), options).format(new Date(value));
}

export function formatTime(value: Date | string | number, locale: Locale, options: Intl.DateTimeFormatOptions = {}) {
  return new Intl.DateTimeFormat(localeCode(locale), {
    hour: "numeric",
    minute: "2-digit",
    ...options,
  }).format(new Date(value));
}

export function formatDateTime(value: Date | string | number, locale: Locale, options?: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat(localeCode(locale), options ?? {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function formatNumber(value: number, locale: Locale, options?: Intl.NumberFormatOptions) {
  return new Intl.NumberFormat(localeCode(locale), options).format(value);
}

export function formatRelativeTime(value: number, unit: Intl.RelativeTimeFormatUnit, locale: Locale) {
  return new Intl.RelativeTimeFormat(localeCode(locale), { numeric: "auto" }).format(value, unit);
}

